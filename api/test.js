// api/test.js — no npm deps, just proves serverless routing is live
module.exports = function handler(req, res) {
  res.status(200).json({ status: 'ok', message: 'API routing is working', ts: Date.now() });
};
