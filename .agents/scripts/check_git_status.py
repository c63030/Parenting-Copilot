#!/usr/bin/env python3
import json
import subprocess
import sys
import os

def main():
    # Read stdin payload from Antigravity hook
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        input_data = {}

    # Get workspace path
    workspace_paths = input_data.get('workspacePaths', [])
    cwd = workspace_paths[0] if workspace_paths else os.getcwd()

    # Check git status
    try:
        res = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=5
        )
        status_output = res.stdout.strip()
    except Exception:
        status_output = ""

    # Ignore .DS_Store or minor ignored files if any
    dirty_lines = [l for l in status_output.split('\n') if l and not l.endswith('.DS_Store')]

    if dirty_lines:
        modified_summary = "\n".join(dirty_lines[:10])
        msg = (
            "🚨 【Git 防呆機制提醒】本專案目前有未 commit / push 的本機變更（包含手動存檔 Cmd+S 或 AI 修改）：\n"
            f"{modified_summary}\n\n"
            "請立即調用 ask_question 工具詢問使用者是否要將這些修改 commit 並 git push 至 GitHub（同步觸發 Vercel 自動部署）！"
        )
        # Check if event is Stop or PreInvocation
        # If Stop hook, output decision: continue
        # If PreInvocation, output injectSteps
        output = {
            "decision": "continue",
            "reason": msg,
            "injectSteps": [
                {
                    "ephemeralMessage": msg
                }
            ]
        }
    else:
        output = {
            "decision": "allow",
            "injectSteps": []
        }

    print(json.dumps(output))

if __name__ == '__main__':
    main()
