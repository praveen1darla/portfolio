/* ============================================
   DARLA PRAVEEN — CyberGuard AI Chatbot
   Full AI Assistant + Bio Knowledge
   Powered by Google Gemini API (Free)
   ============================================ */

(function () {
  'use strict';

  // ───── Backend API URL (deployed on Railway) ─────
  // Change this to your Railway URL after deploying bot_3
  const BACKEND_URL = 'https://web-production-9c69c.up.railway.app';

  // ───── Praveen's Bio Context (kept for reference, actual prompt is on the server) ─────

  // ───── Chat History for Context ─────
  let chatHistory = [];
  const sessionId = 'portfolio_' + Math.random().toString(36).substr(2, 9);

  // ───── Fallback Responses (works without internet) ─────
  function getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('who are you') || lowerMsg.includes('what is your name')) {
      return "I'm **NeonDP**, Darla Praveen's personal AI assistant! I'm here to help you learn more about Praveen and his work. 😊";
    }
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello! 👋 I'm NeonDP. How can I assist you today?";
    }
    if (lowerMsg.includes('darla') || lowerMsg.includes('praveen')) {
      return "Darla Praveen is a cybersecurity student and robotics enthusiast! He's passionate about ethical hacking, penetration testing, and building cool robotics projects. Check out his portfolio to learn more! 🚀";
    }
    if (lowerMsg.includes('project') || lowerMsg.includes('work')) {
      return "Praveen has worked on several cool projects including a Secured Log Analysis System, CyberGuard AI Chatbot, and a Universal File Converter! He's also working on 3D point cloud mapping for robotics navigation. 🤖";
    }
    if (lowerMsg.includes('skill') || lowerMsg.includes('abilities')) {
      return "Praveen's skills include Ethical Hacking, Penetration Testing, Web Development, Linux Administration, Robotics with ROS2, and 3D Point Cloud Mapping! 🛡️";
    }
    if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('phone')) {
      return "You can reach Praveen at darlapraveen87@gmail.com or call him at 7989846814! 📞";
    }
    return "I'm NeonDP, Praveen's AI assistant! I can tell you about Praveen's skills, projects, and background. Feel free to ask me anything! 😊";
  }

  // ───── Call Backend API with auto-retry and fallback ─────
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
        return getFallbackResponse(userMessage);
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      let response = data.response || 'Sorry, I couldn\'t process that. Please try again.';
      // Replace old names with NeonDP
      response = response.replace(/CyberGuard AI/gi, 'NeonDP');
      response = response.replace(/DP PERSONAL AI ASSISTANT/gi, 'NeonDP');
      return response;

    } catch (err) {
      console.error('Backend API Error:', err);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000));
        return callGeminiAPI(userMessage, retryCount + 1);
      }
      // Use fallback response if no internet
      return getFallbackResponse(userMessage);
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
    let plain = text.replace(/\*\*/g, '').replace(/[_*#`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/```[\s\S]*?```/g, '');
    // Remove all emojis and symbols - multiple layers for safety
    // First remove all emoji properties
    plain = plain.replace(/[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu, '');
    // Then remove common emoji ranges
    plain = plain.replace(/[\u{1F000}-\u{1F9FF}]/gu, '');
    plain = plain.replace(/[\u{2600}-\u{26FF}]/gu, '');
    plain = plain.replace(/[\u{2700}-\u{27BF}]/gu, '');
    plain = plain.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    plain = plain.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    plain = plain.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    plain = plain.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
    plain = plain.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
    plain = plain.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
    plain = plain.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
    plain = plain.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
    // Also remove any other non-alphanumeric, non-punctuation symbols
    plain = plain.replace(/[^\w\s.,!?;:'"()-]/g, '');
    // Replace old names with NeonDP in speech
    plain = plain.replace(/CyberGuard AI/gi, 'NeonDP');
    plain = plain.replace(/DP PERSONAL AI ASSISTANT/gi, 'NeonDP');
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
    recognition.onerror = () => { };
    return recognition;
  }

  // ───── Build Chat UI ─────
  function buildUI() {
    const btn = document.createElement('div');
    btn.id = 'cyberguard-btn';
    btn.innerHTML = `
      <i class="fas fa-shield-halved"></i>
      <div class="btn-text">
        <span>N</span><span>e</span><span>o</span><span>n</span><span>D</span><span>P</span>
      </div>
    `;
    btn.title = 'NeonDP - AI Assistant';
    document.body.appendChild(btn);

    const chat = document.createElement('div');
    chat.id = 'cyberguard-chat';
    chat.innerHTML = `
      <div class="cg-header">
        <div class="cg-header-info">
          <div class="cg-avatar"><i class="fas fa-shield-halved"></i></div>
          <div>
            <div class="cg-title">
              <span>N</span><span>e</span><span>o</span><span>n</span><span>D</span><span>P</span>
            </div>
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
          const welcome = "Welcome sir! 👋 I'm **NeonDP**, your intelligent assistant. I can answer **any question** — tech, science, coding, general knowledge, or anything about **Darla Praveen**. How can I help you?";
          addMessage(welcome, 'bot');
          speak("Welcome sir! I'm NeonDP. What can I do for you?");
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
