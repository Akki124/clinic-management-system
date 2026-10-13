// Vercel Serverless Function entry point for Express API
const app = require('../backend/src/app');

module.exports = (req, res) => {
  // If Vercel rewrites stripped '/api', normalize it so Express route handlers match
  if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
