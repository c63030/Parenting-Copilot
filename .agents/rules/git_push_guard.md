---
trigger: always_on
---

# 🛡️ Git & Vercel 部署雙重防呆機制規則 (Git Push Fail-Safe Rule)

## 📌 核心指令與強制規範

1. **AI 修改檔案防呆**：
   - 當 AI 在對話中完成任何程式碼或 Skill 檔案的編輯（包含 `replace_file_content` 或 `write_to_file`），在結束回答或進入下一階段前，**必須強制檢查 `git status`**。
   - 若有未提交的變更，**必須主動呼叫 `ask_question` 工具**，詢問使用者是否要進行 `git commit` 並 `git push` 至 GitHub（會引發 Vercel 自動部署）。

2. **使用者手動存檔 (Cmd+S) 防呆**：
   - 每當對話回合開始（`PreInvocation`）或 AI 即將結束回答（`Stop`），若觸發系統層級檢測發現專案中有使用者手動存檔（`Cmd+S`）留下的未 commit 檔案變更：
   - AI **不得直接關閉對話或冷處理**，必須主動調用 `ask_question` 彈窗詢問使用者：「檢測到您剛才手動存檔/變更了本地檔案，請問是否要 Commit 並 Push 到 GitHub / Vercel？」

3. **問答彈窗規範**：
   - 必須使用 `ask_question` 工具彈出互動選單。
   - 選項應包含：「(Recommended) 立即 commit 並 push 至 GitHub」、「僅在本地保留，暫不推送到 GitHub」、「查看詳細 git status 變更再決定」。
