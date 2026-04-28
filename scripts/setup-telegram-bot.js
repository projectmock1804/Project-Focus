#!/usr/bin/env node
'use strict';

require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
  process.exit(1);
}

const API_URL = `https://api.telegram.org/bot${TOKEN}`;

async function setupBot() {
  try {
    console.log('⚙️  Setting up Telegram bot...\n');

    // 1. Set description
    console.log('1️⃣  Setting bot description...');
    await fetch(`${API_URL}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'An AI-powered accountability partner. Tell me what you\'re shipping today, and I\'ll track your progress, estimate milestones, and alert you when you drift.',
      }),
    });
    console.log('   ✓ Description set\n');

    // 2. Set short description
    console.log('2️⃣  Setting short description...');
    await fetch(`${API_URL}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: 'Quiet accountability. Firm feedback. Zero judgement.',
      }),
    });
    console.log('   ✓ Short description set\n');

    // 3. Set commands
    console.log('3️⃣  Setting bot commands...');
    await fetch(`${API_URL}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Start the bot and see today\'s tasks' },
          { command: 'help', description: 'Show available commands' },
          { command: 'today', description: 'Show today\'s tasks and progress' },
        ],
      }),
    });
    console.log('   ✓ Commands set\n');

    console.log('✅ Bot setup complete!\n');
    console.log('🤖 Bot URL: https://t.me/focus_accountability_bot');
    console.log('💬 Try sending: "finish Q1 deck by 6pm, 15 slides"\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupBot();
