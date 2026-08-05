// Parenting Copilot Web App Core JavaScript

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTheme();
  initPlanner();
  initOtTasks();
  initMeTime();
  initEmotionLogs();
  initSkillsInspector();
});

/* ----------------------------------------------------
 * 1. Navigation & Theme Management
 * ---------------------------------------------------- */
function initNavigation() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const paneId = `tab-${tab.dataset.tab}`;
      const targetPane = document.getElementById(paneId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

function initTheme() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const currentTheme = localStorage.getItem("parenting_copilot_theme") || "light";
  
  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    toggleBtn.textContent = "☀️";
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.body.removeAttribute("data-theme");
      toggleBtn.textContent = "🌙";
      localStorage.setItem("parenting_copilot_theme", "light");
    } else {
      document.body.setAttribute("data-theme", "dark");
      toggleBtn.textContent = "☀️";
      localStorage.setItem("parenting_copilot_theme", "dark");
    }
  });
}

/* ----------------------------------------------------
 * 2. Weekend Planner Agent Logic (Live Open-Meteo API)
 * ---------------------------------------------------- */
const LOCATIONS_GEO = {
  tamsui: { name: "淡水 & 北海岸", lat: 25.17, lon: 121.44 },
  newtaipei_park: { name: "大台北都會公園 (三重/新店)", lat: 25.06, lon: 121.48 },
  indoor_exhibit: { name: "新北寬敞展覽館 (淡水/新莊)", lat: 25.04, lon: 121.45 }
};

// Weather Code WMO Mapping
function interpretWmoCode(code) {
  if (code === 0) return { desc: "晴朗無雲", icon: "☀️", isRain: false };
  if (code >= 1 && code <= 3) return { desc: "多雲時晴", icon: "⛅", isRain: false };
  if (code === 45 || code === 48) return { desc: "有霧", icon: "🌫️", isRain: false };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { desc: "陣雨/局部雨", icon: "🌧️", isRain: true };
  if (code >= 95) return { desc: "雷陣雨", icon: "🌩️", isRain: true };
  return { desc: "陰天", icon: "☁️", isRain: false };
}

let currentLiveWeatherData = null;

async function fetchLiveWeather(locationKey) {
  const loc = LOCATIONS_GEO[locationKey] || LOCATIONS_GEO.tamsui;
  const iconEl = document.getElementById("weatherIcon");
  const locNameEl = document.getElementById("weatherLocationName");
  const detailsEl = document.getElementById("weatherDetails");
  const badgeEl = document.getElementById("weatherBadge");

  locNameEl.textContent = `${loc.name} 氣象連線中...`;
  badgeEl.textContent = "即時連線";
  badgeEl.style.background = "var(--primary)";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.daily && data.daily.time) {
      // Find Saturday/Sunday or closest upcoming day in returned 7-day forecast
      const todayStr = new Date().toISOString().split('T')[0];
      let targetIdx = 0; // Default to first available day in forecast

      // Try finding next Saturday or Sunday in data.daily.time
      data.daily.time.forEach((dateStr, idx) => {
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
          targetIdx = idx;
        }
      });

      const forecastDate = data.daily.time[targetIdx];
      const maxTemp = Math.round(data.daily.temperature_2m_max[targetIdx]);
      const minTemp = Math.round(data.daily.temperature_2m_min[targetIdx]);
      const rainProb = data.daily.precipitation_probability_max[targetIdx] ?? 0;
      const wmoInfo = interpretWmoCode(data.daily.weathercode[targetIdx]);

      currentLiveWeatherData = {
        date: forecastDate,
        maxTemp,
        minTemp,
        rainProb,
        wmoInfo,
        locationName: loc.name
      };

      // Update Header Widget
      iconEl.textContent = wmoInfo.icon;
      locNameEl.textContent = `${loc.name} (${forecastDate})`;
      detailsEl.textContent = `最高溫 ${maxTemp}°C / 最低溫 ${minTemp}°C ‧ 降雨機率 ${rainProb}% (${wmoInfo.desc})`;

      if (rainProb >= 30 || wmoInfo.isRain) {
        badgeEl.textContent = "☔ 有雨預警：自動啟動雨備";
        badgeEl.style.background = "var(--red)";
      } else {
        badgeEl.textContent = "🟢 氣候宜人：戶外草皮解鎖";
        badgeEl.style.background = "var(--green)";
      }
    }
  } catch (err) {
    console.error("Weather API Error:", err);
    locNameEl.textContent = `${loc.name} (連線備援)`;
    detailsEl.textContent = `即時數據暫時使用離線氣象備援；降雨機率預估 15% ‧ 舒適宜人`;
    badgeEl.textContent = "離線備援";
    badgeEl.style.background = "var(--accent)";
  }
}

