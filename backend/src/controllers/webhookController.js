const { whatsapp } = require("../config/env");
const { supabase } = require('../config/supabase');

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const PHONE_NUMBER_ID = whatsapp.phoneNumberId;
const ACCESS_TOKEN = whatsapp.apiToken;

console.log("PHONE ID:", PHONE_NUMBER_ID);
console.log("TOKEN EXISTS:", !!ACCESS_TOKEN);

// ─── Session Store (in-memory for now) ───
// In production, use Redis or Supabase
const sessions = new Map();

// ─── VERIFICATION ───
exports.verify = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ Verification failed");
  return res.sendStatus(403);
};

// ─── SEND MESSAGE ───
async function sendWhatsAppMessage(to, text) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: { body: text }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ API Error:", { status: response.status, data });
      return null;
    }

    console.log(`✅ Message sent to ${to}`);
    return data;

  } catch (error) {
    console.error("❌ Send error:", error.message);
    return null;
  }
}

// ─── SEND INTERACTIVE MENU ───
async function sendInteractiveMenu(from) {
  const menu = `⚽️ *MUGUTHA FC - DIGITAL ASSISTANT*

*Welcome! Sasa!* 👋

I can help you with:

*1️⃣* 📅 Fixtures & Match Schedule
*2️⃣* 🎫 Membership & Subscription
*3️⃣* 🎟️ Ticket Prices & Purchase
*4️⃣* 🏆 Standings & League Table
*5️⃣* 👥 Squad & Player Info
*6️⃣* 📍 Venue & Match Day Info
*0️⃣* ℹ️ Help & Commands

*Reply with a number (1-6) or 0 for help.*

🏠 *Mugutha FC - #MoreThanFootball*`;

  await sendWhatsAppMessage(from, menu);
  return menu;
}

// ─── GET LIVE FIXTURES ───
async function getLiveFixtures() {
  try {
    const { data, error } = await supabase
      .from('fixtures')
      .select('*')
      .eq('status', 'upcoming')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error fetching fixtures:", error);
    return [];
  }
}

// ─── GET MEMBERSHIP STATUS ───
async function getMembershipStatus(phone) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error("❌ Error fetching membership:", error);
    return null;
  }
}

// ─── FORMAT FIXTURES RESPONSE ───
function formatFixturesResponse(fixtures) {
  if (!fixtures || fixtures.length === 0) {
    return "📅 *No upcoming fixtures scheduled.*\n\nCheck back later for match updates!";
  }

  const homeMatches = fixtures.filter(f => f.home_team === 'Mugutha FC');
  const awayMatches = fixtures.filter(f => f.away_team === 'Mugutha FC');

  let response = "⚽️ *MUGUTHA FC - RATIBA YA MECHI*\n\n";

  if (homeMatches.length > 0) {
    response += "🟢 *Home Matches*\n";
    homeMatches.forEach((f, i) => {
      const date = new Date(f.date).toLocaleDateString('en-KE', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      });
      const time = f.time ? f.time.slice(0, 5) : 'TBD';
      response += `${i + 1}. ${date} · ${f.home_team} vs ${f.away_team}\n`;
      response += `   ⏰ ${time} | 📍 ${f.venue}\n`;
    });
    response += "\n";
  }

  if (awayMatches.length > 0) {
    response += "🔴 *Away Matches*\n";
    awayMatches.forEach((f, i) => {
      const date = new Date(f.date).toLocaleDateString('en-KE', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      });
      const time = f.time ? f.time.slice(0, 5) : 'TBD';
      response += `${i + 1}. ${date} · ${f.away_team} vs ${f.home_team}\n`;
      response += `   ⏰ ${time} | 📍 ${f.venue}\n`;
    });
    response += "\n";
  }

  response += "🏆 *Competition:* Mt. Kenya Regional League\n";
  response += `📊 *Total matches:* ${fixtures.length}\n\n`;
  response += "📲 *Reply 'MENU' to go back or ask:*\n";
  response += "• 'Tickets' for prices\n";
  response += "• 'Membership' for your status\n";
  response += "• 'Standings' for league table";

  return response;
}

