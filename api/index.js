const app = require('../backend/server');

module.exports = (req, res) => {
  // Temp debug: expose req.url so we can see what Vercel passes in
  if (req.url === '/api/debug' || req.url.endsWith('?debug')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reqUrl: req.url, method: req.method }));
    return;
  }
  return app(req, res);
};
