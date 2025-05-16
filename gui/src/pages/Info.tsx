import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface BuildInfo {
  temp_path: string,
  version: string,
  date: string,
}

const Info = () => {
  const [info, setInfo] = useState<BuildInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        setError("Failed to extract and parse the image.");
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
    <section className="flex flex-col h-full p-8 gap-8">
      <div className="text-2xl">{!info ? "Processing image" : "Review image information"}</div>
      <div className="text-xl border-2 border-black grow flex flex-col items-center justify-center rounded-xl">
        {
          error ? (
            <div className="text-red-500">{error}</div>
          ) : info ? (
            <div className="flex flex-col items-center">
              <div className="size-40 mb-2 border-2 border-black rounded-full"></div>
              <div>Mechanix OS</div>
              <div>Version: {info.version}</div>
              <br />
              <div>Built on {new Date(info.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
          ) : (
            <div>Loading...</div>
          )
        }
      </div>
      <div className="flex justify-end gap-4">
        <Button onClick={handleNext} disabled={info == null}>Next</Button>
        <Button onClick={handleBack}>Back</Button>
      </div>
    </section>

  )
}

export default Info
