# 🇳🇬 StudentNija

**Study Smarter. Score Higher.**

StudentNija is a feature‑rich, Progressive Web App (PWA) built for Nigerian students.  
It combines **academic tools, AI‑powered tutoring, group chat, past questions, and exam preparation** in a modern, mobile‑first interface.

---

## ✨ Features

- 📚 **Past Question Bank** – Practice JAMB, WAEC, NECO questions by subject and year
- 🧠 **AI Tutor** – Ask anything and get instant, intelligent responses (powered by Gemini / Groq)
- 💬 **Group Chat** – Real‑time study groups with reactions, replies, pinning, admin tools
- 📝 **Planner & Tasks** – Organise your study schedule
- 🧮 **Calculator, Dictionary, Library** – Built‑in study tools
- 🎯 **Daily Challenge** – Earn XP and keep your streak
- 🏆 **Leaderboard & Achievements** – Compete and stay motivated
- 🌗 **Dark / Light Theme** – Syncs across the entire app and sub‑pages
- 📶 **Offline Support** – Custom offline fallback page with graceful recovery
- 🔔 **Web Notifications** – Reminders for exams and classes (Service Worker based)
- 🔒 **Google Sign‑In** – Quick authentication using OAuth 2.0

---

## 🛠 Tech Stack

- **Frontend** – Vanilla HTML, CSS, JavaScript (ES Modules)
- **Backend** – Node.js + Socket.io (Chat & Real‑time), REST API proxy
- **AI Integration** – Groq / Gemini models via Cloudflare Worker proxy
- **Hosting** – Static frontend on Cloudflare Pages, backend on Render
- **PWA Features** – Service Worker, offline caching, install prompts
- **Notifications** – Web Push + Service Worker (no dependency)

---

## 📁 Project main Structure

```

studentnija/
├── index.html                 # Main entry point (PWA shell)
├── app.js                     # Core app logic, routing
├── state.js                   # Global state management
├── style.css                  # Main stylesheet
├── studentnija_sync.html      # Google OAuth redirect handler
├── AI.html                    # AI Tutor (standalone page)
├── Chat.html                  # Group Chat (Socket.io client)
├── Exam.html                  # Exam Hub (past questions)
├── offline.html               # Offline fallback page
├── 404.html                   # Custom error page
├── sw.js                      # Service Worker (offline + push)
├── notifications.js           # Notification bridge
├── manifest.json              # PWA manifest
├── pages/                     # Page modules (home, academics, etc.)
├── tools/                     # Standalone tool modules (calculator, library, etc.)
└── README.md & LICENSE


```

---

## 🚀 Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/donchester111-cpu/StudentNija.git
   cd studentnija
```

2. No build step required – The app uses vanilla ES modules and can be served directly.
3. Serve locally (using any static server)
   ```bash
   npx serve .
   ```
4. Configuration
   · Google OAuth – Update the CLIENT_ID in studentnija_sync.html and the redirect URI in Google Cloud Console.
   · Chat Server – The chat backend expects Socket.io at https://studentnija-public-chat.onrender.com. Update Chat.html if you run your own.
   · AI Proxy – The AI tutor uses a Cloudflare Worker (studentnija-proxy.donchester111.workers.dev). Replace the endpoint if needed.

---

📦 Deployment

The app is fully static (frontend). The recommended deployment is:

· Frontend → Cloudflare Pages (or Netlify, Vercel)
· Chat / API → Render (or any Node.js host)
· Service Worker – Place sw.js in the root for PWA capabilities.
· Custom Error Pages – Rename error.html to 404.html and deploy to catch broken links.

---

📶 Service Worker & Offline

· The service worker (sw.js) caches core assets and serves an elegant offline fallback when the network is unavailable.
· Custom offline page (offline.html) provides a reassuring message and a retry button.
· A separate error page (404.html) handles HTTP errors gracefully.

---

🔔 Notifications

· Uses standard Web Push Notifications with a service worker.
· No longer dependent on DroidScript – works in any modern browser.
· Notification permissions are requested on first interaction.

---

🎨 Customisation

· Themes – The main app, AI page, Chat, and Exam Hub all sync themes via localStorage keys (studentnija_settings and studentnija_chat_settings_v3).
· Accent colours – Change the accent in settings to give the app your personal touch.

---

🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

📜 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

🙏 Acknowledgements

· Workbox – Service Worker libraries
· Socket.io – Real‑time communication
· Google Gemini / Groq – AI models
· Cloudflare Workers – AI proxy
· PWA Builder – PWA inspiration

---

Made with ❤️ for Nigerian students.

```