// ─── PROCESS COMMANDS ───
async function processCommand(from, text) {
  const command = text.toLowerCase().trim();
  
  // ── Session handling ──
  const session = sessions.get(from) || { state: 'menu', lastCommand: '' };
  sessions.set(from, session);

  // ── Check for number responses ──
  const numberMap = {
    '0': 'help',
    '1': 'fixtures',
    '2': 'membership',
    '3': 'tickets',
    '4': 'standings',
    '5': 'squad',
    '6': 'venue'
  };

  // If user replied with a number, map it to a command
  const mappedCommand = numberMap[command] || command;

  // ── MENU COMMAND ──
  if (['menu', 'help', '0', '?'].includes(mappedCommand)) {
    session.state = 'menu';
    return await sendInteractiveMenu(from);
  }

  // ── FIXTURES ──
  if (['fixtures', 'matches', 'ratiba', 'mechi', 'game', 'match', '1'].includes(mappedCommand)) {
    const fixtures = await getLiveFixtures();
    return formatFixturesResponse(fixtures);
  }

  // ── MEMBERSHIP ──
  if (['membership', 'uanachama', 'status', 'member', 'join', '2'].includes(mappedCommand)) {
    const member = await getMembershipStatus(from);
    
    if (!member) {
      return `🎫 *MUGUTHA FC - UANACHAMA*

*Not a member yet?* 🤔

Join Mugutha FC today!
💰 Fees: KES 2,500/season

🎁 *Benefits:*
• Free entry to all home matches
• Official Mugutha FC jersey
• 20% off at team shop
• Access to members-only events

📞 *Call:* 0733 461 153
📱 *Reply 'JOIN' to register*`;
    }

    const tierEmoji = {
      gold: '🌟',
      silver: '💎',
      bronze: '🥉'
    };

    return `🎫 *MUGUTHA FC - UANACHAMA*

${tierEmoji[member.tier] || '✅'} *Status:* Active
🏷️ *Tier:* ${member.tier.toUpperCase()}
📅 *Joined:* ${new Date(member.join_date).toLocaleDateString('en-KE')}
💰 *Amount Paid:* KES ${member.amount_paid || '0'}

🎁 *Benefits:*
• Free entry to all home matches
• Official Mugutha FC jersey
• 20% off at team shop
• Access to members-only events

📲 *Reply 'MENU' for options*`;
  }

  // ── TICKETS ──
  if (['tickets', 'tiketi', 'ticket', 'price', 'bei', '3'].includes(mappedCommand)) {
    return `🎟️ *MUGUTHA FC - BEI ZA TIKETI*

🏟️ *Home Matches (Ruiru Stadium):*

*• Regular:* KES 500
*• VIP:* KES 2,000
*• VVIP:* KES 5,000

📱 *Buy tickets via:*
• M-Pesa Paybill: *123456*
  Account: *MUGUTHA*
• At the gate before kickoff
• Online: muguthafc.co.ke/tickets

📲 *Reply 'BUY' to purchase*
📲 *Reply 'MENU' for options*`;
  }

  // ── STANDINGS ──
  if (['standings', 'msimamo', 'table', 'liga', 'ligi', '4'].includes(mappedCommand)) {
    return `🏆 *KENYAN PREMIER LEAGUE - TOP 6*

*1️⃣* Gor Mahia - *63 pts*
*2️⃣* Police FC - *54 pts*
*3️⃣* Tusker FC - *52 pts*
*4️⃣* Bandari - *46 pts*
*5️⃣* Nairobi City Stars - *46 pts*
*6️⃣* AFC Leopards - *44 pts*

⚪️ *Mugutha FC* - Rising stars of Ruiru!

Tunaonyesha mpira safi sana msimu huu! 💪

📲 *Reply 'MENU' for options*`;
  }

  // ── SQUAD ──
  if (['squad', 'team', 'wachezaji', 'players', '5'].includes(mappedCommand)) {
    return `👥 *MUGUTHA FC - SQUAD 2026*

🧤 *Goalkeepers:*
• Odhiambo (GK) - #1
• Omondi (GK) - #30

🛡️ *Defenders:*
• Mwangi (RB) - #2
• Kiprop (CB) - #4
• Njoroge (CB) - #5
• Wafula (LB) - #3

⚡ *Midfielders:*
• Otieno (CM) - #8 👑 *Captain*
• Wanjiru (CM) - #10
• Muthui (RW) - #7
• Kariuki (LW) - #11

🎯 *Forwards:*
• Kimani (ST) - #9 ⚽ *Top Scorer (8 goals)*
• Mwangi (ST) - #14

🔴 *Sisi ni familia moja!*

📲 *Reply 'MENU' for options*`;
  }

  // ── VENUE ──
  if (['venue', 'uwanja', 'stadium', 'ruiru', '6'].includes(mappedCommand)) {
    return `🏟️ *RUIRU STADIUM*

📍 *Location:* Off Thika Road, Ruiru Town
🧭 *Near:* Ruiru Railway Station

🅿️ *Parking:* Free on match days
🍽️ *Food:* Snacks & drinks available
🎫 *Tickets:* Sold at gate

📌 *Next match:* Saturday 3PM

*Karibu nyumbani!* 🏠⚽️

📲 *Reply 'MENU' for options*`;
  }

  // ── BUY TICKETS ──
  if (command === 'buy') {
    return `🎟️ *KUNUNUA TIKETI*

*1️⃣* Regular (KES 500)
*2️⃣* VIP (KES 2,000)
*3️⃣* VVIP (KES 5,000)

📲 *Pay via M-Pesa:*
• Paybill: *123456*
• Account: *MUGUTHA + Your Name*

Then send us the confirmation message.

Tickets can also be bought at the gate on match day.

*Hongera! See you at the stadium!* ⚽️`;
  }

  // ── DEFAULT RESPONSE ──
  return `⚽️ *MUGUTHA FC - RUIRU'S FINEST!*

Hujambo! Tuko Ruiru, tunapenda mpira. 🔴⚪️

I didn't recognize that command.

📲 *Reply with a number:*

*1️⃣* Fixtures
*2️⃣* Membership
*3️⃣* Tickets
*4️⃣* Standings
*5️⃣* Squad
*6️⃣* Venue
*0️⃣* Help Menu

🗣️ *Tunakungojea uwanjani!*`;
}

