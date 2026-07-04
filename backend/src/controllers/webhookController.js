const { whatsapp } = require("../config/env");

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

const PHONE_NUMBER_ID = whatsapp.phoneNumberId;
const ACCESS_TOKEN = whatsapp.apiToken;

console.log("PHONE ID:", PHONE_NUMBER_ID);
console.log("TOKEN EXISTS:", !!ACCESS_TOKEN);
// ============ VERIFICATION ============
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

// ============ SEND MESSAGE ============
async function sendWhatsAppMessage(to, text) {
  try {
    console.log("Sending to URL:");
    console.log(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`);

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
      console.error("❌ API Error:", {
        status: response.status,
        data: data
      });
      return null;
    }

    console.log(`✅ Message sent to ${to}`);
    return data;

  } catch (error) {
    console.error("❌ Send error:", error.message);
    return null;
  }
}

// ============ PROCESS COMMANDS ============
async function processCommand(from, text) {
  const command = text.toLowerCase().trim();

  // Greeting
  if (["hello", "hi", "hey", "hola", "sasa", "mambo", "vipi"].includes(command)) {
    return "👋 Sasa! Karibu Mugutha FC!\n\nTuko Ruiru, ready kuwalisha mpira wa hali ya juu. Unaweza niuliza:\n• Fixtures - Ratiba ya mechi\n• Membership - Hali ya uanachama\n• Tickets - Bei za tiketi\n• Standings - Msimamo wa ligi\n\n🗣️ Reply with any command!";
  }

  // Fixtures - Local Mt. Kenya region
  if (["fixtures", "matches", "ratiba", "mechi", "game", "match"].includes(command)) {
    return "⚽️ MUGUTHA FC - RATIBA YA MECHI\n\n🟢 Home Matches (Ruiru Stadium):\n📅 This Saturday: Mugutha FC vs Mt. Kenya United - 3PM\n📅 Next Wed: Mugutha FC vs Ruiru Hotstars - 4PM\n\n🔴 Away Matches:\n📅 Sunday: Mugutha FC vs Kariobangi Sharks - 2PM\n📅 Next Fri: Mugutha FC vs Nairobi City Stars - 4PM\n\n📍 Venue: Ruiru Stadium, off Thika Road\n\nTumeshinda mechi 5 mfululizo! 🔥";
  }

  // Kenyan Premier League Standings
  if (["standings", "msimamo", "table", "liga", "ligi"].includes(command)) {
    return "🏆 KENYAN PREMIER LEAGUE - TOP 6\n\n1️⃣ Gor Mahia - 63 pts\n2️⃣ Police FC - 54 pts\n3️⃣ Tusker FC - 52 pts\n4️⃣ Bandari - 46 pts\n5️⃣ Nairobi City Stars - 46 pts\n6️⃣ AFC Leopards - 44 pts\n\n⚪️ Mugutha FC - Rising stars of Ruiru!\n\nTunaonyesha mpira safi sana msimu huu! 💪";
  }

  // Membership
  if (["membership", "uanachama", "status", "member", "join"].includes(command)) {
    return "🎫 MUGUTHA FC - UANACHAMA\n\n✅ Status: Active\n📅 Expires: 15 August 2026\n🏷️ Type: Premium\n💰 Fees: KES 2,500/season\n\n🎁 Benefits:\n• Free entry to all home matches\n• Mugutha FC jersey (2026 edition)\n• 20% off at team shop\n• Access to members-only events\n\n📞 Call 0733 461 153 for inquiries";
  }

  // Tickets
  if (["tickets", "tiketi", "ticket", "price", "bei"].includes(command)) {
    return "🎟️ MUGUTHA FC - BEI ZA TIKETI\n\n🏟️ Home Matches (Ruiru Stadium):\n• Regular: KES 500\n• VIP: KES 2,000\n• VVIP: KES 5,000\n\n📱 Buy tickets via:\n• M-Pesa Paybill: 123456\n• At the gate before kickoff\n• Online: muguthafc.co.ke/tickets\n\n🗣️ 'Buy' to purchase!";
  }

  // Help
  if (["help", "menu", "commands", "?", "saidia"].includes(command)) {
    return "📋 MUGUTHA FC - COMMANDS\n\n• Hello, Sasa - Greeting\n• Fixtures, Ratiba - Match schedule\n• Standings, Msimamo - League table\n• Membership, Uanachama - Your status\n• Tickets, Tiketi - Price list\n• Squad, Team - Player info\n• Venue, Uwanja - Stadium details\n• Help, Menu - This list\n\nTuko hapa kukusaidia! ⚽️";
  }

  // Squad info
  if (["squad", "team", "wachezaji", "players"].includes(command)) {
    return "👥 MUGUTHA FC - SQUAD 2026\n\n🧤 Goalkeepers:\n• Odhiambo (GK) - #1\n• Omondi (GK) - #30\n\n🛡️ Defenders:\n• Mwangi (RB) - #2\n• Kiprop (CB) - #4\n• Njoroge (CB) - #5\n• Wafula (LB) - #3\n\n⚡ Midfielders:\n• Otieno (CM) - #8 - Captain\n• Wanjiru (CM) - #10\n• Muthui (RW) - #7\n• Kariuki (LW) - #11\n\n🎯 Forwards:\n• Kimani (ST) - #9 - Top Scorer (8 goals)\n• Mwangi (ST) - #14\n\n🔴 Sisi ni familia moja!";
  }

  // Venue info
  if (["venue", "uwanja", "stadium", "ruiru"].includes(command)) {
    return "🏟️ RUIRU STADIUM\n\n📍 Location: Off Thika Road, Ruiru Town\n🧭 Near Ruiru Railway Station\n\n🅿️ Parking: Free on match days\n🍽️ Food: Snacks & drinks available\n🎫 Tickets: Sold at gate\n\n📌 Next match: Saturday 3PM\n\nKaribu nyumbani! 🏠⚽️";
  }

  // Buy tickets
  if (command === "buy") {
    return "🎟️ KUNUNUA TIKETI\n\n1️⃣ Regular (KES 500)\n2️⃣ VIP (KES 2,000)\n3️⃣ VVIP (KES 5,000)\n\n📲 Pay via M-Pesa:\nPaybill: 123456\nAccount: MUGUTHA + Your Name\n\nThen send us the confirmation message.\n\nTickets can also be bought at the gate on match day.\n\nHongera! See you at the stadium! ⚽️";
  }

  // Default response with local flavor
  return `⚽️ MUGUTHA FC - RUIRU'S FINEST!\n\nTumepokea: "${text}"\n\nHujambo! Tuko Ruiru, tunapenda mpira. 🔴⚪️\n\nReply with 'Help' or 'Menu' to see all commands.\n\n🗣️ Tunakungojea uwanjani!`;
}

// ============ HANDLE INCOMING MESSAGES ============
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
        "📱 We currently support text messages. Tuma ujumbe wa maandishi ili tukusaidie."
      );
      return;
    }

    // Process command and get response
    const response = await processCommand(from, text);
    
    if (response) {
      // We have a response - send it
      await sendWhatsAppMessage(from, response);
    }

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    // We already sent 200, so Meta won't retry
  }
};