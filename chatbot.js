/* ============================================
   DARLA PRAVEEN — CyberGuard AI Chatbot
   Full AI Assistant + Bio Knowledge
   Powered by Google Gemini API (Free)
   ============================================ */

(function() {
  'use strict';

  // ───── Backend API URL (deployed on Railway) ─────
  // Change this to your Railway URL after deploying bot_3
  const BACKEND_URL = 'https://web-production-9c69c.up.railway.app';

  // ───── Praveen's Bio Context (kept for reference, actual prompt is on the server) ─────

  // ───── Chat History for Context ─────
  let chatHistory = [];
  const sessionId = 'portfolio_' + Math.random().toString(36).substr(2, 9);

  // ───── Call Backend API with auto-retry ─────
  async function callGeminiAPI(userMessage, retryCount = 0) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/portfolio-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      if (res.status === 429) {
        if (retryCount < 3) {
          const waitSec = (retryCount + 1) * 3;
          await new Promise(r => setTimeout(r, waitSec * 1000));
          return callGeminiAPI(userMessage, retryCount + 1);
        }
        return '⏳ Server is busy. Please wait a few seconds and try again.';
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      return data.response || 'Sorry, I couldn\'t process that. Please try again.';

    } catch (err) {
      console.error('Backend API Error:', err);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return callGeminiAPI(userMessage, retryCount + 1);
      }
      return `❌ Connection error. Please check your internet and try again.`;
    }
  }

  // ───── Simple Markdown to HTML ─────
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? escapeHtml(url) : '#';
    } catch (_) {
      return '#';
    }
  }

  function md(text) {
    return escapeHtml(text)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .replace(/\n/g, '<br>');
  }

  // ───── Voice (TTS) ─────
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/\*\*/g, '').replace(/[_*#`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/```[\s\S]*?```/g, '');
    // Limit speech to first 300 chars for long responses
    const shortText = plain.length > 300 ? plain.substring(0, 300) + '...' : plain;
    const utter = new SpeechSynthesisUtterance(shortText);
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
                  || voices.find(v => v.lang.startsWith('en'))
                  || voices[0];
    if (enVoice) utter.voice = enVoice;
    window.speechSynthesis.speak(utter);
  }

  // ───── Speech Recognition ─────
  let recognition = null;
  function initSpeechRecognition(onResult) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    recognition.onerror = () => {};
    return recognition;
  }

  // ───── Build Chat UI ─────
  function buildUI() {
    const btn = document.createElement('div');
    btn.id = 'cyberguard-btn';
    btn.innerHTML = '<i class="fas fa-shield-halved"></i>';
    btn.title = 'CyberGuard AI Assistant';
    document.body.appendChild(btn);

    const chat = document.createElement('div');
    chat.id = 'cyberguard-chat';
    chat.innerHTML = `
      <div class="cg-header">
        <div class="cg-header-info">
          <div class="cg-avatar"><i class="fas fa-shield-halved"></i></div>
          <div>
            <div class="cg-title">CyberGuard AI</div>
            <div class="cg-subtitle">AI Assistant • Online</div>
          </div>
        </div>
        <button class="cg-close" id="cgClose">&times;</button>
      </div>
      <div class="cg-particles" id="cgParticles"></div>
      <div class="cg-messages" id="cgMessages"></div>
      <div class="cg-input-area">
        <button class="cg-mic" id="cgMic" title="Voice Input"><i class="fas fa-microphone"></i></button>
        <input type="text" class="cg-input" id="cgInput" placeholder="Ask me anything..." autocomplete="off" />
        <button class="cg-send" id="cgSend"><i class="fas fa-paper-plane"></i></button>
      </div>
    `;
    document.body.appendChild(chat);

    const particlesEl = document.getElementById('cgParticles');
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('span');
      p.className = 'cg-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 5 + 's';
      p.style.animationDuration = (3 + Math.random() * 4) + 's';
      particlesEl.appendChild(p);
    }

    return { btn, chat };
  }

  // ───── Add Message ─────
  function addMessage(text, sender) {
    const container = document.getElementById('cgMessages');
    const msg = document.createElement('div');
    msg.className = `cg-msg cg-msg-${sender}`;

    if (sender === 'bot') {
      msg.innerHTML = `<div class="cg-msg-avatar"><i class="fas fa-shield-halved"></i></div><div class="cg-msg-bubble">${md(text)}</div>`;
    } else {
      msg.innerHTML = `<div class="cg-msg-bubble">${escapeHtml(text)}</div>`;
    }

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  // ───── Typing Indicator ─────
  function showTyping() {
    const container = document.getElementById('cgMessages');
    const msg = document.createElement('div');
    msg.className = 'cg-msg cg-msg-bot cg-typing-msg';
    msg.innerHTML = `<div class="cg-msg-avatar"><i class="fas fa-shield-halved"></i></div><div class="cg-msg-bubble"><span class="cg-typing"><span></span><span></span><span></span></span></div>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  // ───── Init ─────
  document.addEventListener('DOMContentLoaded', () => {
    const { btn, chat } = buildUI();
    let isOpen = false;
    let welcomed = false;

    btn.addEventListener('click', () => {
      isOpen = !isOpen;
      chat.classList.toggle('cg-open', isOpen);
      btn.classList.toggle('cg-active', isOpen);

      if (isOpen && !welcomed) {
        welcomed = true;
        setTimeout(() => {
          const welcome = "Welcome sir! 👋 I'm **CyberGuard AI**, your intelligent assistant. I can answer **any question** — tech, science, coding, general knowledge, or anything about **Darla Praveen**. How can I help you?";
          addMessage(welcome, 'bot');
          speak("Welcome sir! What can I do for you?");
        }, 500);
      }
    });

    document.getElementById('cgClose').addEventListener('click', () => {
      isOpen = false;
      chat.classList.remove('cg-open');
      btn.classList.remove('cg-active');
    });

    // Send message
    async function sendMessage() {
      const input = document.getElementById('cgInput');
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';

      const typing = showTyping();

      // Call Gemini AI for ALL questions
      const response = await callGeminiAPI(text);

      typing.remove();
      addMessage(response, 'bot');
      speak(response);
    }

    document.getElementById('cgSend').addEventListener('click', sendMessage);
    document.getElementById('cgInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Voice input
    const micBtn = document.getElementById('cgMic');
    initSpeechRecognition((text) => {
      document.getElementById('cgInput').value = text;
      micBtn.classList.remove('cg-mic-active');
      sendMessage();
    });

    micBtn.addEventListener('click', () => {
      if (!recognition) {
        addMessage("Voice input is not supported in this browser. Please type your question.", 'bot');
        return;
      }
      micBtn.classList.toggle('cg-mic-active');
      if (micBtn.classList.contains('cg-mic-active')) {
        recognition.start();
      } else {
        recognition.stop();
      }
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  });

})();
