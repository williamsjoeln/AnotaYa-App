import os
import sys
import shutil
import subprocess

def main():
    print("=== Packaging IPA ===")
    
    # 1. Search for .app bundle in build/App.xcarchive
    app_path = None
    archive_dir = "build/App.xcarchive"
    
    if not os.path.exists(archive_dir):
        print(f"ERROR: {archive_dir} does not exist!")
        if os.path.exists("build"):
            print("Contents of build/:", os.listdir("build"))
        sys.exit(1)
        
    for root, dirs, files in os.walk(archive_dir):
        for d in dirs:
            if d.endswith(".app"):
                app_path = os.path.join(root, d)
                break
        if app_path:
            break
            
    if not app_path:
        print(f"ERROR: No .app bundle found inside {archive_dir}!")
        for root, dirs, files in os.walk("build"):
            print(f"Dir: {root} -> {dirs}")
        sys.exit(1)
        
    app_name = os.path.basename(app_path)
    print(f"✅ Found app bundle: {app_path} ({app_name})")
    
    # 2. Prepare Payload folder
    payload_dir = "build/Payload"
    if os.path.exists(payload_dir):
        shutil.rmtree(payload_dir)
    os.makedirs(payload_dir, exist_ok=True)
    
    dest_app = os.path.join(payload_dir, app_name)
    print(f"Copying {app_path} to {dest_app}...")
    shutil.copytree(app_path, dest_app, symlinks=True)
    
    # 3. Copy embedded provisioning profile
    runner_temp = os.environ.get("RUNNER_TEMP", "")
    pp_file = os.path.join(runner_temp, "build_pp.mobileprovision") if runner_temp else ""
    if pp_file and os.path.exists(pp_file):
        dest_pp = os.path.join(dest_app, "embedded.mobileprovision")
        shutil.copyfile(pp_file, dest_pp)
        print(f"✅ Copied {pp_file} to {dest_pp}")
    else:
        print("Notice: No runner_temp mobileprovision found, keeping existing profile if any.")
        
    # 4. Zip Payload to AnotaYa.ipa
    ipa_path = "build/AnotaYa.ipa"
    if os.path.exists(ipa_path):
        os.remove(ipa_path)
        
    print("Creating AnotaYa.ipa...")
    subprocess.run(["zip", "-q", "-r", "AnotaYa.ipa", "Payload"], cwd="build", check=True)
    
    if os.path.exists(ipa_path):
        size_mb = os.path.getsize(ipa_path) / (1024 * 1024)
        print(f"🎉 Successfully created {ipa_path} ({size_mb:.2f} MB)")
    else:
        print(f"ERROR: {ipa_path} was not created!")
        sys.exit(1)

if __name__ == "__main__":
    main()
