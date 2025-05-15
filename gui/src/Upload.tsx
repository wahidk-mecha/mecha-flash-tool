import Button from "./components/Button"
import { open } from "@tauri-apps/plugin-dialog"
import { useState } from "react"
import { useNavigate } from "react-router-dom";
import "./Upload.css";

const Upload = () => {
  const navigate = useNavigate();
  const [filePath, setFilePath] = useState<string | null>(null)

  const pickFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Zip files',
            extensions: ['zip']
          }
        ]
      });

      if (selected) {
        setFilePath(selected as string)
        console.log("Selected file:", selected)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleNext = () => {
    if (filePath) {
      navigate("/info", { state: { filePath } });
    }
  }

  return (
    <section className="content">
      <h2>Upload the flash image</h2>
      <div onClick={pickFile} className="upload box">
        {filePath ? "Selected file: " + filePath.split('/').pop() : "Click here to upload (*.zip)"}
      </div>
      <div className="nav">
        <Button label="NEXT" onClick={handleNext} disabled={!filePath}></Button>
      </div>
    </section>

  )
}

export default Upload
