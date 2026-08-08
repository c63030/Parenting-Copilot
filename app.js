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
  // --- 1. 本體覺 (Proprioception) ---
  {
    id: 1,
    title: "🧱 小小工程師搬磚大作戰",
    type: "proprioception",
    tag: "💪 本體覺 (替換討抱抱)",
    target: "深層肌力、上肢推力、替代討抱需求",
    tools: "裝有數本書的重箱子、軟墊",
    story: "警報！城堡牆壁被怪獸推倒了！我們需要力氣最大的小小工程師，把這些重重的魔法磚塊推到城堡那邊蓋牆壁！",
    steps: [
      "將裝書重箱子從客廳起點用雙手用力往前推到終點（深層關節本體覺）。",
      "途中爬過由沙發枕頭組成的障礙山丘。",
      "抵達終點後，父母給予緊緊深層熊抱稱讚！"
    ]
  },
  {
    id: 2,
    title: "🕷️ 蜘蛛人阿兵哥闖關",
    type: "proprioception",
    tag: "💪 本體覺 (全身核心控制)",
    target: "腹地爬行、四肢抗阻力、動作計畫能力",
    tools: "客廳低矮桌椅、床單、軟枕頭",
    story: "特務蜘蛛人接獲緊急任務！雷射光陣正在掃描客廳，你必須貼地匍匐前進穿越黑森林！",
    steps: [
      "將肚皮貼在地上，像阿兵哥或蜘蛛人一樣四肢匍匐爬行。",
      "穿越低矮桌椅下方組成的特務隧道。",
      "完成關卡後站立做出英雄登場姿勢！"
    ]
  },
  {
    id: 3,
    title: "⚽ 圓滾滾推大球散步",
    type: "proprioception",
    tag: "💪 本體覺 (力道拿捏與路徑計畫)",
    target: "雙手推力、肢體力道控制、手眼協調",
    tools: "大皮球或彈力球、障礙椅腳",
    story: "魔法大球要逃跑了！小護衛需要雙手推著大球進行環島巡邏！",
    steps: [
      "用雙手掌心穩定推著大皮球在客廳地板上前進。",
      "控制力道讓球不撞到牆壁或家具，順暢繞過客廳障礙物。",
      "順利推回終點家園獲得大力士稱讚。"
    ]
  },
  {
    id: 4,
    title: "🐂 力量無敵小牛推車",
    type: "proprioception",
    tag: "💪 本體覺 (上肢抗阻與肩關節穩定)",
    target: "手臂上肢肌力、核心穩定性、關節深層壓迫",
    tools: "安全地墊或軟地毯",
    story: "神奇小牛要下田耕作囉！農夫牽著小牛的後腿往前推進！",
    steps: [
      "孩子趴地，雙手撐地，家長扶住孩子雙膝或小腿（初階扶骨盆）。",
      "孩子用雙手交替往前手爬步前進 3-5 公尺。",
      "完成後小牛放鬆躺地享受農夫按摩。"
    ]
  },
  {
    id: 5,
    title: "🏋️ 我是大力士搬家大隊",
    type: "proprioception",
    tag: "💪 本體覺 (重物搬運)",
    target: "大肌肉拉力、關節深層壓迫、自信心建立",
    tools: "裝有玩偶或水瓶的提袋、洗衣籃",
    story: "魔法國王要搬新家了！最厲害的大力士幫忙把魔法寶箱搬運到城堡吧！",
    steps: [
      "雙手提著裝有重物（水瓶或書本）的提袋或抱著洗衣籃。",
      "穩步邁開大步走到指定的城堡基地。",
      "將寶箱輕輕放下，體驗重物下放的肢體控制。"
    ]
  },
  {
    id: 6,
    title: " bowling 居家特務保齡球高手",
    type: "proprioception",
    tag: "💪 本體覺 (力道控制)",
    target: "上肢拋滾力道控制、視覺目標定位",
    tools: "寶特瓶數個（可裝少量水）、皮球",
    story: "怪獸保齡球陣來襲！用精準的神射球把它們全數擊倒吧！",
    steps: [
      "將寶特瓶一字排開或擺成三角形。",
      "孩子站在指定距離外，用雙手滾球擊倒寶特瓶。",
      "嘗試調整力道，過重或過輕都會影響滾球方向。"
    ]
  },

  // --- 2. 前庭覺 (Vestibular) ---
  {
    id: 7,
    title: "🐻 熊熊爬山採蘋果",
    type: "vestibular",
    tag: "🌀 前庭覺 (四肢連動與平衡)",
    target: "前庭覺平衡、四肢連動肌力、頭部重力感知",
    tools: "客廳沙發椅墊、絨毛玩偶",
    story: "小熊肚子餓了，要用四隻腳爬上大樹山頂採集魔法甜甜蘋果！",
    steps: [
      "手腳著地（雙膝離地懸空熊爬）跨越枕頭障礙。",
      "嘴巴咬著玩具或手抓玩偶運送到終點。",
      "完成後大聲咆哮一聲慶祝！"
    ]
  },
  {
    id: 8,
    title: "✈️ 人體小飛機與碰碰車",
    type: "vestibular",
    tag: "🌀 前庭覺 (頭部加速度與前額葉覺醒)",
    target: "前庭覺刺激、前額葉血流活化、頭部平衡張力",
    tools: "安全地墊或沙發床",
    story: "小飛機起飛囉！經過雲朵要進行俯衝與空中迴旋！",
    steps: [
      "家長抱著孩子腰部，做空中前後左右擺動與小飛機俯衝。",
      "或是大人坐在地上腿抱孩子，進行人體碰碰車前後左右安全搖晃。",
      "停下來時讓孩子維持眼睛看著家長鼻子的專注凝聚。"
    ]
  },
  {
    id: 9,
    title: "🛋️ 超級魔毯極速冒險",
    type: "vestibular",
    tag: "🌀 前庭覺 (速度與加速度體驗)",
    target: "前庭覺速度感、核心姿勢張力維持",
    tools: "厚毛毯或大浴巾1條、光滑地板",
    story: "阿拉伯阿拉丁神奇魔毯出發囉！緊握魔毯準備飛過大沙漠！",
    steps: [
      "孩子坐在厚毛毯中央，雙手緊握毛毯邊緣。",
      "家長拉著毛毯前端在地板上前進、轉彎與勻速加速。",
      "體會速度變化帶來的神經覺醒與歡樂感受。"
    ]
  },
  {
    id: 10,
    title: "🌭 滾滾大熱狗",
    type: "vestibular",
    tag: "🌀 前庭覺 (全身旋轉與前庭統合)",
    target: "全身前庭旋轉刺激、兩側協調、身體意識",
    tools: "安全軟地毯或大床舖",
    story: "主廚要開始滾大熱狗囉！我們要加上蕃茄醬滾得圓圓滾滾！",
    steps: [
      "孩子雙手高舉過頭，伸直身體躺在地毯上。",
      "從起點一路向左滾動 3 圈，再向右滾動 3 圈返回。",
      "完成後主廚淋上假裝的香濃醬料撫摸。"
    ]
  },
  {
    id: 11,
    title: "🐰 兔子過河與紙盤溜冰",
    type: "vestibular",
    tag: "🌀 前庭覺 (雙腳前庭跳躍與滑行)",
    target: "下肢爆發力、前庭覺平衡、單雙腳跳躍",
    tools: "紙盤或免洗餐盤2個、安全軟墊",
    story: "小兔子要踩著冰塊過河去採蘑菇囉！小心不要落水！",
    steps: [
      "雙腳各踩一個紙盤在滑順地板上滑行（紙盤溜冰）。",
      "或是雙腳併攏模仿小兔子跳過客廳枕頭河流。",
      "抵達終點後雙腳穩穩落地站立。"
    ]
  },
  {
    id: 12,
    title: "🦅 老鷹捉小雞衝刺",
    type: "vestibular",
    tag: "🌀 前庭覺 (急停與方向切換)",
    target: "急速前進後煞車衝動控制、急轉彎前庭感",
    tools: "客廳安全開闊空間",
    story: "大老鷹飛過來了！小雞們聽到指令要迅速跑回雞媽媽身後！",
    steps: [
      "孩子在客廳隨意小跑或開小飛機。",
      "家長喊「老鷹來了！」孩子要立刻定格煞車或跑到安全區。",
      "訓練大腦急停與前庭覺反應速度。"
    ]
  },

  // --- 3. 觸覺 (Tactile) ---
  {
    id: 13,
    title: "🌯 好好吃春捲",
    type: "tactile",
    tag: "🍑 觸覺 (深層全身包覆與安撫)",
    target: "深層觸覺壓力、穩定高亢情緒、疏解觸覺敏感",
    tools: "厚棉被或毛毯",
    story: "今天我們要來包最美味的美味大春捲！加入豐富的蔬菜餡！",
    steps: [
      "孩子趴或躺在棉被上，用棉被將身體溫柔裹捲起來（頭部露出）。",
      "家長用雙手在棉被外側進行適度深層按壓揉捏。",
      "緩慢展開棉被，讓孩子體會全身觸覺解壓的放鬆感。"
    ]
  },
  {
    id: 14,
    title: "🥗 擠沙拉・切披薩",
    type: "tactile",
    tag: "🍑 觸覺 (背部深層觸覺按壓)",
    target: "背部觸覺安撫、神經放鬆、親子情感連結",
    tools: "家長的雙手與溫柔聲音",
    story: "小廚師要在你的背上做特製大披薩！先揉麵糰、擠沙拉、切切切！",
    steps: [
      "孩子趴在床榻或家長大腿上。",
      "家長用雙手掌心在背部進行輕壓揉捏（擠沙拉）、手掌側面輕拍切按（切披薩）。",
      "最後用雙手溫柔撫摸全身背部安撫靜心。"
    ]
  },
  {
    id: 15,
    title: "🎾 居家紙箱小小球池",
    type: "tactile",
    tag: "🍑 觸覺 (多點觸覺刺激)",
    target: "全身多點觸覺輸入、解觸覺防禦敏感",
    tools: "大紙箱1個、海綿球/塑膠球或小軟枕數個",
    story: "發現神秘的魔法海洋球池！快跳進球池裡尋找海底寶藏！",
    steps: [
      "將許多小球或軟軟小物放入大紙箱中。",
      "讓孩子全身進去翻滾、觸摸與搜尋特定的寶物球。",
      "感受多種不同質感與多點碰撞的身體觸覺。"
    ]
  },
  {
    id: 16,
    title: "🧽 海綿寶寶洗澡大作戰",
    type: "tactile",
    tag: "🍑 觸覺 (材質探索與洗澡安撫)",
    target: "皮膚質感辨識、降水防禦敏感",
    tools: "不同材質海綿、毛巾、網袋",
    story: "海綿寶寶冒險隊！我們要用不同的海綿泡泡幫小汽車洗刷刷！",
    steps: [
      "洗澡或遊戲時，讓孩子用粗糙、細緻、洞孔等不同海綿按壓肌膚。",
      "感受沾水前後的重量與質地變化。",
      "讓害怕洗澡的孩子在遊戲中自然習慣水與物體的觸碰。"
    ]
  },

  // --- 4. 聽知覺 (Auditory) ---
  {
    id: 17,
    title: "👂 聽聽我在哪裡",
    type: "auditory",
    tag: "👂 聽知覺 (方向辨識與聲源定位)",
    target: "聽覺專注力、空間聲源方向定位",
    tools: "搖鈴、拍手手、搖沙包",
    story: "盲眼小偵探登場！閉上眼睛聽聲音，找到魔法鈴鐺的位置！",
    steps: [
      "孩子蒙眼或閉上雙眼背對家長。",
      "家長在客廳不同方位（左後、右上、下方）拍手或搖動鈴鐺。",
      "孩子聽到後用手指出來或轉身指認聲音來源。"
    ]
  },
  {
    id: 18,
    title: "🦁 森林動物模仿秀",
    type: "auditory",
    tag: "👂 聽知覺 (聽覺指令與動作整合)",
    target: "聽覺解碼能力、音色辨識、聽覺到動覺轉譯",
    tools: "有聲書或家長模仿聲音",
    story: "神奇動物森林音樂會！聽到哪種動物的叫聲就要扮演牠！",
    steps: [
      "家長發出獅子吼、小狗吠、小鳥叫或大象長鳴。",
      "孩子聽到後要立刻做出該動物的肢體動作與叫聲。",
      "進階版：聽到連續兩種叫聲，要依序做出動作。"
    ]
  },
  {
    id: 19,
    title: "🛒 魔法小廚師買菜任務",
    type: "auditory",
    tag: "👂 聽知覺 (多重聽覺記憶範疇)",
    target: "聽覺工作記憶、指令跟從能力",
    tools: "玩具水果、積木數個",
    story: "小廚師上市場！今天晚餐需要三樣魔法食材，記在腦袋裡別忘囉！",
    steps: [
      "家長口頭發出清單：「請幫我買蘋果、紅積木與湯匙」。",
      "孩子重複複述一遍，並走到遊戲區將三樣東西正確拿回。",
      "隨著年齡逐步增加指令長度（從 2 樣增加到 4 樣）。"
    ]
  },
  {
    id: 20,
    title: "🚥 請你聽我這樣做與跳格子",
    type: "auditory",
    tag: "👂 聽知覺 (聽覺抑制與衝動控制)",
    target: "聽覺注意力過濾、衝動抑制控制",
    tools: "色紙或軟地墊數塊",
    story: "魔法國王的口令！只有聽到「國王說」才能動，否則要定格！",
    steps: [
      "玩法一：家長發出「國王說跳！」才可跳躍，單純說「跳！」則必須定格。",
      "玩法二：聽指令數字跳格子，如喊「紅紅綠」，腳要依序踏在對應顏色的墊子上。",
      "考驗孩子過濾雜音、聽清楚指令才動作的能力。"
    ]
  },

  // --- 5. 視知覺 (Visual) ---
  {
    id: 21,
    title: "🔍 大偵探隱藏大師圈圈找找",
    type: "visual",
    tag: "👁️ 視知覺 (背景搜尋與圖形辨識)",
    target: "視覺背景辨識、視覺搜尋速度、寫字閱讀地基",
    tools: "圖畫繪本或複雜搜尋卡",
    story: "名偵探柯南登場！在這張圖畫城堡裡藏著 5 支神奇鑰匙！",
    steps: [
      "讓孩子在繁複圖畫中找出特定的圖案或顏色物體。",
      "指認時用眼睛做掃瞄（從左到右、從上到下）。",
      "訓練未來閱讀不漏字、寫字不漏劃的視覺注意力。"
    ]
  },
  {
    id: 22,
    title: "🎈 彩色氣球對拍大戰",
    type: "visual",
    tag: "👁️ 視知覺 (眼球追視與手眼協調)",
    target: "眼球追視能力、空間距離估算、手眼協調",
    tools: "彩色氣球1顆",
    story: "魔法泡泡不能掉到地上！看誰能把氣球留在空中最久！",
    steps: [
      "將氣球拋高，雙方用手拍擊氣球不讓其落地。",
      "雙眼必須緊盯著氣球高低移動的方向與速度（眼球追視）。",
      "進階版：指定只能用左手拍或指定用頭頂。"
    ]
  },
  {
    id: 23,
    title: "✂️ 髮型設計師剪紙高手",
    type: "visual",
    tag: "👁️ 視知覺 (雙側協調與剪刀精細動作)",
    target: "手眼協調、雙手分工（一扶一剪）、視覺空間線條",
    tools: "安全兒童剪刀、色紙畫上線條",
    story: "大設計師開張囉！幫紙偶娃娃剪出最帥氣的龐克髮型！",
    steps: [
      "在紙邊畫上直線、波浪線或鋸齒線。",
      "孩子一手轉動紙張，一手拿剪刀沿著視覺線條剪開。",
      "鍛鍊指尖小肌肉與視知覺線條跟隨。"
    ]
  },
  {
    id: 24,
    title: "🤏 棉球與衣夾機器人",
    type: "visual",
    tag: "👁️ 視知覺 (精細分類與握筆肌力)",
    target: "指尖前三指虎口肌力（握筆基礎）、視覺分類",
    tools: "不同顏色小棉球、曬衣夾、小碗",
    story: "機器人夾子大作戰！用魔法夾臂把小棉球分類送到專屬基地！",
    steps: [
      "孩子用雙指或三指按壓衣夾，夾取特定顏色的棉球。",
      "放入對應顏色的碗中進行視覺配對分類。",
      "建立未來寫字所需的強大指尖三指肌肉耐力。"
    ]
  },

  // --- 6. 情緒冷卻安定 (Calm) ---
  {
    id: 25,
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
