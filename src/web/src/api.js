/**
 * Centralized API client — automatically attaches Firebase Auth token to requests.
 * All components should use these helpers instead of raw fetch().
 */
import { auth } from './firebase';

async function getAuthHeaders(includeContentType = true) {
  const user = auth.currentUser;
  const headers = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.warn('[api] Failed to get ID token:', err.message);
    }
  }
  return headers;
}

export async function apiGet(path) {
  const headers = await getAuthHeaders(false);
  const res = await fetch(path, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await getAuthHeaders(true);
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function apiPut(path, body) {
  const headers = await getAuthHeaders(true);
  const res = await fetch(path, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}
