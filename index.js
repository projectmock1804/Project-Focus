'use strict';

require('dotenv').config();
const { createApp } = require('./src/server/api');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function main() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`[Server] Project Focus API running at http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /api/quote                - Get inspirational quote from Claude');
    console.log('  POST /api/task/parse           - Parse task text via Claude');
    console.log('  POST /api/task/create-multi-stage - Create task from multi-stage form');
    console.log('  GET  /api/tasks                - Get all tasks for user (?userId=...)');
    console.log('  GET  /api/tasks/today          - Get today tasks (?userId=...)');
    console.log('  GET  /api/task/:id/progress    - Task progress + milestones');
    console.log('  PUT  /api/task/:id/update      - Update task details');
    console.log('  POST /api/session/log          - Log PC agent focus session');
  });

  // Start Telegram bot in same process (optional: run as separate process)
  // TODO: Re-enable after Phase 1 web testing complete
  // if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
  //   try {
  //     require('./src/bot/telegram');
  //     console.log('[Server] Telegram bot started');
  //   } catch (err) {
  //     console.error('[Server] Failed to start Telegram bot:', err.message);
  //   }
  // } else {
  //   console.log('[Server] Telegram bot skipped (TELEGRAM_BOT_TOKEN not configured)');
  // }
  console.log('[Server] Telegram bot disabled (Phase 1 testing)');
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
