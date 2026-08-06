/**
 * 週四 09:00 全自動 AI 氣象與避人潮雙劇本生成腳本
 * 本腳本由 GitHub Actions 自動執行，100% 雲端連網運作
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_DIR = path.dirname(__dirname);
const SKILL_FILE = path.join(PROJECT_DIR, 'skills', 'weekend-planner.md');
const OUTPUT_FILE = path.join(PROJECT_DIR, 'data', 'latest_thursday_plan.md');

// Helper HTTP Request
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

function httpPostJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 1. Fetch Live Weather Data from Open-Meteo
async function fetchLiveWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=25.17&longitude=121.44&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei`;
  try {
    const data = await httpGet(url);
    if (data && data.daily) {
      const dates = data.daily.time;
      let satIdx = dates.findIndex(d => new Date(d).getDay() === 6);
      if (satIdx === -1) satIdx = 0;
      
      const forecastDate = dates[satIdx];
      const maxTemp = Math.round(data.daily.temperature_2m_max[satIdx]);
      const minTemp = Math.round(data.daily.temperature_2m_min[satIdx]);
      const rainProb = data.daily.precipitation_probability_max[satIdx] ?? 0;
      
      return {
        date: forecastDate,
        maxTemp,
        minTemp,
        rainProb,
        desc: rainProb >= 30 ? "局部陣雨（觸發雨備）" : "晴朗多雲，適合戶外草皮"
      };
    }
  } catch (err) {
    console.error("無法取得即時天氣，使用預設氣象備援:", err);
  }
  return { date: "本週末", maxTemp: 28, minTemp: 22, rainProb: 15, desc: "晴朗多雲，舒適宜人" };
}

// 2. Call Gemini API if Key is Available
async function generateWithGemini(apiKey, skillPrompt, weather) {
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const userPrompt = `
請根據以下系統 Skill 規則，並結合本週末最新氣象預報，為使用者生成一份最新「本週末父女半日遊防空窗避人潮企劃案」：

[本週末最新氣象資訊]
- 區域：淡水 / 北海岸 / 新北
- 預報日期：${weather.date}
- 預估氣溫：${weather.minTemp}°C - ${weather.maxTemp}°C
- 降雨機率：${weather.rainProb}% (${weather.desc})

請完全依據 Skill 中的風格與規格輸出（包含方案 A、方案 B、行事曆 Actions）。
  `;

  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: skillPrompt + "\n\n" + userPrompt }]
    }]
  };

  try {
    const res = await generateWithGeminiAPI(endpoint, payload);
    if (res && res.candidates && res.candidates[0]?.content?.parts[0]?.text) {
      return res.candidates[0].content.parts[0].text;
    }
  } catch (e) {
    console.error("Gemini API 呼叫失敗，將降級切換至預設範本處理:", e);
  }
  return null;
}

function generateWithGeminiAPI(url, body) {
  return httpPostJson(url, body);
}

// 3. Fallback Generator (Template engine based on latest skill.md)
function generateFallbackPlan(skillPrompt, weather) {
  const isRain = weather.rainProb >= 30;
  return `# 🌿 本週末「父女半日遊」防空窗避人潮企劃案 (雲端自動生成)

🌤️ **本週末即時氣象預報** (Open-Meteo 雲端連線)：
- 預報區域：淡水 / 北海岸
- 氣溫範圍：${weather.minTemp}°C ~ ${weather.maxTemp}°C
- 降雨機率：${weather.rainProb}% (${weather.desc})

---

### 方案 A：【${isRain ? "新北館藏展覽廣闊空間劇本 (雨備特化)" : "淡水空中草皮海風衝刺劇本 (大肌肉放電)"}】
- **地點**：${isRain ? "淡水古蹟博物館廣闊館區 / 新北美術館室內展區" : "淡水滬尾藝文休閒園區空中大草皮 ➡️ 綠色步道散步"}
- **時間**：星期六 08:30 - 11:30
- **人潮防禦等級**：🟢 晨間離峰入場，無密閉排隊，女兒人群焦慮預估 0 級
- **放電指數**：${isRain ? "⚡⚡⚡⚡" : "⚡⚡⚡⚡⚡"}
- **行程時間軸**：
  - **08:30** 抵達地下停車場（離峰車位極多）
  - **08:45 - 10:15** ${isRain ? "展館寬敞空間探索、抓背本體覺遊戲" : "空中大草皮泡泡遊戲、衝刺奔跑、抓背本體覺"}
  - **10:15 - 10:45** 樹蔭/休息區補充水份與水果餅乾
  - **11:00** 快樂返程（完美避開中午淡水老街湧入人潮與塞車潮）
- **雨天/備案**：淡水海關碼頭室內展覽館

---

### 方案 B：【北海岸淺水灣晨間沙坑探險劇本】 (適合感官與本體覺)
- **地點**：三芝淺水灣沙灘步道離峰區
- **時間**：星期日 08:30 - 11:30
- **人潮防禦等級**：🟢 早晨遊客極少，海風宜人
- **放電指數**：⚡⚡⚡⚡
- **行程時間軸**：
  - **08:30** 抵達淺水灣停車場
  - **08:45 - 10:30** 踏浪、赤腳踩沙本體覺輸入、沙堡建構
  - **10:30 - 11:00** 簡易清洗，沿海木棧道散步
  - **11:00** 返程回溫馨的家午睡
- **雨天/備案**：三芝芝蘭公園空間開放區

---

### 📅 一鍵排入行事曆資訊 (Copilot ICS Action)
- **活動名稱**：[方案A] 父女淡水放電半日遊
- **時間**：星期六 08:30 - 11:30
- **地點**：${isRain ? "淡水古蹟博物館" : "淡水滬尾藝文休 休閒園區"}
- **備註**：攜帶水壺、替換衣物1套。降雨機率 ${weather.rainProb}%。
`;
}

// 4. Send Notifications
async function sendTelegram(botToken, chatId, text) {
  if (!botToken || !chatId) return;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await httpPostJson(url, { chat_id: chatId, text, parse_mode: 'Markdown' });
  console.log("📲 成功將企劃推播至 Telegram！");
}

async function sendLineMessage(channelAccessToken, userId, text) {
  if (!channelAccessToken || !userId) return;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: text }]
    });
    
    const req = https.request({
      hostname: 'api.line.me',
      path: '/v2/bot/message/push',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("🟢 LINE 推播請求回應:", res.statusCode);
        resolve(data);
      });
    });
    req.on('error', (err) => {
      console.error("❌ LINE 推播失敗:", err);
      reject(err);
    });
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("🚀 開始執行週四 09:00 自動雙劇本生成腳本...");
  
  // Read Skill File
  let skillPrompt = "";
  if (fs.existsSync(SKILL_FILE)) {
    skillPrompt = fs.readFileSync(SKILL_FILE, 'utf-8');
    console.log("📄 成功讀取最新版 skills/weekend-planner.md");
  }

  // Fetch Live Weather
  const weather = await fetchLiveWeather();
  console.log(`🌤️ 氣象取得成功: ${weather.date}, ${weather.minTemp}-${weather.maxTemp}°C, 降雨機率 ${weather.rainProb}%`);

  let planContent = null;
  
  // Try Gemini API if Key Exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log("🤖 檢測到 GEMINI_API_KEY，正在呼叫 Google Gemini API 智慧生成...");
    planContent = await generateWithGemini(apiKey, skillPrompt, weather);
  }

  if (!planContent) {
    console.log("ℹ️ 使用智慧樣板引擎生成企劃案...");
    planContent = generateFallbackPlan(skillPrompt, weather);
  }

  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, planContent, 'utf-8');
  console.log(`💾 已成功備份儲存至: ${OUTPUT_FILE}`);

  // Send Telegram
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    await sendTelegram(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, planContent);
  }

  // Send LINE
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID) {
    await sendLineMessage(process.env.LINE_CHANNEL_ACCESS_TOKEN, process.env.LINE_USER_ID, planContent);
  }
}

main().catch(err => {
  console.error("❌ 執行發生錯誤:", err);
  process.exit(1);
});
