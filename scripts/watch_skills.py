#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import select

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_DIR = os.path.join(PROJECT_DIR, "skills")

def show_popup_and_push(changed_file):
    rel_path = os.path.relpath(changed_file, PROJECT_DIR)
    filename = os.path.basename(changed_file)
    
    # AppleScript for native macOS dialog box
    ascript = f'''
    try
        set res to button returned of (display dialog "偵測到技能檔 [{filename}] 已儲存！\\n\\n是否立即幫您 Git Push 上傳至 GitHub？" buttons {{"否", "是"}} default button "是" with title "🤖 Parenting Copilot 自動上傳" with icon note)
        return res
    on error number -128
        return "否"
    end try
    '''
    
    try:
        proc = subprocess.run(["osascript", "-e", ascript], capture_output=True, text=True)
        user_choice = proc.stdout.strip()
        
        if user_choice == "是":
            # Run git add, commit, push
            add_proc = subprocess.run(["git", "add", changed_file], cwd=PROJECT_DIR, capture_output=True, text=True)
            commit_msg = f"update skill: {filename}"
            commit_proc = subprocess.run(["git", "commit", "-m", commit_msg], cwd=PROJECT_DIR, capture_output=True, text=True)
            push_proc = subprocess.run(["git", "push"], cwd=PROJECT_DIR, capture_output=True, text=True)
            
            if push_proc.returncode == 0:
                notif_script = f'display notification "已成功將 [{filename}] Git Push 至 GitHub！" with title "Parenting Copilot 育兒副駕駛"'
                subprocess.run(["osascript", "-e", notif_script])
            else:
                err_script = f'display notification "Git Push 上傳失敗，請檢查網路或 Git 狀態" with title "Parenting Copilot 育兒副駕駛"'
                subprocess.run(["osascript", "-e", err_script])
    except Exception as e:
        print(f"Error handling dialog: {e}")

def main():
    print(f"👀 正在監控技能目錄: {SKILLS_DIR}")
    
    kq = select.kqueue()
    
    # Watch directory
    dir_fd = os.open(SKILLS_DIR, os.O_RDONLY)
    ev_dir = select.kevent(dir_fd, filter=select.KQ_FILTER_VNODE, 
                            flags=select.KQ_EV_ADD | select.KQ_EV_CLEAR, 
                            fflags=select.KQ_NOTE_WRITE | select.KQ_NOTE_EXTEND | select.KQ_NOTE_ATTRIB)
    
    # Watch individual files
    file_fds = {}
    events = [ev_dir]
    
    def update_file_watchers():
        nonlocal events, file_fds
        for fd in file_fds.values():
            os.close(fd)
        file_fds = {}
        events = [ev_dir]
        
        for root, _, files in os.walk(SKILLS_DIR):
            for f in files:
                if f.endswith('.md'):
                    fpath = os.path.join(root, f)
                    try:
                        fd = os.open(fpath, os.O_RDONLY)
                        file_fds[fpath] = fd
                        events.append(select.kevent(fd, filter=select.KQ_FILTER_VNODE,
                                                   flags=select.KQ_EV_ADD | select.KQ_EV_CLEAR,
                                                   fflags=select.KQ_NOTE_WRITE | select.KQ_NOTE_EXTEND | select.KQ_NOTE_ATTRIB))
                    except Exception as e:
                        pass

    update_file_watchers()
    last_trigger = 0
    
    while True:
        try:
            revents = kq.control(events, 10, 1.0)
            now = time.time()
            triggered_file = None
            
            for event in revents:
                # Find matching file path
                for path, fd in list(file_fds.items()):
                    if fd == event.ident:
                        triggered_file = path
                        break
                        
            if triggered_file and (now - last_trigger > 3.0): # 3 second debounce
                last_trigger = now
                print(f"⚡ 偵測到修改: {triggered_file}")
                show_popup_and_push(triggered_file)
                update_file_watchers()
                
        except KeyboardInterrupt:
            print("\n👋 停止監控。")
            break
        except Exception as e:
            time.sleep(1)

if __name__ == "__main__":
    main()