const DUAL_SCRIPTS_DATABASE = {
  tamsui: {
    scriptA: {
      title: "【淡水空中草皮大肌肉放電劇本】",
      location: "淡水滬尾藝文休閒園區空中大草皮 ➡️ 綠色步道散步",
      time: "週六 08:30 - 11:30",
      crowdDef: "🟢 晨間人潮稀少通風，女兒人群焦慮預估 0 級",
      stamina: "⚡⚡⚡⚡⚡ (高強度跑步放電)",
      schedule: [
        "08:30 抵達園區地下停車場（早鳥空位極多，車位超好停）",
        "08:45 - 10:15 空中大草皮泡泡遊戲、衝刺奔跑、OT 本體覺深層抓背",
        "10:15 - 10:45 樹蔭野餐區補充水份與水果餅乾",
        "11:00 返程（完美避開 11:30 中午淡水老街湧入人潮與塞車潮）"
      ]
    },
    scriptB: {
      title: "【北海岸淺水灣晨間沙坑踏浪劇本】",
      location: "三芝淺水灣沙灘步道離峰區",
      time: "週日 08:30 - 11:30",
      crowdDef: "🟢 晨間海風宜人，遊客少於 5%",
      stamina: "⚡⚡⚡⚡ (觸覺與感官統合)",
      schedule: [
        "08:30 抵達淺水灣專用停車場",
        "08:45 - 10:30 踏浪、赤腳踩沙本體覺輸入、沙堡建設",
        "10:30 - 11:00 簡意洗腳，沿海木棧道散步吹海風",
        "11:00 快樂開車返家午睡，媽媽獲得整個上午的完美 Me-Time！"
      ]
    },
    rainScript: {
      title: "☔ 雨天天候首選【淡水海關碼頭古蹟文創展覽館】",
      location: "淡水海關码頭 B棟/C棟 空間高挑展覽館區",
      time: "週六或週日 09:00 - 11:30",
      crowdDef: "🟢 室內挑高通風良好，早鳥開館人流極少",
      stamina: "⚡⚡⚡ (室內感官與步態探索)",
      schedule: [
        "09:00 開館第一批入場（免費入場且室內雨備完善）",
        "09:15 - 10:30 室內光影展覽與文化大步走",
        "10:30 - 11:00 園區室內休息區吃點心與看淡水河風景",
        "11:00 順利返家"
      ]
    }
  },
  newtaipei_park: {
    scriptA: {
      title: "【大台北都會公園極速放電劇本】",
      location: "三重熊猴森樂園離峰廣闊草坪",
      time: "週六 08:30 - 11:00",
      crowdDef: "🟢 08:30 早鳥場未湧入排隊人潮",
      stamina: "⚡⚡⚡⚡⚡",
      schedule: [
        "08:30 捷運三重站離峰出站 / 捷運公園停車場停車",
        "08:45 - 10:30 攀爬網與大滑梯闖關放電",
        "10:30 草地野餐點心時間",
        "11:00 返程回家"
      ]
    },
    scriptB: {
      title: "【新店陽光運動公園綠洲散步劇本】",
      location: "陽光橋畔廣闊綠色草皮區",
      time: "週日 08:30 - 11:30",
      crowdDef: "🟢 視野遼闊，無限無遮蔽草坪",
      stamina: "⚡⚡⚡⚡",
      schedule: [
        "08:30 園區第一停車場停車",
        "08:45 - 10:30 直排輪/放風箏/跑跳放電",
        "10:30 - 11:00 陽光橋步道拍照散步",
        "11:00 愉快返程"
      ]
    },
    rainScript: {
      title: "☔ 雨天首選【新莊副都心國家電影與視聽中心展區】",
      location: "新莊國家影視中心高挑開放大廳與展區",
      time: "週六 09:30 - 11:30",
      crowdDef: "🟢 空間遼闊明亮，絕無擠壓感",
      stamina: "⚡⚡⚡",
      schedule: [
        "09:30 抵達館內地下停車場",
        "09:45 - 10:45 展示空間觀展與圖書閱覽區",
        "10:45 輕食咖啡區點心",
        "11:15 離館返家"
      ]
    }
  }
};

