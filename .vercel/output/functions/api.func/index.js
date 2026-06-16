'use strict';
let appHandler;
let loadError;
try {
  const mod = require('./app-bundle.js');
  appHandler = mod.default || mod;
  if (typeof appHandler !== 'function') {
    loadError = new Error('App bundle did not export a function. Keys: ' + Object.keys(mod).join(', '));
    appHandler = null;
  }
} catch (err) {
  loadError = err;
}
module.exports = function handler(req, res) {
  if (loadError || !appHandler) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'App failed to load',
      message: loadError && loadError.message,
      stack: loadError && loadError.stack && loadError.stack.split('\n').slice(0, 5),
      env: {
        hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    }));
    return;
  }
  appHandler(req, res);
};
