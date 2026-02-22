import os
import sys
import json
import platform
import subprocess
import zipfile
import glob
import shutil
import argparse

def build():
    parser = argparse.ArgumentParser(description='Build and package yaru.')
    parser.add_argument('--arch', type=str, choices=['x32', 'x64'], default='x64',
                        help='Target architecture for Windows (default: x64)')
    args = parser.parse_args()

    system = platform.system().lower()
    is_mac = system == 'darwin'
    is_win = system == 'windows'

    # 1. Setup basepath depending on OS
    if is_mac:
        basepath = '/Users/taoliu/Documents/codes/yaru'
        target = 'mac'
    elif is_win:
        basepath = 'C:/Users/george/code/yaru'
        target = 'winX32' if args.arch == 'x32' else 'winX64'
    else:
        print("Unsupported OS")
        sys.exit(1)

    print(f"Using basepath: {basepath}")
    os.chdir(basepath)

    # 2. Update quark_project.json
    project_json_path = os.path.join(basepath, 'quark_project.json')
    with open(project_json_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    for proj in config.get("projects", []):
        proj["logo"] = os.path.join(basepath, "src", "rsync.svg").replace('\\', '/')
        proj["resources"] = os.path.join(basepath, "src").replace('\\', '/')
        proj["out"] = os.path.join(basepath, "bin").replace('\\', '/')
        proj["targets"] = [target]

    with open(project_json_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f"Updated {project_json_path} targets to {target}")

    project_name = config["projects"][0].get("productName", "yaru")
    version = config["projects"][0].get("productVersion", "1.4")
    out_base = config["projects"][0].get("out", os.path.join(basepath, "bin"))

    # Determine specific output directory to clean
    if is_mac:
        out_target_dir = os.path.join(out_base, 'macos')
    else:
        out_target_dir = os.path.join(out_base, 'winx64') if args.arch == 'x64' else os.path.join(out_base, 'winx32')

    # 3. Call quark to assemble
    if is_mac:
        quark_cmd = os.path.expanduser('~/Downloads/macos/quark.app/Contents/MacOS/quark')
        if not os.path.exists(quark_cmd):
            quark_cmd = os.path.expanduser('~/Downloads/macos/quark.app/Content/MacOS/quark')
    else:
        if args.arch == 'x32':
            quark_cmd = os.path.expanduser('~/Downloads/windows/x32/quark.exe')
            if not os.path.exists(quark_cmd):
                quark_cmd = 'C:/Users/george/Downloads/windows/x32/quark.exe'
        else:
            quark_cmd = os.path.expanduser('~/Downloads/windows/quark.exe')
            if not os.path.exists(quark_cmd):
                quark_cmd = 'C:/Users/george/Downloads/windows/quark.exe'

    print(f"Running command: {quark_cmd} {project_json_path} assemble=0")
    if os.path.exists(out_target_dir):
        print(f"Cleaning previous output directory: {out_target_dir}")
        shutil.rmtree(out_target_dir)

    try:
        # Also let's set cwd to where packageResources or packfolder might be expected, or add it to PATH. Wait, the user has packfolder perhaps in ~/Downloads/macos.
        # But we'll just run it as it is.
        subprocess.run([quark_cmd, project_json_path, 'assemble=0'], check=True)
    except FileNotFoundError:
        print(f"Error: {quark_cmd} not found.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error assembling: {e}")
        sys.exit(1)

    # Check output folder
    binary_path = None
    if os.path.exists(out_target_dir):
        for root, dirs, files in os.walk(out_target_dir):
            if is_mac:
                for d in dirs:
                    if d.endswith('.app'):
                        binary_path = os.path.join(root, d)
                        break
            else:
                for f in files:
                    if f.endswith('.exe'):
                        binary_path = os.path.join(root, f)
                        break
            if binary_path:
                break

    if not binary_path or not os.path.exists(binary_path):
        print(f"Error: Generated binary not found in {out_target_dir}")
        sys.exit(1)
    print(f"Found binary at {binary_path}")

    # 4. Zip generated binary file, *.excl, [windows only]cwrsync
    zip_name = f"{project_name}_v{version}_{target}.zip"
    zip_path = os.path.join(basepath, zip_name)
    
    print(f"Creating zip file: {zip_path}")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        def add_file(filepath, arcname):
            # To preserve permissions
            zi = zipfile.ZipInfo.from_file(filepath, arcname)
            zi.compress_type = zipfile.ZIP_DEFLATED
            with open(filepath, 'rb') as f_in:
                zf.writestr(zi, f_in.read())

        # Add binary
        if is_mac:
            app_name = os.path.basename(binary_path)
            for root, dirs, files in os.walk(binary_path):
                # Add directories to preserve permissions
                for d in dirs:
                    dir_path = os.path.join(root, d)
                    arcname = os.path.join(app_name, os.path.relpath(dir_path, binary_path)) + '/'
                    zi = zipfile.ZipInfo.from_file(dir_path, arcname)
                    zf.writestr(zi, '')
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.join(app_name, os.path.relpath(file_path, binary_path))
                    add_file(file_path, arcname)
            print(f"Added {app_name} to zip")
        else:
            add_file(binary_path, os.path.basename(binary_path))
            print(f"Added {os.path.basename(binary_path)} to zip")
            
        # Add *.excl files
        excl_files = glob.glob(os.path.join(basepath, '*.excl'))
        for excl in excl_files:
            add_file(excl, os.path.basename(excl))
            print(f"Added {os.path.basename(excl)} to zip")
            
        # Add cwrsync (Windows only)
        if is_win:
            cwrsync_dir = os.path.expanduser('~/Downloads/cwrsync')
            if not os.path.exists(cwrsync_dir):
                cwrsync_dir = 'C:/Users/george/Downloads/cwrsync'
                
            if os.path.exists(cwrsync_dir):
                for root, dirs, files in os.walk(cwrsync_dir):
                    # Add directories
                    for d in dirs:
                        dir_path = os.path.join(root, d)
                        arcname = os.path.join('cwrsync', os.path.relpath(dir_path, cwrsync_dir)) + '/'
                        zi = zipfile.ZipInfo.from_file(dir_path, arcname)
                        zf.writestr(zi, '')
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.join('cwrsync', os.path.relpath(file_path, cwrsync_dir))
                        add_file(file_path, arcname)
                print(f"Added cwrsync folder to zip")
            else:
                print(f"Warning: cwrsync folder not found at {cwrsync_dir}")

    print(f"Successfully created {zip_name}")

if __name__ == '__main__':
    build()
