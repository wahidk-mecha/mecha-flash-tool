pub mod notification;
pub mod script;

use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

use once_cell::sync::OnceCell;
use tauri::AppHandle;

static GLOBAL_APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
pub fn set_app_handle(app_handle: AppHandle) {
    GLOBAL_APP_HANDLE
        .set(app_handle)
        .expect("AppHandle already set");
}

#[tauri::command]
fn get_num_devices() -> usize {
    uuu_rs::devices::get_devices().len()
}

/// Manifest schema
#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct Package {
    name: String,
    version: String,
    size: u64,
    sha2: String,
}

/// Machine information schema
#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct MachineInfo {
    name: String,
    r#gen: String,
    rev: String,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct Packages {
    linux: Package,
    rootfs: Package,
    uboot: Package,
    dtb: Package,
    mfgtools: Package,
    script: Package,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct Manifest {
    id: String,
    version: String,
    channel: String,
    created_at: String,
    description: String,
    url: String,

    machine: MachineInfo,
    packages: Packages,
}

#[derive(Serialize)]
struct ParseOutput {
    temp_path: String,
    version: String,
    date: String,
}

#[tauri::command]
fn extract_and_parse(image: String) -> Result<ParseOutput, String> {
    let temp_dir = tempfile::tempdir().map_err(|e| e.to_string())?;
    let temp_path = temp_dir.path();
    let file = std::fs::File::open(&image).unwrap();
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    archive.extract(temp_path).map_err(|e| e.to_string())?;

    let manifest = temp_path.join("manifest.yml");
    if !manifest.exists() {
        return Err("The package does not contain a manifest.yml file.".to_string());
    }

    let f = std::fs::File::open(&manifest).map_err(|e| e.to_string())?;
    let manifest: Manifest = serde_yml::from_reader(f).map_err(|e| e.to_string())?;
    let version = manifest.version;
    let date = manifest.created_at;

    let parse_output = ParseOutput {
        temp_path: temp_path.to_string_lossy().to_string(),
        version,
        date,
    };

    Ok(parse_output)
}

#[tauri::command(async)]
async fn extract_and_parse_async(image: String) -> Result<ParseOutput, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let temp_dir = tempfile::tempdir().map_err(|e| e.to_string())?;
        let temp_path = temp_dir.path();
        let file = std::fs::File::open(&image).unwrap();
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        archive.extract(temp_path).map_err(|e| e.to_string())?;

        let manifest = temp_path.join("manifest.yml");
        if !manifest.exists() {
            return Err("The package does not contain a manifest.yml file.".to_string());
        }

        let f = std::fs::File::open(&manifest).map_err(|e| e.to_string())?;
        let manifest: Manifest = serde_yml::from_reader(f).map_err(|e| e.to_string())?;
        let version = manifest.version;
        let date = manifest.created_at;

        let parse_output = ParseOutput {
            temp_path: temp_path.to_string_lossy().to_string(),
            version,
            date,
        };

        // Keep temp directory, delete it later
        let _ = temp_dir.keep();

        Ok(parse_output)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command(async)]
async fn flash_async(temp_dir: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        // Check if the directory exists
        let temp_path = Path::new(&temp_dir);
        let manifest = temp_path.join("manifest.yml");
        if !manifest.exists() {
            return Err("The package does not contain a manifest.yml file.".to_string());
        }

        // Check if the manifest file exists and parse it
        let f = std::fs::File::open(&manifest).map_err(|e| e.to_string())?;
        let manifest: Manifest = serde_yml::from_reader(f).map_err(|e| e.to_string())?;

        std::env::set_current_dir(temp_path).unwrap();

        // TODO: Verify files with manifest

        let mut script = script::Script::new(&manifest.packages.script.name)
            .with_image(&manifest.packages.rootfs.name)
            .with_bootloader(&manifest.packages.uboot.name);

        // Register the notification callback
        let mut nt_handler = notification::NotificationHandler {
            total: 0,
            current: 0,
            notification_type: 0,
            last_notification_type: 0,
            info: String::new(),
        };
        notification::register_notification_callback(&mut nt_handler);

        script.run_gui().map_err(|e| e.to_string())?;

        // Delete the temp directory
        let _ = fs::remove_dir(temp_dir);

        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            set_app_handle(app.handle().clone());
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_num_devices,
            extract_and_parse_async,
            flash_async
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