function initPlanner() {
  const form = document.getElementById("plannerForm");
  const output = document.getElementById("itineraryOutput");
  const copyBtn = document.getElementById("copyItineraryBtn");
  const thursdayBtn = document.getElementById("thursdayAutoBtn");
  const destSelect = document.getElementById("destination");

  async function renderDualScripts(destKey) {
    await fetchLiveWeather(destKey);

    const data = DUAL_SCRIPTS_DATABASE[destKey] || DUAL_SCRIPTS_DATABASE.tamsui;
    const weatherInfo = currentLiveWeatherData;
    const isRainy = weatherInfo && (weatherInfo.rainProb >= 30 || weatherInfo.wmoInfo.isRain);

    const scriptA = data.scriptA;
    const scriptB = data.scriptB;
    const rainBackup = data.rainScript || data.scriptA;

    const weatherAlertBanner = isRainy
      ? `<div style="background:rgba(239, 68, 68, 0.12); border:1px solid var(--red); padding:0.8rem; border-radius:10px; margin-bottom:1rem; color:var(--red);">
          <strong>☔【Open-Meteo 即時預警】本週末降雨率高達 ${weatherInfo.rainProb}% (${weatherInfo.wmoInfo.desc})！</strong>
          <p style="font-size:0.8rem; margin-top:0.2rem;">建議優先選擇下方【雨天備案劇本】，已為您自動安排空間高挑通風的室內場館！</p>
         </div>`
      : `<div style="background:rgba(16, 185, 129, 0.12); border:1px solid var(--green); padding:0.8rem; border-radius:10px; margin-bottom:1rem; color:var(--green);">
          <strong>☀️【Open-Meteo 即時資料】本週末降雨率僅 ${weatherInfo ? weatherInfo.rainProb : 15}% (${weatherInfo ? weatherInfo.wmoInfo.desc : '天氣良好'})！</strong>
          <p style="font-size:0.8rem; margin-top:0.2rem;">適宜戶外大草皮放電與海灘踏浪！預估最高溫 ${weatherInfo ? weatherInfo.maxTemp : 26}°C。</p>
         </div>`;

    const html = `
      <div class="itinerary-card">
        ${weatherAlertBanner}

        <!-- 劇本 A -->
        <div style="background:rgba(255,255,255,0.7); padding:1rem; border-radius:12px; margin-bottom:1rem; border:1px solid var(--card-border);">
          <h4 style="color:var(--primary); font-size:1.1rem; margin-bottom:0.4rem;">🎯 ${isRainy ? '首選雨天劇本' : '劇本 A'}：${isRainy ? rainBackup.title : scriptA.title}</h4>
          <p style="font-size:0.88rem;"><strong>📍 地點：</strong>${isRainy ? rainBackup.location : scriptA.location}</p>
          <p style="font-size:0.88rem;"><strong>⏰ 時間：</strong>${isRainy ? rainBackup.time : scriptA.time}</p>
          <p style="font-size:0.88rem;"><strong>🛡️ 人群焦慮防禦：</strong>${isRainy ? rainBackup.crowdDef : scriptA.crowdDef}</p>
          <p style="font-size:0.88rem;"><strong>⚡ 放電指數：</strong>${isRainy ? rainBackup.stamina : scriptA.stamina}</p>
          <h5 style="margin-top:0.6rem; margin-bottom:0.3rem;">時程安排：</h5>
          <ol style="padding-left:1.2rem; font-size:0.85rem;">
            ${(isRainy ? rainBackup.schedule : scriptA.schedule).map(s => `<li>${s}</li>`).join("")}
          </ol>
        </div>

        <!-- 劇本 B -->
        <div style="background:rgba(255,255,255,0.7); padding:1rem; border-radius:12px; border:1px solid var(--card-border);">
          <h4 style="color:var(--secondary); font-size:1.1rem; margin-bottom:0.4rem;">🎯 劇本 B：${scriptB.title}</h4>
          <p style="font-size:0.88rem;"><strong>📍 地點：</strong>${scriptB.location}</p>
          <p style="font-size:0.88rem;"><strong>⏰ 時間：</strong>${scriptB.time}</p>
          <p style="font-size:0.88rem;"><strong>🛡️ 人群焦慮防禦：</strong>${scriptB.crowdDef}</p>
          <p style="font-size:0.88rem;"><strong>⚡ 放電指數：</strong>${scriptB.stamina}</p>
          <h5 style="margin-top:0.6rem; margin-bottom:0.3rem;">時程安排：</h5>
          <ol style="padding-left:1.2rem; font-size:0.85rem;">
            ${scriptB.schedule.map(s => `<li>${s}</li>`).join("")}
          </ol>
        </div>

        <div style="margin-top:1rem; padding:0.8rem; background:rgba(99, 102, 241, 0.1); border-radius:10px; color:var(--primary); font-size:0.85rem; font-weight:600;">
          💌 已為老婆準備好安心訊息文字，點擊右上角「複製企劃案」即可直接貼至 LINE 群組與排入行事曆！
        </div>
      </div>
    `;

    output.innerHTML = html;
  }

  destSelect.addEventListener("change", (e) => {
    fetchLiveWeather(e.target.value);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    renderDualScripts(destSelect.value);
  });

  thursdayBtn.addEventListener("click", () => {
    renderDualScripts("tamsui");
    alert("🗓️ 模擬「每週四自動生成」：已向 Open-Meteo 抓取真實氣象預報，並為您產出本週淡水/北海岸「父女半日遊」雙劇本與雨天備案！");
  });

  copyBtn.addEventListener("click", () => {
    const text = output.innerText;
    if (!text || text.includes("點擊左側")) return;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "✅ 已複製企劃案與行事曆內文！";
      setTimeout(() => copyBtn.textContent = "📋 複製企劃案", 2000);
    });
  });

  // Render initial Tamsui scripts with live API weather
  renderDualScripts("tamsui");
}

