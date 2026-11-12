import os
import sys
import shutil
import subprocess

def find_file_or_dir(search_dirs, suffix):
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for root, dirs, files in os.walk(sdir):
            for d in dirs:
                if d.endswith(suffix):
                    return os.path.join(root, d)
    return None

def main():
    print("=== Packaging IPA ===")
    
    # 1. Search for .xcarchive across workspace and runner temp
    search_locations = [
        "build",
        "ios/App/build",
        "ios/App",
        os.environ.get("RUNNER_TEMP", ""),
        "."
    ]
    
    archive_path = find_file_or_dir(search_locations, ".xcarchive")
    
    if not archive_path:
        print("ERROR: No .xcarchive directory found anywhere in workspace!")
        print("Workspace root contents:", os.listdir("."))
        if os.path.exists("ios"):
            print("ios/ contents:", os.listdir("ios"))
        if os.path.exists("ios/App"):
            print("ios/App contents:", os.listdir("ios/App"))
        sys.exit(1)
        
    print(f"✅ Found Xcode Archive at: {archive_path}")
    
    # 2. Search for .app bundle inside the archive
    app_path = find_file_or_dir([archive_path], ".app")
    if not app_path:
        print(f"ERROR: No .app bundle found inside {archive_path}!")
        for root, dirs, files in os.walk(archive_path):
            print(f"Archive Dir: {root} -> {dirs}")
        sys.exit(1)
        
    app_name = os.path.basename(app_path)
    print(f"✅ Found app bundle: {app_path} ({app_name})")
    
    # 3. Prepare Payload folder in build/Payload
    os.makedirs("build", exist_ok=True)
    payload_dir = "build/Payload"
    if os.path.exists(payload_dir):
        shutil.rmtree(payload_dir)
    os.makedirs(payload_dir, exist_ok=True)
    
    dest_app = os.path.join(payload_dir, app_name)
    print(f"Copying {app_path} to {dest_app}...")
    shutil.copytree(app_path, dest_app, symlinks=True)
    
    # 4. Copy embedded provisioning profile
    runner_temp = os.environ.get("RUNNER_TEMP", "")
    pp_file = os.path.join(runner_temp, "build_pp.mobileprovision") if runner_temp else ""
    if pp_file and os.path.exists(pp_file):
        dest_pp = os.path.join(dest_app, "embedded.mobileprovision")
        shutil.copyfile(pp_file, dest_pp)
        print(f"✅ Injected provisioning profile into: {dest_pp}")
    else:
        print("Notice: No runner_temp mobileprovision found, keeping existing profile if any.")
        
    # 5. Zip Payload to AnotaYa.ipa
    ipa_path = "build/AnotaYa.ipa"
    if os.path.exists(ipa_path):
        os.remove(ipa_path)
        
    print("Zipping Payload to AnotaYa.ipa...")
    subprocess.run(["zip", "-q", "-r", "AnotaYa.ipa", "Payload"], cwd="build", check=True)
    
    if os.path.exists(ipa_path):
        size_mb = os.path.getsize(ipa_path) / (1024 * 1024)
        print(f"🎉 Successfully created {ipa_path} ({size_mb:.2f} MB)")
    else:
        print(f"ERROR: {ipa_path} was not created!")
        sys.exit(1)

if __name__ == "__main__":
    main()
