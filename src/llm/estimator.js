'use strict';

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

/**
 * System prompt for task parsing and milestone generation.
 * Instructs Claude to extract structured task data from natural language.
 */
const SYSTEM_PROMPT = `You are a productivity assistant that parses work task descriptions and produces structured JSON for time management.

Given a natural language task description, extract:
- title: concise task name
- deadline: ISO 8601 UTC datetime (infer from context; today's date will be provided)
- output: concrete deliverable description
- estimatedHours: realistic time estimate as a float
- confidence: confidence in estimate 0.0–1.0
- riskFactors: array of strings describing risk areas
- milestones: exactly 5 milestone objects, each with:
  - n: milestone number 1–5
  - label: brief milestone description
  - at: time from start as "Xh Ym" string
  - ratio: cumulative completion ratio 0.0–1.0 (milestone 5 must be 1.0)

Respond ONLY with valid JSON, no markdown fences, no explanation.

Example input: "finish Q1 deck by 6pm, 15 slides"
Example output:
{
  "title": "Q1 investor deck",
  "deadline": "2026-04-24T09:00:00Z",
  "output": "15 slides, 5 charts",
  "estimatedHours": 4.0,
  "confidence": 0.78,
  "riskFactors": ["data reconciliation", "chart rework"],
  "milestones": [
    {"n": 1, "label": "Outline + data sourcing", "at": "0h 45m", "ratio": 0.15},
    {"n": 2, "label": "Slides 1–7 narrative", "at": "1h 30m", "ratio": 0.40},
    {"n": 3, "label": "Slides 8–12 financials", "at": "2h 30m", "ratio": 0.65},
    {"n": 4, "label": "Slides 13–15 outlook", "at": "3h 15m", "ratio": 0.85},
    {"n": 5, "label": "Review + polish", "at": "4h 00m", "ratio": 1.0}
  ]
}`;

/**
 * Parse a natural language task description into a structured task object.
 *
 * @param {string} taskText - Raw user input e.g. "finish Q1 deck by 6pm, 15 slides"
 * @param {Date} [referenceDate] - Date to use as "today" for deadline inference
 * @returns {Promise<Object>} Structured task object with milestones
 */
async function parseTask(taskText, referenceDate = new Date()) {
  if (!taskText || typeof taskText !== 'string' || taskText.trim().length === 0) {
    throw new Error('taskText must be a non-empty string');
  }

  console.log('[estimator] MODEL:', MODEL);
  console.log('[estimator] GEMINI_API_KEY:', GEMINI_API_KEY ? 'configured' : 'MISSING');

  const todayStr = referenceDate.toISOString().split('T')[0];
  const userMessage = `Today's date: ${todayStr}\nTask: ${taskText.trim()}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: SYSTEM_PROMPT + '\n\n' + userMessage,
          },
        ],
      },
    ],
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!rawText) {
    throw new Error('Gemini API returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
    }
  }

  const required = ['title', 'deadline', 'output', 'estimatedHours', 'confidence', 'riskFactors', 'milestones'];
  for (const field of required) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field in Gemini response: ${field}`);
    }
  }

  if (!Array.isArray(parsed.milestones) || parsed.milestones.length !== 5) {
    throw new Error(`Expected exactly 5 milestones, got ${parsed.milestones?.length}`);
  }

  return parsed;
}

/**
 * Estimate progress ratio given elapsed time vs task milestones.
 *
 * @param {Object} task - Task object with milestones and estimatedHours
 * @param {number} elapsedMinutes - Minutes elapsed since task start
 * @returns {{ratio: number, currentMilestone: number, nextMilestone: Object|null}} progress info
 */
function estimateProgress(task, elapsedMinutes) {
  const totalMinutes = task.estimatedHours * 60;
  const elapsedRatio = Math.min(elapsedMinutes / totalMinutes, 1.0);

  // Find which milestone we should be at
  let currentMilestone = 0;
  let nextMilestone = null;

  for (let i = 0; i < task.milestones.length; i++) {
    const ms = task.milestones[i];
    if (elapsedRatio >= ms.ratio) {
      currentMilestone = ms.n;
    } else {
      nextMilestone = ms;
      break;
    }
  }

  return {
    expectedRatio: elapsedRatio,
    currentMilestone,
    nextMilestone,
  };
}

/**
 * Parse milestone "at" string (e.g. "1h 30m") into total minutes.
 *
 * @param {string} atStr - Time string like "1h 30m" or "0h 45m"
 * @returns {number} Total minutes
 */
function parseMilestoneTime(atStr) {
  const hourMatch = atStr.match(/(\d+)h/);
  const minMatch = atStr.match(/(\d+)m/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

module.exports = { parseTask, estimateProgress, parseMilestoneTime };
