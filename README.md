# YARU (Yet Another Rsync UI)

YARU is a lightweight, clean, and powerful cross-platform GUI for `rsync` built using [Sciter.js](https://sciter.com).

There are two primary purposes for this tool:
1. **Frequent Backups:** If you frequently back up files to a server, external disks, or NAS, YARU's task-based management makes it effortless.
2. **Mobile Photo Backup:** Turn your PC or Mac into an rsync daemon server, allowing you to easily back up photos and files from your mobile devices directly to your computer.

---

## Features

- **Task Management:** Create, save, and categorize multiple rsync tasks with customized source and destination paths.
- **Protocol Support:** Supports Local, SSH, and native Rsync daemon protocols.
- **Rsync Daemon UI:** Easily configure and start an rsync daemon on your local machine to accept incoming syncs (perfect for mobile backups).
- **Advanced Exclusions:** Import custom `.excl` files (like `common.excl`, `coding.excl`, or `cnsoft.excl`) to easily exclude massive caches, node_modules, and temporary system files.
- **Dry Run Mode:** Test your rsync configurations safely before actually moving or deleting any data.
- **Live Terminal Output:** Real-time, throttled terminal output within the app so you can monitor progress without UI freezes.

---

## Prerequisites & Installation

Because YARU is a GUI wrapper around the powerful `rsync` command-line utility, you must have `rsync` installed on your system. 

### Windows
Windows does not come with `rsync` natively. You must use **cwRsync**:
1. Download [cwRsync](https://itefix.net/cwrsync).
2. Extract the `cwrsync` folder.
3. Place the `cwrsync` folder directly alongside the YARU executable (or under your Sciter `usciter.exe` directory if developing). YARU will automatically look for `cwrsync/bin/rsync.exe`.

### macOS
macOS ships with a very old version of `rsync` (v2.6.9) which struggles with UTF-8 encoding and modern features. **You must install a modern version via Homebrew**:
1. Install [Homebrew](https://brew.sh/) if you haven't already.
2. Open your terminal and run:
   ```bash
   brew install rsync
   ```
3. YARU will automatically look for the updated binary at `/opt/homebrew/bin/rsync`.

---

## How to Run / Develop

### Pre-packaged Binaries
If you have a pre-compiled binary (e.g., from Quark/Sciter bundling), simply run the executable.

### Running with Sciter SDK (Development)
If you are developing or running from source:
1. Download the [Sciter.js SDK](https://sciter.com/download/).
2. Run the `usciter` executable for your platform.
3. Open `src/main.htm` inside the `usciter` application.

### Building the Project
The project includes a `quark_project.json` and a `build.py` script for bundling the HTML/JS/CSS assets into a standalone native executable using Quark. 
- Ensure your paths in `quark_project.json` are correct for your current environment.
- Run `python build.py` to compile and package the application into a `.zip` release.

---

## Configuration & Storage

All your configurations, tasks, and auth profiles are stored securely in your user home directory under `.yaru/`:
- **macOS/Linux:** `~/.yaru/`
- **Windows:** `C:\Users\YourUsername\.yaru\`

Files generated include:
- `cfg.json` (Main configuration)
- `rsyncd.conf` (Daemon configuration)
- `myexcludes.excl` (Saved exclusion profiles)
- Generated SSH keys (`.ssh/`) context if you manage SSH within the app.

---

## License

*(Add your license details here)*
