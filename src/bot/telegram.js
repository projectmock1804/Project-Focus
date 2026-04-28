'use strict';

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { parseTask } = require('../llm/estimator');
const { createTask, getTodayTasks, getTaskById, updateTaskProgress } = require('../db/sheets');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USER_ID = process.env.USER_TELEGRAM_ID ? String(process.env.USER_TELEGRAM_ID) : '5220637378';

if (!TOKEN) {
  console.error('[Bot] ERROR: TELEGRAM_BOT_TOKEN is not set in environment');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('[Bot] Project Focus Telegram bot starting...');

// =============================================================================
// Auth guard — only respond to the configured user
// =============================================================================
function isAuthorized(msg) {
  return String(msg.from.id) === ALLOWED_USER_ID;
}

function unauthorized(chatId) {
  bot.sendMessage(chatId, '접근이 거부되었습니다. 이 봇은 개인용입니다.');
}

// =============================================================================
// Command handlers
// =============================================================================

/**
 * /start — Welcome message
 */
bot.onText(/^\/start$/, (msg) => {
  if (!isAuthorized(msg)) return unauthorized(msg.chat.id);

  const name = msg.from.first_name || '사용자';
  bot.sendMessage(
    msg.chat.id,
    `안녕하세요, ${name}님! 👋\n\nProject Focus에 오신 것을 환영합니다.\n\n` +
    `오늘 할 일을 자연스럽게 입력해 주세요:\n` +
    `예) "Q1 발표자료 완성 오후 6시까지, 15슬라이드"\n` +
    `예) "finish Q1 deck by 6pm, 15 slides"\n\n` +
    `명령어:\n` +
    `/today - 오늘 할 일 목록\n` +
    `/help - 도움말`
  );
});

/**
 * /help — Help message
 */
bot.onText(/^\/help$/, (msg) => {
  if (!isAuthorized(msg)) return unauthorized(msg.chat.id);

  bot.sendMessage(
    msg.chat.id,
    `*Project Focus 사용법*\n\n` +
    `*할 일 등록:*\n` +
    `그냥 메시지로 입력하세요!\n` +
    `예) "마케팅 보고서 오후 3시까지"\n` +
    `예) "코드 리뷰 2시간 내로"\n\n` +
    `*명령어:*\n` +
    `/today - 오늘 할 일 목록\n` +
    `/start - 처음으로\n` +
    `/help - 이 도움말`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * /today — Show today's tasks
 */
bot.onText(/^\/today$/, async (msg) => {
  if (!isAuthorized(msg)) return unauthorized(msg.chat.id);

  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  try {
    await bot.sendMessage(chatId, '오늘 할 일을 불러오는 중...');
    const tasks = await getTodayTasks(userId);

    if (tasks.length === 0) {
      bot.sendMessage(chatId, '오늘 등록된 할 일이 없습니다.\n\n할 일을 입력하면 자동으로 분석해드립니다!');
      return;
    }

    const lines = tasks.map((t, i) => {
      const statusEmoji = t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : '⏳';
      const progress = Math.round(t.progress);
      const deadline = t.deadline ? new Date(t.deadline).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
      return `${statusEmoji} ${i + 1}. *${t.title}*\n   진도: ${progress}% | 마감: ${deadline} | ${t.estimatedHours}h`;
    });

    bot.sendMessage(
      chatId,
      `*오늘의 할 일 (${tasks.length}개)*\n\n${lines.join('\n\n')}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('[Bot] /today error:', err);
    bot.sendMessage(chatId, '할 일 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
});

// =============================================================================
// Natural language task input
// =============================================================================

/**
 * Handle any non-command message as a task description.
 */
bot.on('message', async (msg) => {
  // Skip commands
  if (msg.text && msg.text.startsWith('/')) return;
  if (!msg.text) return;
  if (!isAuthorized(msg)) return unauthorized(msg.chat.id);

  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const taskText = msg.text.trim();

  // Ignore very short messages
  if (taskText.length < 5) {
    bot.sendMessage(chatId, '조금 더 구체적으로 입력해 주세요.\n예) "보고서 작성 오후 5시까지"');
    return;
  }

  try {
    // Acknowledge immediately
    const thinkingMsg = await bot.sendMessage(chatId, '분석 중... Claude가 할 일을 분석하고 있습니다 ⚡');

    // Call Claude to parse the task
    const parsed = await parseTask(taskText);

    // Save to Google Sheets
    const taskId = await createTask(parsed, userId);

    // Format deadline for display
    const deadlineDate = new Date(parsed.deadline);
    const deadlineStr = deadlineDate.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Format milestones
    const milestoneLines = parsed.milestones.map((ms) =>
      `  ${ms.n}. ${ms.label} (${ms.at})`
    ).join('\n');

    // Format risk factors
    const riskLines = parsed.riskFactors.length > 0
      ? parsed.riskFactors.map((r) => `  • ${r}`).join('\n')
      : '  없음';

    const confidencePct = Math.round(parsed.confidence * 100);

    const reply =
      `✅ *할 일이 등록되었습니다!*\n\n` +
      `📋 *${parsed.title}*\n` +
      `⏰ 마감: ${deadlineStr}\n` +
      `📦 산출물: ${parsed.output}\n` +
      `⏱ 예상 시간: ${parsed.estimatedHours}시간\n` +
      `🎯 신뢰도: ${confidencePct}%\n\n` +
      `📍 *마일스톤 5개:*\n${milestoneLines}\n\n` +
      `⚠️ *리스크 요인:*\n${riskLines}\n\n` +
      `_Task ID: ${taskId}_`;

    // Edit the "thinking" message with the result
    await bot.editMessageText(reply, {
      chat_id: chatId,
      message_id: thinkingMsg.message_id,
      parse_mode: 'Markdown',
    });

  } catch (err) {
    console.error('[Bot] Task parse error:', err);
    bot.sendMessage(
      chatId,
      `할 일 분석 중 오류가 발생했습니다.\n\n오류: ${err.message}\n\n다시 시도해 주세요.`
    );
  }
});

// =============================================================================
// Error handling
// =============================================================================

bot.on('polling_error', (err) => {
  console.error('[Bot] Polling error:', err.message);
});

bot.on('error', (err) => {
  console.error('[Bot] Error:', err.message);
});

console.log('[Bot] Bot is ready and polling for messages');

module.exports = bot;
