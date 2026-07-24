// api.js – Shared API helper with JWT token support
export const API_BASE = 'https://studentnija-public-chat.onrender.com';

// Token management (in memory + localStorage/sessionStorage)
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    // We'll store in localStorage only if "remember me" is set, but we'll let the caller decide.
    // For simplicity, we store in localStorage by default, but we can also use sessionStorage.
    localStorage.setItem('studentnija_jwt', token);
  } else {
    localStorage.removeItem('studentnija_jwt');
    sessionStorage.removeItem('studentnija_jwt');
  }
}

export function getAuthToken() {
  if (!authToken) {
    // Try localStorage first, then sessionStorage
    authToken = localStorage.getItem('studentnija_jwt') || sessionStorage.getItem('studentnija_jwt');
  }
  return authToken;
}

export async function apiPost(path, body) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function apiGet(path) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(API_BASE + path, {
    method: 'GET',
    headers
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}