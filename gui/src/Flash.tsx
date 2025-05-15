import { useEffect, useRef, useState } from "react";
import Button from "./components/Button"
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./Flash.css";

type Command = {
  command: string;
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
  const [logs, setLogs] = useState("");
  const [numDevices, setNumDevices] = useState(0);

  useEffect(() => {
    const unlistenCmd = listen<Command>("run-command", (event) => {
      const command = event.payload.command;
      setLogs((prevLogs) => prevLogs + '\n> ' + command);
    });

    const unlistenNotif = listen<Notification>("notification", (event) => {
      const info = event.payload.info;
      const progress = event.payload.progress;
      console.log(event.payload)
      if (info != "") {
        setLogs((prevLogs) => prevLogs + '\n' + info.replace(/\x08/g, ''));
      }
      // Update logs or progress here
      // setLogs((prevLogs) => prevLogs + '\n' + info);
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
    <section className="content">
      <h2>Flashing your device...</h2>
      <div className={"box" + (flashing ? " logs" : " info")}>
        {!flashing ? <h4>{
          numDevices == 0 && "No devices were found. Connect the device in recovery mode and try again."
        }</h4> :
          <h4>
            {logs.split("\n").map((line, idx) => (
              <span key={idx} style={{ color: line.startsWith(">") ? "green" : "white" }}>
                {line}
                <br />
              </span>
            ))}
          </h4>}
      </div>
      <div className="nav">
        <Button label={numDevices == 0 ? "RETRY" : "WAIT"} onClick={handleNext} disabled={numDevices == 0 && flashing}></Button>
        <Button label="BACK" onClick={handleBack} disabled={flashing}></Button>
      </div>
    </section>

  )
}

export default Flash
