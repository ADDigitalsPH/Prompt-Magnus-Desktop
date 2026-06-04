import { Minus, Square, X } from "lucide-react";
import { dragMainWindow, hideMainWindow, minimizeMainWindow, toggleMaximizeMainWindow } from "../hooks/useTauriBridge";
import logo from "../assets/fab-logo.png";

export function WindowTitleBar() {
  function startDrag(event: React.MouseEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    void dragMainWindow();
  }

  return (
    <header className="window-titlebar" data-tauri-drag-region onMouseDown={startDrag}>
      <div className="window-titlebar-brand" data-tauri-drag-region>
        <div className="titlebar-brand-mark" data-tauri-drag-region>
          <img alt="" data-tauri-drag-region src={logo} />
        </div>
        <span data-tauri-drag-region>Prompt Magnus Desktop</span>
      </div>

      <div className="window-titlebar-controls" onMouseDown={(event) => event.stopPropagation()}>
        <button
          aria-label="Minimize window"
          className="window-control"
          onClick={() => void minimizeMainWindow()}
          type="button"
        >
          <Minus size={16} />
        </button>
        <button
          aria-label="Maximize window"
          className="window-control"
          onClick={() => void toggleMaximizeMainWindow()}
          type="button"
        >
          <Square size={13} />
        </button>
        <button
          aria-label="Close to tray"
          className="window-control close"
          onClick={() => void hideMainWindow()}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
