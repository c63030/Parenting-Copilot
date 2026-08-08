# 🛡️ 專案防呆機制與 Git 部署規範

- **AI 自動異動防呆**：凡是 AI 進行檔案新增或修改，完成後必須立即調用 `ask_question` 工具詢問使用者是否要 commit 並 git push 至 GitHub (Vercel)。
- **使用者 Cmd+S 手動存檔防呆**：當檢測到使用者在編輯器手動存檔引起的未 commit 變更時，AI 必須主動彈出 `ask_question` 詢問是否同步推送至遠端。
