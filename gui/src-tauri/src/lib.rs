use serde::{Deserialize, Serialize};
use std::path::Path;

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

        Ok(parse_output)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_num_devices,
            extract_and_parse_async
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
