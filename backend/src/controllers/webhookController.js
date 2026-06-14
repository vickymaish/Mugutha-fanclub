exports.handle = async (req, res) => {
  // Minimal webhook handler
  console.log('webhook payload', req.body);
  res.status(200).json({ ok: true });
};
