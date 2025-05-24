use tauri::Emitter;

#[derive(Debug)]
pub struct Script {
    pub commands: Vec<String>,
    pub uuu_version: Option<String>,
}

impl Script {
    /// Create a new runnable script from a file
    pub fn new(file: &str) -> Self {
        let contents = std::fs::read_to_string(file).unwrap();
        let mut uuu_version = None;
        let commands = contents
            .lines()
            .filter(|s| {
                !s.starts_with("uuu_version") && !s.starts_with('#') && !s.trim().is_empty()
            })
            .map(|s| s.to_string())
            .collect();
        Self {
            commands,
            uuu_version,
        }
    }

    /// Use the image to flash the device
    pub fn with_image(self, image: &str) -> Self {
        let commands = self
            .commands
            .iter()
            .map(|s| {
                if s.contains("_image") {
                    s.replace("_image", image)
                } else {
                    s.to_string()
                }
            })
            .collect();
        let uuu_version = self.uuu_version;
        Self {
            commands,
            uuu_version,
        }
    }

    /// Use the bootloader to flash the device
    pub fn with_bootloader(self, bootloader: &str) -> Self {
        let commands = self
            .commands
            .iter()
            .map(|s| {
                if s.contains("_flash.bin") {
                    s.replace("_flash.bin", bootloader)
                } else {
                    s.to_string()
                }
            })
            .collect();
        let uuu_version = self.uuu_version;
        Self {
            commands,
            uuu_version,
        }
    }

    /// Run the script
    pub fn run_gui(&self) -> Result<(), String> {
        if let Some(app_handle) = crate::GLOBAL_APP_HANDLE.get() {
            let command_count = self.commands.len();
            for (i, command) in self.commands.iter().enumerate() {
                let payload = serde_json::json!({
                    "command": command,
                    "progress": i as f32 * 100.0 / command_count as f32,
                });
                let _ = app_handle.emit("run-command", payload);
                uuu_rs::run_command(command).map_err(|e| e.to_string())?
            }
        }
        Ok(())
    }
}
