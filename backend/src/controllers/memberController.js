const path = require("path");
const {
  listMembers,
  listAllMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember
} = require('../models/supabaseQueries');

const { generateMemberCard } = require('../services/imageService');
const { uploadImage, sendImage } = require('../services/mediaService');
const { sendMessage } = require('../services/whatsappService');

exports.list = async (req, res, next) => {
  try {
    const members = await listMembers();
    res.json(members);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      join_date: req.body.join_date || new Date().toISOString().slice(0, 10),
      membership_status: req.body.membership_status || 'active'
    };
    const member = await createMember(payload);
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const member = await getMember(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const member = await updateMember(req.params.id, req.body);
    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await deleteMember(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Returns tier counts for the dashboard — public, no auth required
exports.tierCounts = async (req, res, next) => {
  try {
    const members = await listAllMembers('active');
    res.json({
      total:  members.length,
      gold:   members.filter(m => m.tier === 'gold').length,
      silver: members.filter(m => m.tier === 'silver').length,
      bronze: members.filter(m => m.tier === 'bronze').length,
    });
  } catch (err) {
    next(err);
  }
};

exports.sendWelcomeCard = async (req, res, next) => {
  try {
    console.log("\n========== SEND WELCOME CARD ==========");
    console.log("Member ID:", req.params.id);

    const member = await getMember(req.params.id);

    console.log("===== MEMBER =====");
    console.log(member);
    console.log("==================");

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (!member.phone) {
      return res.status(400).json({ error: "Member has no phone number" });
    }

    const tier = (member.tier || "bronze").toLowerCase();

    console.log("Tier:", tier);
    console.log("Phone:", member.phone);
    console.log("Name:", member.name);

    const masterplates = {
      gold: path.join(process.cwd(), "assets", "masterplate-gold.jpg"),
      silver: path.join(process.cwd(), "assets", "masterplate-silver.jpg")
    };

    // Bronze gets text only
    if (tier === "bronze") {
      console.log("Bronze member -> sending text only...");

      await sendMessage({
        phone: member.phone,
        message:
          `⚽ Welcome ${member.name}!\n\n` +
          `Thank you for supporting Mugutha FC.\n\n` +
          `Your Bronze Membership is active.`
      });

      console.log("✅ Bronze message sent");

      return res.json({
        success: true,
        tier,
        type: "text"
      });
    }

    const memberId = `MFC-${new Date().getFullYear()}-${member.id.substring(0,6).toUpperCase()}`;

    console.log("Generated Member ID:", memberId);

    console.log("Generating image...");

    const imageBuffer = await generateMemberCard({
      masterplatePath: masterplates[tier],
      name: member.name,
      tier,
      memberId
    });

    console.log("✅ Image generated");
    console.log("Image size:", imageBuffer.length);

    console.log("Uploading image to Meta...");

    const mediaId = await uploadImage(imageBuffer);

    console.log("✅ Upload complete");
    console.log("Media ID:", mediaId);

    const caption =
      tier === "gold"
        ? `🏆 Welcome ${member.name}!\n\nYour Gold Membership is active.\nMember ID: ${memberId}`
        : `🥈 Welcome ${member.name}!\n\nYour Silver Membership is active.\nMember ID: ${memberId}`;

    console.log("Sending image...");

    const messageId = await sendImage(member.phone, mediaId, caption);

    console.log("✅ WhatsApp accepted image");
    console.log("Message ID:", messageId);

    res.json({
      success: true,
      tier,
      type: "image",
      messageId
    });

  } catch (err) {
    console.error("\n========== SEND CARD FAILED ==========");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Meta Response:");
      console.dir(err.response.data, { depth: null });
    } else {
      console.error(err);
    }

    console.error("======================================\n");

    next(err);
  }
};