/* ----------------------------------------------------
 * 3. OT Task Generator Agent Logic
 * ---------------------------------------------------- */
const OT_CARDS = [
  {
    id: 1,
    title: "🧱 小小工程師搬磚大作戰",
    type: "proprioception",
    tag: "💪 本體覺 (替換討抱抱)",
    target: "深層肌力、上肢推力、替代討抱需求",
    tools: "裝有數本書的重箱子、軟墊",
    story: "警報！城堡牆壁被怪獸推倒了！我們需要力氣最大的小小工程師，把這些重重的魔法磚塊推到城堡那邊蓋牆壁！",
    steps: [
      "將重箱子從客廳起點雙手用力往前推。",
      "途中爬過沙發枕頭小山丘。",
      "抵達終點後，父母給予緊緊深層熊抱稱讚！"
    ]
  },
  {
    id: 2,
    title: "🐻 熊熊爬山採蘋果",
    type: "vestibular",
    tag: "🌀 前庭覺與四肢協調",
    target: "四肢連動肌力、前庭平衡覺",
    tools: "客廳沙發椅墊、絨毛玩偶",
    story: "小熊肚子餓了，要用四隻腳爬上大樹山頂採集魔法甜甜蘋果！",
    steps: [
      "手腳著地（雙膝不著地熊爬）跨越枕頭障礙。",
      "嘴巴咬著玩具或手抓玩偶運送到終點。",
      "完成後大聲咆哮一聲慶祝！"
    ]
  },
  {
    id: 3,
    title: "🛋️ 軟墊夾心三明治",
    type: "calm",
    tag: "🧘 靜止情緒冷卻",
    target: "提供安全感、降溫情緒崩潰",
    tools: "大沙發墊或軟被子",
    story: "今天我們要來做最特別的蔬菜三明治！你是中間美味的起司餡喔！",
    steps: [
      "讓孩子趴在被子上，用被子將孩子輕柔包覆起來。",
      "家長用雙手對孩子手臂與背部提供穩定的深層壓迫按摩（下壓5秒放開）。",
      "配合緩慢深呼吸 3 次。"
    ]
  }
];

