const electron = require("electron");

if (!global.__codexTrayHooked) {
  const originalSetContextMenu = electron.Tray.prototype.setContextMenu;
  electron.Tray.prototype.setContextMenu = function setContextMenuPatched(menu) {
    global.__codexLastTrayMenu = menu;
    return originalSetContextMenu.call(this, menu);
  };

  const originalSetThumbarButtons = electron.BrowserWindow.prototype.setThumbarButtons;
  electron.BrowserWindow.prototype.setThumbarButtons = function setThumbarButtonsPatched(buttons) {
    global.__codexLastThumbarButtons = buttons;
    return originalSetThumbarButtons.call(this, buttons);
  };

  global.__codexTrayHooked = true;
}
