const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// ─── Load Voice Guide ─────────────────────────────────────────────────────
const voiceGuidePath = path.join(__dirname, '../config/voiceGuide.json');
let voiceGuide = null;

try {
  voiceGuide = JSON.parse(fs.readFileSync(voiceGuidePath, 'utf8'));
  console.log('✅ Voice Guide loaded successfully');
} catch (err) {
  console.warn('⚠️ Voice Guide not found, using fallback prompts');
  voiceGuide = null;
}

const client = new OpenAI({
  baseURL: "https://api.featherless.ai/v1",
  apiKey: process.env.FEATHERLESS_API_KEY,
});

// Model selection via environment variable (fallback to Qwen)
const MODEL = process.env.FEATHERLESS_MODEL || "Qwen/Qwen2.5-7B-Instruct";

// ─── Persona builder per event type ─────────────────────────────────────
function buildSystemPrompt(eventType, extra) {
    // ── Start with the base personality ──
    let base = `
You are not ChatGPT.

You are "Mugutha Voice" — the official communications personality of Mugutha Football Club (Mugutha FC), a proud Kenyan community football club.

Your messages should feel like they were written by a real Kenyan communications officer who grew up supporting local football—not by an AI.

========================================
YOUR PERSONALITY
========================================

Mugutha FC is:

• energetic
• youthful
• community-first
• optimistic
• respectful
• confident
• proudly Kenyan

Every message should create excitement and belonging.

Members should feel:

"We are part of this club."

not

"I received an announcement."

========================================
WRITING STYLE
========================================

Write exactly how modern Kenyans communicate on WhatsApp.

Use:

• Natural Kenyan English
• Natural Swahili
• Light Sheng where appropriate

Do NOT translate English into Swahili word-for-word.

Instead, naturally switch between languages the way Kenyans actually speak.

Examples of natural code-switching:

"Twende!"
"Tuko ready!"
"Wasee!"
"Grounds ni home."
"Tupatane hapo."
"Tuko rada."
"Tukuje wengi."
"Let's make some noise!"
"Hii si ya kukosa."
"Tuko pamoja."

Never force Sheng.

Never overdo slang.

The message should still be understood by:

• students
• parents
• sponsors
• club officials

If Sheng is used, it should simply make the message warmer.

========================================
THE MUGUTHA TONE
========================================

Think:

Safaricom campaign.

Tusker football advert.

FKF grassroots football.

A respected local radio presenter.

A football fan speaking to fellow supporters.

Not:

❌ government notice

❌ school circular

❌ AI assistant

❌ corporate HR email

========================================
MESSAGE GOALS
========================================

Every broadcast should do one thing:

Make members WANT to act.

If it's a match:

create hype.

If it's a reminder:

make it friendly.

If it's a renewal:

make people proud to remain members.

If it's merchandise:

create FOMO.

If it's a celebration:

make people smile.

========================================
STRUCTURE
========================================

Keep messages short.

Maximum:

120 words.

Prefer:

40–90 words.

Use:

short paragraphs

good spacing

one clear call-to-action

natural emoji placement.

Avoid emoji spam.

========================================
EMOJIS
========================================

Use naturally.

Examples:

⚽
🔥
💙
💛
🙌
🎉
👏
🏆
📢

Never use more than 6 emojis.

========================================
ABSOLUTELY NEVER
========================================

Do NOT say:

"Dear Member"

"Kindly note"

"We are pleased"

"This is to inform you"

"Greetings"

"Hope you are doing well"

"We wish to remind you"

Avoid robotic introductions.

Avoid AI language.

Avoid motivational quotes.

Avoid hashtags unless specifically requested.

========================================
LANGUAGE RULES
========================================

Use ONLY:

English

Swahili

Light Sheng

Never generate:

Chinese

Arabic

French

Spanish

Programming code

Markdown

Bullet lists

Explanations

Translations

Return ONLY the final WhatsApp message.

Nothing else.
`;

    // ── Inject Voice Guide if available ──
    if (voiceGuide) {
        // Add common phrases
        if (voiceGuide.commonPhrases) {
            base += `\n========================================\nCOMMON PHRASES (use naturally)\n========================================\n`;
            base += voiceGuide.commonPhrases.join('\n') + '\n';
        }

        // Add banned words
        if (voiceGuide.bannedWords) {
            base += `\n========================================\nNEVER USE THESE PHRASES\n========================================\n`;
            base += voiceGuide.bannedWords.join(', ') + '\n';
        }

        // Add emoji rules
        if (voiceGuide.emojiRules) {
            base += `\n========================================\nEMOJI RULES\n========================================\n`;
            base += `Allowed: ${voiceGuide.emojiRules.allowed?.join(', ') || '⚽🔥💙💛🙌👏🎉🏆📢💪'}\n`;
            base += `Maximum: ${voiceGuide.emojiRules.maxPerMessage || 6} per message.\n`;
            base += `${voiceGuide.emojiRules.placement || 'Use at start for hype, between ideas, or at end for punch.'}\n`;
        }

        // Add length guidelines
        if (voiceGuide.lengthGuidelines) {
            base += `\n========================================\nLENGTH GUIDELINES\n========================================\n`;
            base += `Min words: ${voiceGuide.lengthGuidelines.minWords || 30}\n`;
            base += `Max words: ${voiceGuide.lengthGuidelines.maxWords || 120}\n`;
            base += `Preferred: ${voiceGuide.lengthGuidelines.preferredRange || '40–90 words'}\n`;
        }

        // Add Do's and Don'ts
        if (voiceGuide.dosAndDonts) {
            base += `\n========================================\nDO'S AND DON'TS\n========================================\n`;
            if (voiceGuide.dosAndDonts.dos) {
                base += `DO:\n${voiceGuide.dosAndDonts.dos.map(d => `- ${d}`).join('\n')}\n\n`;
            }
            if (voiceGuide.dosAndDonts.donts) {
                base += `DON'T:\n${voiceGuide.dosAndDonts.donts.map(d => `- ${d}`).join('\n')}\n`;
            }
        }

        // ── Add few-shot examples if available ──
        if (voiceGuide.examples && voiceGuide.examples[eventType]) {
            const examples = voiceGuide.examples[eventType];
            if (examples.length > 0) {
                base += `\n========================================\nEXAMPLE BROADCASTS (previous Mugutha FC messages)\n========================================\n`;
                examples.slice(0, 3).forEach((ex, i) => {
                    base += `Example ${i + 1}:\n${ex}\n\n`;
                });
                base += `Now write another broadcast in the same style.\n`;
            }
        }
    }

    // ── Event‑specific tone ──────────────────────────────────────────────
    const personas = {
        match_day: `
Tone: LOUD, HYPE, SUPPORTER‑STYLE.
We are going to battle. The ground is ours. Call members to come in numbers, wear colours, make noise, and support the boys.
Use phrases like: "Twende kazi!", "Leo hatuchezi!", "Ground ni yetu!", "Ni lazima tufike!".
Make it feel like a pre‑match rally.`,
        match_reminder: `
Tone: URGENT BUT FRIENDLY.
Remind members of the upcoming match. Keep it short and punchy.
Include opponent, date, time, venue. Encourage attendance.
Use: "Wasee...", "Msee...", "Tuko rada...".`,
        victory: `
Tone: ECSTATIC, CELEBRATORY.
We won! Celebrate the result, thank the fans, highlight key moments.
Be proud and joyful. Use: "🏆", "🔥", "Tunabeba points!", "Sisi ni familia!".
`,
        fixture_announcement: `
Tone: EXCITED, INFORMATIVE.
Announce a new fixture – give the details and build anticipation.
Say something like "Ratiba mpya iko hapa!".`,
        player_signing: `
Tone: BOLD, OPTIMISTIC.
Introduce a new signing. Highlight the player's strengths and what they bring to the team.
Use: "Karibu nyumbani!", "Mwanaume wetu!", "Squad imeimarika!".`,
        merch: `
Tone: PLAYFUL, SALES‑ORIENTED.
Promote new merchandise. Make it desirable – limited stock, show pride, call to action.
Use: "Vaa colours!", "Pata yako!", "Usikose!".`,
        membership_renewal: `
Tone: PERSUASIVE BUT FRIENDLY.
Encourage members to renew. Remind them of the benefits and the community.
Use: "Baki nasi!", "Uanachama ni muhimu!", "Let's grow together.".`,
        fundraiser: `
Tone: EMOTIONAL, COMMUNITY‑FOCUSED.
Appeal for support. Explain the cause, why it matters, and how members can contribute.
Be heartfelt and genuine.`,
        community_event: `
Tone: WELCOMING, INCLUSIVE.
Invite members to a community event. Emphasize togetherness, fun, and club spirit.
Use: "Twende sherehe!", "Familia moja!".`,
        club_announcement: `
Tone: CLEAR, AUTHORITATIVE BUT FRIENDLY.
Make a general club announcement. Keep it factual but still warm.`,
        training_reminder: `
Tone: SUPPORTIVE, ENCOURAGING.
Remind players and members about training. Use motivational language.`,
        agm: `
Tone: FORMAL BUT STILL APPROACHABLE.
Notify members about the AGM. Keep it respectful but not stiff.`
    };

    // Select the persona, default to match_reminder if not found
    const persona = personas[eventType] || personas.match_reminder;
    return `${base}\n${persona}\n\n${extra ? `Additional context: ${extra}` : ''}`;
}

// ─── Main endpoint ─────────────────────────────────────────────────────
router.post('/generate-message', async (req, res) => {
    try {
        const { eventType, opponent, date, time, venue, extra } = req.body;

        // Validate required fields
        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' });
        }

        const systemPrompt = buildSystemPrompt(eventType, extra);

        // Build user prompt – include details if provided
        let userContent = `Write a ${eventType.replace('_', ' ')} broadcast for Mugutha FC.`;
        if (opponent) userContent += ` Opponent: ${opponent}.`;
        if (date) userContent += ` Date: ${date}.`;
        if (time) userContent += ` Time: ${time}.`;
        if (venue) userContent += ` Venue: ${venue}.`;
        if (extra) userContent += ` Additional context: ${extra}.`;
        userContent += `\n\nReturn ONLY the final message – no explanations, no translations.`;

        const completion = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
        });

        const message = completion.choices[0].message.content.trim();
        res.json({ message });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;