function initOtTasks() {
  const drawBtn = document.getElementById("drawOtTaskBtn");
  const display = document.getElementById("otTaskCardDisplay");
  const pills = document.querySelectorAll(".filter-pills .pill");

  let currentFilter = "all";

  pills.forEach(p => {
    p.addEventListener("click", () => {
      pills.forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      currentFilter = p.dataset.filter;
    });
  });

  drawBtn.addEventListener("click", () => {
    let pool = OT_CARDS;
    if (currentFilter !== "all") {
      pool = OT_CARDS.filter(c => c.type === currentFilter);
    }
    if (pool.length === 0) pool = OT_CARDS;

    const card = pool[Math.floor(Math.random() * pool.length)];

    display.innerHTML = `
      <div class="ot-task-card">
        <div class="ot-card-header">
          <h3>${card.title}</h3>
          <span class="ot-tag">${card.tag}</span>
        </div>
        <p><strong>🎯 訓練目標：</strong>${card.target}</p>
        <p><strong>🎒 道具需求：</strong>${card.tools}</p>
        
        <div class="ot-story">
          📜 <strong>遊戲引導台詞：</strong><br>
          「${card.story}」
        </div>

        <h5>🐾 闖關步驟 instructions：</h5>
        <ol style="padding-left: 1.2rem; margin-top:0.5rem;">
          ${card.steps.map(s => `<li style="margin-bottom:0.4rem;">${s}</li>`).join("")}
        </ol>
      </div>
    `;
  });

  // Trigger first draw on load
  drawBtn.click();
}

/* ----------------------------------------------------
 * 4. Me-Time Guardian Logic
 * ---------------------------------------------------- */
let meTimeInterval = null;
let remainingSeconds = 0;
let totalSeconds = 0;

