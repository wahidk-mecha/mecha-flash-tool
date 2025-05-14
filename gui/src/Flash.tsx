import { useEffect, useRef, useState } from "react";
import Button from "./components/Button"
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type Command = {
  command: string;
}

type Notification = {
  progress: number;
  info: string;
  type: number;
  last_type: number;
};

const Flash = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tempPath = location.state?.tempPath as string;
  const flashCalled = useRef(false);

  const [flashing, setFlashing] = useState(false);
  const [logs, setLogs] = useState("");
  const [cmds, setCmds] = useState("");
  const [numDevices, setNumDevices] = useState(0);

  useEffect(() => {
    const unlistenCmd = listen<Command>("run-command", (event) => {
      const command = event.payload.command;
      setCmds((prevCmds) => prevCmds + '\n' + command);
    });

    const unlistenNotif = listen<Notification>("notification", (event) => {
      const info = event.payload.info;
      const progress = event.payload.progress;
      if (info != "") {
        setCmds((prevCmds) => prevCmds + '\n' + info);
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

  }

  const handleBack = () => {
    navigate("/");
  }

  return (
    <section className="content">
      <h2>Flashing your device...</h2>
      <div className="logs box">
        {!flashing ? <h4>{
          numDevices == 0 && "No devices were found. Connect the device in recovery mode and try again."
        }</h4> :
          <h4>
            {cmds.split("\n").map((line, idx) => (
              <span key={idx}>
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
