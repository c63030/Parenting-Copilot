/**
 * Parenting Copilot - LINE Webhook Serverless Handler (Vercel)
 * 用於接收 LINE 群組的日常育兒語音/文字筆記並自動記錄
 */

const https = require('https');

// Helper to interact with GitHub API to append note
async function saveNoteToGithub(noteText, sender) {
  const token = process.env.GH_PAT_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || "c63030/Parenting-Copilot";
  const path = "data/parenting_notes.json";
  
  if (!token) {
    console.error("Missing GITHUB_TOKEN/GH_PAT_TOKEN");
    return;
  }

  const getUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  
  try {
    // 1. Get existing notes file
    const res = await githubApiRequest(getUrl, 'GET', token);
    let existingNotes = [];
    let sha = null;

    if (res && res.content) {
      sha = res.sha;
      const buf = Buffer.from(res.content, 'base64').toString('utf-8');
      try { existingNotes = JSON.parse(buf); } catch (e) {}
    }

    // 2. Append new note
    const newNote = {
      timestamp: new Date().toISOString(),
      sender: sender || "Parent",
      text: noteText
    };
    existingNotes.push(newNote);

    // 3. Update file on GitHub
    const updatedContent = Buffer.from(JSON.stringify(existingNotes, null, 2)).toString('base64');
    const updateBody = {
      message: `notes: 記錄日常育兒隨身筆記 (${newNote.timestamp})`,
      content: updatedContent,
      sha: sha
    };

    await githubApiRequest(getUrl, 'PUT', token, updateBody);
    console.log("🟢 成功將隨身筆記同步至 GitHub repository！");
  } catch (err) {
    console.error("❌ 寫入 GitHub 筆記失敗:", err);
  }
}

function githubApiRequest(url, method, token, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: method,
      headers: {
        'User-Agent': 'Parenting-Copilot-App',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw: data }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Reply to LINE chat
async function replyLineMessage(replyToken, messageText) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken || !replyToken) return;

  const postData = JSON.stringify({
    replyToken: replyToken,
    messages: [{ type: 'text', text: messageText }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.line.me',
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => resolve(res.statusCode));
    req.on('error', () => resolve(500));
    req.write(postData);
    req.end();
  });
}

// Main Serverless Vercel Handler
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('LINE Webhook Endpoint Running.');
  }

  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text.trim();
        const replyToken = event.replyToken;

        // Save to GitHub
        await saveNoteToGithub(userText, event.source.userId);

        // Reply confirmation to LINE group
        await replyLineMessage(replyToken, `📝 已幫您記錄至本週育兒隨身筆記：\n「${userText}」\n\n週四早上 09:00 AI 將自動彙整並客製化週末放電企劃！`);
      }
    }
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error("Webhook Handler Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