function initMeTime() {
  const display = document.getElementById("meTimeDisplay");
  const headerTimer = document.getElementById("headerTimer");
  const statusLabel = document.getElementById("meTimeStatusLabel");
  const circle = document.getElementById("meTimeCircle");
  const btn30 = document.getElementById("startMeTime30");
  const btn60 = document.getElementById("startMeTime60");
  const stopBtn = document.getElementById("stopMeTimeBtn");
  const openDndBtn = document.getElementById("openDndModalBtn");
  const closeDndBtn = document.getElementById("closeDndModalBtn");
  const dndModal = document.getElementById("dndModal");
  const dndTimer = document.getElementById("dndModalTimer");

  function startTimer(minutes) {
    clearInterval(meTimeInterval);
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;

    statusLabel.textContent = "🌸 充電防護罩生效中...";
    stopBtn.disabled = false;

    updateTimerDisplay();

    meTimeInterval = setInterval(() => {
      remainingSeconds--;
      updateTimerDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(meTimeInterval);
        statusLabel.textContent = "✨ 充電完成！感謝隊友守護！";
        stopBtn.disabled = true;
        alert("🎉 恭喜完成這段專屬喘息時間！您做得非常棒！");
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const hrs = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(remainingSeconds % 60).padStart(2, '0');

    const str = `${hrs}:${mins}:${secs}`;
    display.textContent = str;
    headerTimer.textContent = `${mins}:${secs}`;
    if (dndTimer) dndTimer.textContent = str;

    // Update Conic Gradient
    const percent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 360 : 0;
    circle.style.background = `conic-gradient(var(--pink) ${percent}deg, rgba(236,72,153,0.15) ${percent}deg)`;
  }

  btn30.addEventListener("click", () => startTimer(30));
  btn60.addEventListener("click", () => startTimer(60));

  stopBtn.addEventListener("click", () => {
    clearInterval(meTimeInterval);
    remainingSeconds = 0;
    updateTimerDisplay();
    statusLabel.textContent = "已結束充飽電模式。";
    stopBtn.disabled = true;
  });

  openDndBtn.addEventListener("click", () => {
    dndModal.classList.remove("hidden");
  });

  closeDndBtn.addEventListener("click", () => {
    dndModal.classList.add("hidden");
  });
}

/* ----------------------------------------------------
 * 5. Emotion Tracker Logic
 * ---------------------------------------------------- */
function initEmotionLogs() {
  const form = document.getElementById("emotionForm");
  const historyList = document.getElementById("logsHistoryList");
  const rangeInput = document.getElementById("parentAnxiety");
  const rangeVal = document.getElementById("rangeVal");

  rangeInput.addEventListener("input", (e) => {
    rangeVal.textContent = e.target.value;
  });

  const getLogs = () => JSON.parse(localStorage.getItem("parenting_observation_logs") || "[]");

  const saveLog = (log) => {
    const logs = getLogs();
    logs.unshift(log);
    localStorage.setItem("parenting_observation_logs", JSON.stringify(logs));
    renderLogs();
  };

  const renderLogs = () => {
    const logs = getLogs();
    if (logs.length === 0) {
      historyList.innerHTML = `<div class="empty-state"><span>📝</span><p>尚無任何紀錄，寫下今天第一個微小的進步吧！</p></div>`;
      return;
    }

    historyList.innerHTML = logs.map(l => `
      <div class="log-entry">
        <div class="log-date">🕒 ${l.timestamp}</div>
        <div class="log-title">事件：${l.context} (${l.childMood})</div>
        <div class="log-detail">⚡ 家長焦慮度：${l.parentAnxiety}/5 | 💡 應對：${l.soothingUsed || '無紀錄'}</div>
        ${l.sparkPoint ? `<span class="spark-badge">✨ 進步亮點：${l.sparkPoint}</span>` : ''}
      </div>
    `).join("");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const log = {
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      context: document.getElementById("logContext").value,
      childMood: document.getElementById("childMood").value,
      parentAnxiety: rangeInput.value,
      soothingUsed: document.getElementById("soothingUsed").value,
      sparkPoint: document.getElementById("sparkPoint").value
    };

    saveLog(log);
    form.reset();
    rangeVal.textContent = "3";
  });

  renderLogs();
}

/* ----------------------------------------------------
 * 6. Skills Inspector Logic
 * ---------------------------------------------------- */
const LOCAL_SKILLS = {
  "weekend-planner": `---
name: weekend-planner
description: 假日避開人潮與放電行程規劃 Agent
---

# 🗺️ 假日行程規劃器 (Weekend Planner Agent)

你是一位經驗豐富的親子旅遊專家與「人潮焦慮避險大師」。你的使命是幫助父母在週末或假日規劃出兼具高強度放電、低擠壓焦慮與順暢交通的親子戶外/室內行程。

## 🎯 核心能力與規劃原則
1. 避開人潮熱點與高峰時段（首推 08:30 晨間登場）
2. 高效能大肌肉體能放電
3. 後勤友善指數評估`,

  "ot-task-generator": `---
name: ot-task-generator
description: 兒童大肌肉放電與職能治療 (OT) 互動遊戲設計 Agent
---

# 🤸 大肌肉遊戲與 OT 任務生成器 (OT Task Generator Agent)

你是一位專精於兒童發展與職能治療（OT）的遊戲設計師。針對幼兒核心肌力不足、尋求本體覺（討抱抱、求撞擊）的情緒狀態，設計故事化互動任務。

## 🎯 治療重點
- 本體覺輸入（推重物、熊抱）
- 大肌肉與平衡覺挑戰`,

  "me-time-guardian": `---
name: me-time-guardian
description: 媽媽/主要照顧者專屬喘息時間保護 Agent
---

# ⏰ Me-Time 喘息時間守護者 (Me-Time Guardian Agent)

你是照顧者身心健康與「Me-Time 專屬時間」的強大盾牌。你的責任是確保照顧者每週獲得無壓力、零罪惡感的充飽電時間。`,

  "emotion-tracker": `---
name: emotion-tracker
description: 焦慮觸發點紀錄與進步追蹤分析 Agent
---

# 📝 情緒紀錄與進步追蹤器 (Emotion Tracker Agent)

你是一位具備溫柔同理心與數據敏銳度的育兒情緒分析師。記錄日常崩潰觸發點，同時發掘微小的進步亮點。`
};

function initSkillsInspector() {
  const menuItems = document.querySelectorAll(".skill-menu-item");
  const titleEl = document.getElementById("currentSkillTitle");
  const previewEl = document.getElementById("skillMarkdownContent");
  const copyBtn = document.getElementById("copySkillBtn");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuItems.forEach(m => m.classList.remove("active"));
      item.classList.add("active");

      const skillName = item.dataset.skill;
      titleEl.textContent = `${skillName}.md`;

      // Try fetching file or fallback to local constant
      fetch(`skills/${skillName}.md`)
        .then(res => res.text())
        .then(text => previewEl.textContent = text)
        .catch(() => previewEl.textContent = LOCAL_SKILLS[skillName] || "無資料");
    });
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(previewEl.textContent).then(() => {
      copyBtn.textContent = "✅ 已複製提示詞！";
      setTimeout(() => copyBtn.textContent = "📋 複製 Skill 系統提示詞", 2000);
    });
  });

  // Trigger initial click
  if (menuItems[0]) menuItems[0].click();
}
