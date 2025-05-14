import { useEffect, useState } from "react";
import Button from "./components/Button"
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface BuildInfo {
  temp_path: string,
  version: string,
  date: string,
}

const Info = () => {
  const [info, setInfo] = useState<BuildInfo | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const filePath = location.state?.filePath as string;

  // Invoke Rust function to extract the zip file and read manifest
  // Until read, show loading

  // Call getInfo when the component mounts
  useEffect(() => {
    const getInfo = async () => {
      try {
        const data = await invoke("extract_and_parse_async", { image: filePath });
        setInfo(data as BuildInfo);
      } catch (e) {
        console.error(e);
      }
    }
    getInfo();
  }, []);

  const handleNext = () => {
    navigate("/flash", { state: { tempPath: info?.temp_path } });
  }

  const handleBack = () => {
    navigate("/", { state: { filePath } });
  }

  return (
    <section className="content">
      <h2>{!info ? "Processing image." : "Review image information"}</h2>
      <div className="info box">
        {info ? (
          <div style={{ textAlign: "center" }}>
            <h3>Mechanix OS</h3>
            <p>Version: {info.version}</p>
            <br />
            <h4>Built on {new Date(info.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h4>
          </div>
        ) : (
          <h4>Loading...</h4>
        )}
      </div>
      <div className="nav">
        <Button label="NEXT" onClick={handleNext} disabled={false}></Button>
        <Button label="BACK" onClick={handleBack}></Button>
      </div>
    </section>

  )
}

export default Info
