import { useEffect, useState } from "react";
import Button from "./components/Button"
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

const Flash = () => {
  const [flashing, setFlashing] = useState(true);
  const [numDevices, setNumDevices] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const getNumDevices = async () => {
    setNumDevices(await invoke("get_num_devices"));
  }

  useEffect(() => {
    getNumDevices();
  }, [])

  const handleNext = () => {

  }

  const handleBack = () => {
    navigate("/");
  }

  return (
    <section className="content">
      <h2>Flashing your device...</h2>
      <div className="logs box">
        <h4>{"Found " + numDevices + " devices"}</h4>
      </div>
      <div className="nav">
        <Button label="WAIT" onClick={handleNext} disabled={flashing}></Button>
        <Button label="BACK" onClick={handleBack} disabled={flashing}></Button>
      </div>
    </section>

  )
}

export default Flash