// ─── HANDLE INCOMING MESSAGES ───
exports.handle = async (req, res) => {
  // Always respond 200 immediately
  res.sendStatus(200);

  try {
    const { body } = req;
    
    // Extract message
    const message = body.entry?.[0]
      ?.changes?.[0]
      ?.value
      ?.messages?.[0];

    // If no message, it's a status update
    if (!message) {
      console.log("📬 Status update received");
      return;
    }

    // Get sender info
    const from = message.from;
    const text = message.text?.body || null;
    const name = body.entry?.[0]
      ?.changes?.[0]
      ?.value
      ?.contacts?.[0]
      ?.profile
      ?.name || "Unknown";

    // Clean log
    console.log("\n📩 New Message");
    console.log(`From: ${name} (${from})`);
    console.log(`Message: ${text || 'Non-text message'}`);
    console.log(`Type: ${message.type}`);
    console.log("=============================\n");

    // Handle non-text messages
    if (message.type !== "text" || !text) {
      await sendWhatsAppMessage(
        from,
        "📱 We currently support text messages. Tuma ujumbe wa maandishi ili tukusaidie.\n\nReply 'MENU' to see options."
      );
      return;
    }

    // ── Check if it's a new user (first message) ──
    if (!sessions.has(from)) {
      // Send welcome + menu for new users
      await sendWhatsAppMessage(
        from,
        "⚽️ *Welcome to Mugutha FC!*\n\nI'm your digital assistant. I can help with fixtures, membership, tickets, and more!\n\nLet's get started 👇"
      );
    }

    // Process command and get response
    const response = await processCommand(from, text);
    
    if (response) {
      await sendWhatsAppMessage(from, response);
    }

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    // We already sent 200, so Meta won't retry
  }
};
// ─── EXPORT FOR OTHER MODULES ───
module.exports = {
  verify: exports.verify,
  handle: exports.handle,
  sendWhatsAppMessage: sendWhatsAppMessage  // ← Export this
};