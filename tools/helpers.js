import { buildUserContext } from '../state.js';

const PROXY_URL = "https://studentnija-proxy.donchester111.workers.dev";

let conversationHistory = [];
let currentAIModel = "llama-3.1-8b-instant";
let aiTemperature = 0.7;
let aiMaxTokens = 800;
let isAiProcessing = false;
let aiMemoryEnabled = true;
let aiNeonEffect = true;
let aiAccentColor = "#008751";
let aiPersonality = "Friendly Tutor";
let customHFUrl = "";

const GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

export function loadConversationHistory() {
  if (!currentUser) { conversationHistory = []; return; }
  const saved = localStorage.getItem(`studentnija_ai_history_${currentUser.id}`);
  if (saved) {
    try { conversationHistory = JSON.parse(saved); } catch(e) { conversationHistory = []; }
  } else { conversationHistory = []; }
}

export function saveConversationHistory() {
  if (currentUser) {
    localStorage.setItem(`studentnija_ai_history_${currentUser.id}`, JSON.stringify(conversationHistory));
  }
}

export function loadAISettings() {
  const saved = localStorage.getItem('studentnija_ai_settings');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      aiMemoryEnabled = s.memory !== undefined ? s.memory : true;
      aiNeonEffect = s.neon !== undefined ? s.neon : true;
      aiAccentColor = s.accent || "#008751";
      aiPersonality = s.personality || "Friendly Tutor";
      customHFUrl = s.hfUrl || "";
      currentAIModel = s.model || "llama-3.1-8b-instant";
      aiTemperature = s.temp !== undefined ? s.temp : 0.7;
    } catch(e) {}
  }
  applyAISettings();
}

export function saveAISettings() {
  localStorage.setItem('studentnija_ai_settings', JSON.stringify({
    memory: aiMemoryEnabled,
    neon: aiNeonEffect,
    accent: aiAccentColor,
    personality: aiPersonality,
    hfUrl: customHFUrl,
    model: currentAIModel,
    temp: aiTemperature
  }));
}

export function applyAISettings() {
  document.documentElement.style.setProperty('--ai-accent', aiAccentColor);
  if (aiNeonEffect) {
    document.body.classList.add('ai-neon');
  } else {
    document.body.classList.remove('ai-neon');
  }
}

export async function callAIHelper(userPrompt, purpose = "chat", context = "") {
  const systemPrompts = {
    chat: `You are StudentNija, an advanced AI study assistant for Nigerian students. Personality: ${aiPersonality}. You are helpful, thorough, and encouraging. Use markdown for formatting. If you don't know, say so honestly. Current date: ${new Date().toLocaleDateString()}.

${context ? `\n---\nYou have access to the user's current app data (provided below). Use this information to answer questions about their academics, schedule, and tasks.\n\n${context}` : ''}`,
    math: `You are a world-class math tutor. Solve step-by-step. Provide final answer clearly. Show reasoning.`,
    dictionary: `You are a helpful dictionary assistant. Provide clear, detailed explanations.`,
    quiz: `You are a quiz generator. Return only valid JSON.`,
    essay: `You are an expert essay writer and editor. Help the user with their writing by providing outlines, drafts, improvements, or suggestions.`,
    tutor: `You are a personal AI tutor. Based on the user's app data, provide a personalized study plan, recommend focus areas, and give actionable advice.`
  };

  const systemPrompt = systemPrompts[purpose] || systemPrompts.chat;
  let messages = [];

  if (purpose === "chat") {
    const sanitizedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content || ''
    }));
    messages = [
      { role: "system", content: systemPrompt },
      ...sanitizedHistory
    ];
  } else {
    messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
  }

  let endpoint = '';
  if (currentAIModel.startsWith("google/")) {
    endpoint = 'gemini';
  } else if (GROQ_MODELS.includes(currentAIModel)) {
    endpoint = 'groq';
  } else if (currentAIModel === 'gpt-4o-mini') {
    endpoint = 'github';
  } else {
    return '⚠️ Unknown model.';
  }

  let requestBody;

  if (endpoint === 'gemini') {
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const systemMsg = { role: 'user', parts: [{ text: systemPrompt }] };
    contents.unshift(systemMsg);
    requestBody = { contents };
  } else {
    let modelName;
    if (endpoint === 'groq') {
      modelName = currentAIModel;
    } else {
      modelName = "gpt-4o-mini";
    }
    requestBody = {
      model: modelName,
      messages: messages
    };
  }

  try {
    const response = await fetch(`${PROXY_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    if (endpoint === 'gemini') {
      return data.candidates[0].content.parts[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (err) {
    return 'Oops! The AI service is currently unavailable. Please try again later.';
  }
}

export async function callChatAI(userMessage) {
  const context = buildUserContext();
  return await callAIHelper(userMessage, "chat", context);
}

export async function callMathAI(mathQuery) {
  return await callAIHelper(mathQuery, "math");
}

export async function searchWeb(query) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Proxy failed");
    const data = await response.json();
    const html = data.contents;
    const snippetMatch = html.match(/<a class="result__a" href="[^"]*">([^<]+)<\/a>.*?<a class="result__snippet">([^<]+)<\/a>/s);
    if (snippetMatch) {
      return `🔍 Web results for "${query}":\n- ${snippetMatch[1]}: ${snippetMatch[2]}\n(More results available via browser)`;
    } else {
      return `No clear web results. Try using the Browser tool.`;
    }
  } catch(e) {
    return `⚠️ Web search unavailable. Please use the Browser tool for online searches.`;
  }
}
