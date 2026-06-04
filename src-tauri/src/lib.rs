use std::{
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Default)]
struct AppState {
    paste_target: Mutex<Option<isize>>,
}

#[tauri::command]
fn simulate_paste() -> Result<(), String> {
    platform_paste()
}

#[tauri::command]
fn paste_prompt(
    body: String,
    restore_clipboard: bool,
    app: tauri::AppHandle,
    state: State<AppState>,
) -> Result<(), String> {
    paste_prompt_to_target(&app, &state, body, restore_clipboard)
}

#[tauri::command]
fn open_new_prompt(app: tauri::AppHandle) {
    emit_to_main(&app, "new-prompt");
}

#[tauri::command]
fn close_launcher(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("launcher") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn drag_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window was not found.".to_string())?;

    window.start_dragging().map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn minimize_main_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
fn toggle_main_window_maximize(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        match window.is_maximized() {
            Ok(true) => {
                let _ = window.unmaximize();
            }
            Ok(false) => {
                let _ = window.maximize();
            }
            Err(_) => {}
        }
    }
}

#[cfg(windows)]
fn platform_paste() -> Result<(), String> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_V,
    };

    let mut inputs = [
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: 0,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_V,
                    wScan: 0,
                    dwFlags: 0,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_V,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
    ];

    let sent = unsafe {
        SendInput(
            inputs.len() as u32,
            inputs.as_mut_ptr(),
            std::mem::size_of::<INPUT>() as i32,
        )
    };

    if sent == inputs.len() as u32 {
        Ok(())
    } else {
        Err("Windows SendInput failed to simulate Ctrl+V.".to_string())
    }
}

#[cfg(windows)]
fn capture_paste_target(state: &State<AppState>) {
    use windows_sys::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    let hwnd = unsafe { GetForegroundWindow() };
    if !hwnd.is_null() {
        if let Ok(mut target) = state.paste_target.lock() {
            *target = Some(hwnd as isize);
        }
    }
}

#[cfg(not(windows))]
fn capture_paste_target(_state: &State<AppState>) {}

#[cfg(windows)]
fn focus_paste_target(state: &State<AppState>) -> Result<(), String> {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, IsIconic, IsWindow, SetForegroundWindow, ShowWindow, SW_RESTORE,
    };

    let target = state
        .paste_target
        .lock()
        .map_err(|_| "Could not read the previous paste target.".to_string())?
        .ok_or_else(|| "No previous paste target was captured.".to_string())?;
    let hwnd = target as windows_sys::Win32::Foundation::HWND;

    if unsafe { IsWindow(hwnd) } == 0 {
        return Err("The previous paste target is no longer available.".to_string());
    }

    if unsafe { IsIconic(hwnd) } != 0 {
        unsafe {
            ShowWindow(hwnd, SW_RESTORE);
        }
    }

    unsafe {
        SetForegroundWindow(hwnd);
    }

    let deadline = Instant::now() + Duration::from_millis(700);
    while Instant::now() < deadline {
        if unsafe { GetForegroundWindow() } == hwnd {
            return Ok(());
        }
        thread::sleep(Duration::from_millis(20));
    }

    Err("Could not restore focus to the previous paste target.".to_string())
}

#[cfg(not(windows))]
fn focus_paste_target(_state: &State<AppState>) -> Result<(), String> {
    Ok(())
}

fn paste_prompt_to_target(
    app: &tauri::AppHandle,
    state: &State<AppState>,
    body: String,
    restore_clipboard: bool,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("launcher") {
        let _ = window.hide();
    }

    focus_paste_target(state)?;

    let mut clipboard = arboard::Clipboard::new().map_err(|error| error.to_string())?;
    let previous = if restore_clipboard {
        clipboard.get_text().ok()
    } else {
        None
    };

    clipboard
        .set_text(body)
        .map_err(|error| format!("Could not write prompt to clipboard: {error}"))?;
    thread::sleep(Duration::from_millis(80));
    platform_paste()?;
    thread::sleep(Duration::from_millis(260));

    if let Some(previous_text) = previous {
        let _ = clipboard.set_text(previous_text);
    }

    Ok(())
}

#[cfg(not(windows))]
fn platform_paste() -> Result<(), String> {
    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn emit_to_main(app: &tauri::AppHandle, event: &str) {
    show_main_window(app);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit(event, ());
    }
}

fn show_launcher_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("launcher") {
        let is_already_open = window.is_visible().unwrap_or(false);
        if !is_already_open {
            let state = app.state::<AppState>();
            capture_paste_target(&state);
        }

        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.center();
        let _ = window.set_focus();
        let _ = window.emit("open-launcher", ());
    }
}

fn create_launcher_window(app: &tauri::App) -> tauri::Result<()> {
    let launcher = WebviewWindowBuilder::new(
        app,
        "launcher",
        WebviewUrl::App("index.html?window=launcher".into()),
    )
    .title("Prompt Magnus Launcher")
    .inner_size(560.0, 390.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .center()
    .visible(false)
    .build()?;

    let close_window = launcher.clone();
    launcher.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = close_window.hide();
        }
    });

    Ok(())
}

fn register_global_shortcuts(app: &tauri::App) -> Result<(), String> {
    let launcher_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);
    let save_clipboard_shortcut =
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS);

    app.global_shortcut()
        .on_shortcut(launcher_shortcut, |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                show_launcher_window(app);
            }
        })
        .map_err(|error| format!("Failed to register Ctrl+Space shortcut: {error}"))?;

    app.global_shortcut()
        .on_shortcut(save_clipboard_shortcut, |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                emit_to_main(app, "new-prompt");
            }
        })
        .map_err(|error| format!("Failed to register Ctrl+Shift+S shortcut: {error}"))?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            close_launcher,
            drag_main_window,
            hide_main_window,
            minimize_main_window,
            open_new_prompt,
            paste_prompt,
            simulate_paste,
            toggle_main_window_maximize
        ])
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open Prompt Library", true, None::<&str>)?;
            let launcher =
                MenuItem::with_id(app, "launcher", "Open Launcher", true, Some("Ctrl+Space"))?;
            let new_prompt =
                MenuItem::with_id(app, "new-prompt", "New Prompt", true, Some("Ctrl+N"))?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &launcher, &new_prompt, &quit])?;

            let icon = app
                .default_window_icon()
                .cloned()
                .ok_or_else(|| "Missing default window icon".to_string())?;

            TrayIconBuilder::new()
                .tooltip("Prompt Magnus Desktop")
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        show_main_window(app);
                    }
                    "launcher" => {
                        show_launcher_window(app);
                    }
                    "new-prompt" => {
                        emit_to_main(app, "new-prompt");
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            create_launcher_window(app)?;
            register_global_shortcuts(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let close_window = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = close_window.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Prompt Magnus Desktop");
}
