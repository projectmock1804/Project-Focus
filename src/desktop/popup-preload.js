'use strict';

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronPopup', {
  async backToWork() {
    try {
      console.log('[Popup] Back to work clicked - sending request');
      const res = await fetch('http://127.0.0.1:3001/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backToWork' }),
      });
      console.log('[Popup] Back to work response received:', res.status);
      const data = await res.json();
      console.log('[Popup] Back to work response data:', data);
      return data;
    } catch (err) {
      console.error('[Popup] Back to work error:', err.message, err.stack);
      throw err;
    }
  },
  async snooze() {
    try {
      console.log('[Popup] Snooze clicked - sending request');
      const res = await fetch('http://127.0.0.1:3001/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snooze' }),
      });
      console.log('[Popup] Snooze response received:', res.status);
      const data = await res.json();
      console.log('[Popup] Snooze response data:', data);
      return data;
    } catch (err) {
      console.error('[Popup] Snooze error:', err.message, err.stack);
      throw err;
    }
  },
  async dismiss() {
    try {
      console.log('[Popup] Dismiss clicked - sending request');
      const res = await fetch('http://127.0.0.1:3001/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      });
      console.log('[Popup] Dismiss response received:', res.status);
      const data = await res.json();
      console.log('[Popup] Dismiss response data:', data);
      return data;
    } catch (err) {
      console.error('[Popup] Dismiss error:', err.message, err.stack);
      throw err;
    }
  },
});
