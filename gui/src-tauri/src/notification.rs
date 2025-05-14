use std::ffi::c_char;
use tauri::Emitter;
use uuu_rs::uuu_notify;

pub struct NotificationHandler {
    pub total: usize,
    pub current: usize,
    pub notification_type: u32,
    pub last_notification_type: u32,
    pub info: String,
}

extern "C" fn notification_callback(
    nt: uuu_notify,
    p: *mut ::std::os::raw::c_void,
) -> ::std::os::raw::c_int {
    unsafe {
        let nt_handler = &mut *(p as *mut NotificationHandler);
        nt_handler.last_notification_type = nt_handler.notification_type;
        nt_handler.notification_type = nt.type_;
        match nt.type_ {
            uuu_notify_NOTIFY_TYPE_NOTIFY_TRANS_SIZE => {
                nt_handler.total = nt.__bindgen_anon_1.total;
            }

            uuu_notify_NOTIFY_TYPE_NOTIFY_TRANS_POS => {
                nt_handler.current = nt.__bindgen_anon_1.index;
            }

            uuu_notify_NOTIFY_TYPE_NOTIFY_CMD_INFO => {
                let c_char_ptr = nt.__bindgen_anon_1.str_ as *const c_char;
                if c_char_ptr.is_null() {
                    nt_handler.info = String::from("<NULL_INFO>");
                } else {
                    let c_str = std::ffi::CStr::from_ptr(c_char_ptr);
                    nt_handler.info = c_str.to_string_lossy().into_owned();
                }
            }
            _ => {}
        }

        let progess = if nt_handler.total > 0 {
            (nt_handler.current * 100) / nt_handler.total
        } else {
            0
        };

        if let Some(app_handle) = crate::GLOBAL_APP_HANDLE.get() {
            let payload = serde_json::json!({
                "progress": progess,
                "info": nt_handler.info,
                "type": nt_handler.notification_type,
                "last_type": nt_handler.last_notification_type,
            });
            let _ = app_handle.emit("notification", payload);
        }
    }
    0
}

pub fn register_notification_callback(nt_handler: &mut NotificationHandler) {
    unsafe {
        uuu_rs::uuu_register_notify_callback(
            Some(notification_callback),
            nt_handler as *mut _ as *mut ::std::os::raw::c_void,
        );
    }
}
