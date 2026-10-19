# Compiling WinMedia Scanner as a Native Windows .EXE

You can compile and run **WinMedia Scanner** as a standalone native Windows desktop application (`.exe`).

In desktop mode, it uses native Windows File Explorer dialogs (with button labeled **"Scan Folder"**) and direct filesystem access (`fs`), completely bypassing all browser sandboxes and "Upload" prompts.

---

## Method 1: Download & Build the Standalone Windows `.exe`

1. Download the updated project source archive:
   - **Direct Download Link**: `https://ais-pre-byflpsuzhtocwwqpbpmmju-454822803215.us-east5.run.app/WinMediaScanner-Source.zip`
2. Extract the ZIP file into a folder on your Windows computer.
3. Double-click **`build-windows-exe.bat`**.
4. It will install dependencies, compile the application with Vite, and package the Windows `.exe`.
5. It will automatically open the `dist-electron` folder containing:
   - **`WinMedia Scanner Setup 1.0.0.exe`**: Standard Windows installer (desktop shortcut, start menu shortcut, uninstaller).
   - **`WinMedia Scanner 1.0.0.exe`**: Portable standalone executable (no installation required; run directly from any folder or USB drive).

---

## Method 2: Manual Terminal Commands (PowerShell / Command Prompt)

If you prefer building from the terminal on Windows:

```bash
# 1. Install dependencies with legacy peer resolution
npm install --legacy-peer-deps

# 2. Install desktop packaging tools
npm install --save-dev electron electron-builder concurrently --legacy-peer-deps

# 3. Build and package the Windows .exe
npm run build
npx electron-builder --win
```

---

## Method 3: Instant Windows Desktop App (PWA - No Compilation Needed)

If you want an immediate Windows desktop window without running Node.js build commands:
1. Open the app in **Microsoft Edge** or **Google Chrome** on Windows:
   `https://ais-dev-byflpsuzhtocwwqpbpmmju-454822803215.us-east5.run.app`
2. Look at the right side of your browser address bar:
   - Click the **App Available / Install** icon (or menu `...` -> **Apps** -> **Install WinMedia Scanner**).
3. Check **"Pin to taskbar"** and **"Create Desktop shortcut"**.
4. It will now launch in its own standalone native Windows desktop window just like any `.exe` application.
