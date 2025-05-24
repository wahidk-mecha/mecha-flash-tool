import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Progress } from "@/components/ui/progress";

type Command = {
  command: string;
  progress: number;
}

type Notification = {
  progress: number;
  info: string;
  type: number;
  last_type: number;
};

function processBackspaces(input: string): string {
  const result = [];
  for (const char of input) {
    if (char === '\b') {
      if (result.length > 0) {
        result.pop(); // remove previous char
      }
    } else {
      result.push(char);
    }
  }
  return result.join('');
}

const Flash = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tempPath = location.state?.tempPath as string;
  const flashCalled = useRef(false);

  const [flashing, setFlashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState("");
  const [mainProgress, setMainProgress] = useState(0);
  const [subProgress, setSubProgress] = useState(0);
  const [numDevices, setNumDevices] = useState(0);

  useEffect(() => {
    const unlistenCmd = listen<Command>("run-command", (event) => {
      const command = event.payload.command;
      setLogs((prevLogs) => prevLogs + '\n> ' + command);
      setMainProgress(event.payload.progress);
    });

    const unlistenNotif = listen<Notification>("notification", (event) => {
      const info = event.payload.info.trim();
      const type = event.payload.type;
      const progress = event.payload.progress;
      console.log("Notification: ", info, type, progress);
      if (type == 8) {
        setSubProgress(progress);
      } else if (type != 4) {
        setSubProgress(0);
      }
      if (info != "") {
        setLogs((prevLogs) => prevLogs + '\n' + info.trim().replace(/\x08/g, ''));
      }
    });

    return () => {
      unlistenCmd.then((f) => f());
      unlistenNotif.then((f) => f());
    };
  }, []);


  const getNumDevices = async () => {
    setNumDevices(await invoke("get_num_devices"));
  }

  const flash = async () => {
    setFlashing(true);
    try {
      const result = await invoke("flash_async", { tempDir: tempPath });
    } catch (e) {
      console.error(e);
      setError("Failed to flash the device.");
    } finally {
      setDone(true);
    }
  }

  useEffect(() => {
    getNumDevices();
  }, []);

  useEffect(() => {
    if (numDevices > 0 && !flashing && !flashCalled.current) {
      flash();
    }
  }, [numDevices, flashing]);

  const handleNext = () => {
    if (numDevices == 0) {
      getNumDevices();
    }
  }

  const handleBack = () => {
    navigate("/");
  }

  return (
    <section className="flex flex-col h-full p-8 gap-8">
      <div className="text-2xl">{
        !flashing &&
          numDevices == 0 ?
          "Looking for devices" :
          "Flashing your device, do not disconnect it."
      }</div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 ">
          <Progress value={mainProgress} className="w-full bg-gray-400" />
          <div className="text-xl ml-4">
            {mainProgress == 100 ? "Done" : Math.floor(mainProgress) + "%"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Progress value={subProgress} className="bg-gray-400" />
          <div className="text-xl ml-4">
            {Math.floor(subProgress) + "%"}
          </div>
        </div>
      </div>

      <div className="text-xl border-2 border-black grow flex flex-col justify-center">
        {!flashing &&
          numDevices == 0 ?
          <div className="text-center">
            No devices found. <br /> Are you sure the device is connected in recovery mode?
          </div> :
          <ScrollArea className="grow h-0 font-mono bg-black">
            {logs.split("\n").map((line, idx) => (
              <span key={idx} className={line.startsWith(">") ? "text-green-600" : "text-white"}>
                {line}
                <br />
              </span>
            ))}
          </ScrollArea>}
      </div>
      <div className="flex justify-end gap-4">
        {numDevices == 0 && !flashing && <Button onClick={getNumDevices} className={flashing ? "size-0" : ""}>Retry</Button>}
        <Button onClick={handleNext} className={done ? "" : "hidden"}>Finish</Button>
        <Button onClick={handleBack} disabled={flashing}>Back</Button>
      </div>
    </section>

  )
}

export default Flash
