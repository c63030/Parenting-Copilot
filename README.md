# Parenting Copilot | 育兒副駕駛 🤖👶

**Parenting Copilot** 是一個結合 **Agent Skills 知識靈魂 (`.md`)** 與 **現代化 Web App 視覺介面** 的雙軌育兒輔助系統。旨在解決家長在育兒過程中的四大痛點：

1. 🗺️ **假日人潮焦慮與空白行程** (`skills/weekend-planner.md`)
2. 🤸 **幼兒核心肌肉不足與討抱抱** (`skills/ot-task-generator.md`)
3. 🌸 **主要照顧者缺乏個人喘息時間 (Me-Time)** (`skills/me-time-guardian.md`)
4. 📝 **焦慮觸發點與孩子/家長進步追蹤** (`skills/emotion-tracker.md`)

---

## 📁 專案目錄架構

```text
Parenting-Copilot/
├── skills/                      # 🤖 Agent 靈魂技能檔 (Markdown Prompt SOP)
│   ├── weekend-planner.md       # 避開人潮假日行程規劃 Agent Skill
│   ├── ot-task-generator.md     # 大肌肉與 OT 遊戲任務 Agent Skill
│   ├── me-time-guardian.md      # 媽媽專屬喘息時間守護 Agent Skill
│   └── emotion-tracker.md       # 焦慮觸發點與觀察進步追蹤 Agent Skill
├── data/
│   └── observation_logs.json    # 本地紀錄備份
├── index.html                   # 📱 育兒副駕駛現代 Web 控制面板
├── style.css                    # 🎨 玻璃擬物、微動畫與深色/淺色主題系統
├── app.js                       # ⚡ 互動邏輯、計時器、任務抽卡與日誌儲存
└── README.md                    # 本文件
```

---

## 🚀 如何啟動使用？

### 方式 1：開啟網頁視覺介面 (Web App UI)
雙擊開啟 [`index.html`](file:///Users/liweichen/Desktop/AI%20agent%20project/Parenting-Copilot/index.html)，或在終端機中開啟本機開發伺服器：

```bash
# 開啟本地靜態網頁
open index.html
```

### 方式 2：使用 Agent Skills 知識庫
進入 [`skills/`](file:///Users/liweichen/Desktop/AI%20agent%20project/Parenting-Copilot/skills) 目錄，可以直接閱讀或複製任何 `.md` 檔案內容，將其做為提示詞（Prompt）輸入給 AI 助理（如 Gemini / ChatGPT / Claude），獲取客製化育兒諮詢。

---

## ✨ 核心功能亮點

* 🗺️ **避人潮企劃案產出**：可輸入地點偏好與年齡，一鍵過濾高擠壓區域，獲取早鳥 08:30 黃金放電時程。
* 🎲 **OT 大肌肉抽卡**：提供本體覺（替換討抱抱）推重物、熊爬障礙賽與深層壓迫按摩 SOP。
* 🌸 **Me-Time 喘息倒數與全螢幕告示**：支援 30/60 分鐘倒數、隊友接管應急 SOP 視窗與防打擾告示。
* 📝 **情緒日誌與微光獎章**：紀錄孩子當下情緒與家長焦慮指數，發掘全家人進步亮點。
* 🧠 **Agent Skills 查看器**：在 UI 內直接切換與複製四大 Agent 的靈魂提示詞。
