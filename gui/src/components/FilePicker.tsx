import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

const FilePicker = () => {
  return (
    <div>
      <button style={{ border: "none", fontSize: "1.4rem" }} onClick={pickFile}>Click here to upload (*.zip)</button>
      {filePath && (
        <p>
          Selected file path: <code>{filePath}</code>
        </p>
      )}
    </div>
  )
}

export default FilePicker
