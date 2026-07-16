// api.js – Shared API helper
const API_BASE = 'https://studentnija-public-chat.onrender.com';

export async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  return res.json();
}