import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress";
import { open } from "@tauri-apps/plugin-dialog"
import { useState } from "react"
import { useNavigate } from "react-router-dom";

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
    <section className="flex flex-col h-full p-8 gap-8">
      <div className="text-2xl">Upload the flash image</div>
      <div onClick={pickFile} className="text-xl border-2 border-black grow flex flex-col items-center justify-center rounded-xl cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
        {filePath ? "Selected file: " + filePath.split('/').pop() : "Click here to upload (*.zip)"}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={filePath == null}>Next</Button>
      </div>
    </section>

  )
}

export default Upload
