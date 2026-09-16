import os
import re
import datetime
import glob

# Project Root (one level up from scripts)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_DIR = os.path.dirname(__file__)

# Keywords that suggest modifying state in AWS
MODIFY_KEYWORDS = [
    r'\.create_', r'\.delete_', r'\.update_', r'\.modify_', 
    r'\.put_', r'\.post_', r'\.terminate_', r'\.stop_', 
    r'\.start_', r'\.attach_', r'\.detach_', r'\.revoke_', 
    r'\.authorize_', r'\.reboot_'
]

# Exceptions (e.g., creating a boto3 client is fine, start_query is a read-only log search)
EXCEPTIONS = [
    r'\.create_client',
    r'\.create_session',
    r'\.create_task',
    r'\.start_query',
    r'\.create_all',
    r'\.start_time',
    r'\.stop_time'
]

def scan_codebase():
    violations = []
    control_usages = []
    
    # Find all workspace backends dynamically
    workspace_dirs = glob.glob(os.path.join(PROJECT_ROOT, 'Workspace-*', 'backend'))
    
    for backend_dir in workspace_dirs:
        workspace_name = os.path.basename(os.path.dirname(backend_dir))
        
        for root, dirs, files in os.walk(backend_dir):
            # Exclude venv, scripts, and hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and not d.startswith('__') and d not in ('venv', 'scripts')]
            
            for file in files:
                if not file.endswith('.py'):
                    continue
                    
                file_path = os.path.join(root, file)
                
                # Identify if this is part of the control module
                is_control = workspace_name == 'Workspace-main' or 'control' in file.lower() or 'control' in root.lower()
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        lines = f.readlines()
                        for line_no, line in enumerate(lines, 1):
                            # Strip comments
                            code_line = line.split('#')[0]
                            
                            for kw in MODIFY_KEYWORDS:
                                if re.search(kw, code_line):
                                    # Check exceptions
                                    if any(re.search(ex, code_line) for ex in EXCEPTIONS):
                                        continue
                                        
                                    rel_path = os.path.relpath(file_path, PROJECT_ROOT)
                                    
                                    # If it's a control module, we log it separately but it's not a hard failure
                                    if is_control:
                                        control_usages.append((rel_path, line_no, line.strip()))
                                    else:
                                        violations.append((rel_path, line_no, line.strip()))
                    except Exception as e:
                        print(f"Failed to read {file_path}: {e}")
                        
    return violations, control_usages

def generate_report(violations, control_usages):
    now_obj = datetime.datetime.now()
    now_str = now_obj.strftime("%Y-%m-%d %H:%M:%S")
    time_str = now_obj.strftime("%d_%b_%H_%M")
    
    output_filename = f"{time_str}_validation.txt"
    output_file = os.path.join(OUTPUT_DIR, output_filename)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"AWS Read-Only Security Validation Report\n")
        f.write(f"Generated On: {now_str}\n")
        f.write("-" * 50 + "\n\n")
        
        if not violations:
            f.write("✅ STATUS: PASS (Read-Only Workspaces verified)\n\n")
            f.write("Explanation:\n")
            f.write("• All scanned code files in the AWS monitoring workspaces were verified.\n")
            f.write("• No AWS state-modifying methods (e.g., create, delete, update, modify, put) were found outside of Control modules.\n\n")
        else:
            f.write("❌ STATUS: FAIL - MODIFYING ACTIONS DETECTED IN READ-ONLY WORKSPACES\n\n")
            f.write("Explanation:\n")
            f.write(f"• Found {len(violations)} potential modifying AWS API calls in strict read-only workspaces.\n")
            f.write("• Please review the following lines of code to ensure they do not alter AWS infrastructure:\n\n")
            
            for file, line, code in violations:
                f.write(f"  -> File: {file} (Line {line})\n")
                f.write(f"     Code: {code}\n\n")
                
        if control_usages:
            f.write("-" * 50 + "\n\n")
            f.write("ℹ️ CONTROL MODULE USAGES (ALLOWED)\n\n")
            f.write("The following modifying API calls were detected, but are located in designated Control Modules (e.g. Workspace-main).\n")
            f.write("These are permitted but logged for auditing purposes.\n\n")
            for file, line, code in control_usages:
                f.write(f"  -> File: {file} (Line {line})\n")
                f.write(f"     Code: {code}\n\n")
                
    print(f"Validation complete. Report generated at: {output_file}")

if __name__ == "__main__":
    print("Scanning AWS codebase for mutating API calls across all workspaces...")
    found_violations, found_controls = scan_codebase()
    generate_report(found_violations, found_controls)
