/* ============================================
   DARLA PRAVEEN — CyberGuard AI Chatbot
   Full AI Assistant + Bio Knowledge
   Powered by Google Gemini API (Free)
   ============================================ */

(function() {
  'use strict';

  // ───── Gemini API Key (Free from https://aistudio.google.com/apikey) ─────
  const GEMINI_API_KEY = 'AIzaSyBwZAXaPU16fDcvlkNaC5JfFCiE4Omd8mA';

  // ───── Praveen's Bio Context (for AI system prompt) ─────
  const BIO_CONTEXT = `
You are CyberGuard AI, a smart AI assistant embedded on Darla Praveen's personal cybersecurity portfolio website.

ABOUT THE WEBSITE OWNER:
- Name: Darla Praveen
- Degree: B.Tech 3rd Year — CS (Cyber Security), Kakinada
- Diploma: CME (Computer Engineering), completed 2025, Guntur
- Schooling: Completed 2022, Guntur
- Village: Pamulapadu, Guntur, Andhra Pradesh
- Phone: 7989846814
- Email: darlapraveen87@gmail.com
- LinkedIn: https://www.linkedin.com/in/praveen-darla-875773385
- Lab: Member of Robotics Lab, Domain: Robotics
- Lab Work: 3D Point Cloud Mapping & Navigation (LIO-SAM, OctoMap, ROS 2, Gazebo, Nav2), Robot Dog-Wheel System
- Skills: Ethical Hacking, Penetration Testing, Web & App Dev with AI, Vibe Coder, Computer Hardware, Kali Linux & Ubuntu, Security Research, Cryptography, Robotics & ROS 2, 3D Mapping & SLAM
- Projects: (1) Secured Log Analysis & Threat Hunting System, (2) CyberGuard AI Chatbot, (3) 3D Point Cloud Mapping & Navigation using OctoMap
- Certification: Certificate of Merit in C & JAVA from CDST Informatics Pvt. Ltd., Grade A, 82%, Nov 2024–Apr 2025
- Status: Available for Collaboration

YOUR BEHAVIOR RULES:
1. You are a GENERAL PURPOSE AI assistant. Answer ANY question the user asks — science, technology, coding, math, history, general knowledge, ANY topic.
2. When the user specifically asks about Praveen, his bio, his skills, projects, education, or contact — provide detailed info from the context above.
3. For all other questions (coding, science, math, general knowledge, etc.), answer them normally and accurately like a helpful AI assistant.
4. Keep responses concise but informative.
5. Be friendly and professional.
6. You can respond in any language the user uses.
7. Do NOT redirect non-bio questions to Praveen's info. Answer the actual question asked.
8. Use emojis sparingly for friendliness.
`;

  // ───── Chat History for Context ─────
  let chatHistory = [];

  // ───── Call Gemini API with auto-retry ─────
  async function callGeminiAPI(userMessage, retryCount = 0) {
    // Add to history only on first attempt
    if (retryCount === 0) {
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    // Keep last 10 messages for context
    const recentHistory = chatHistory.slice(-10);

    const body = {
      system_instruction: { parts: [{ text: BIO_CONTEXT }] },
      contents: recentHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9,
      }
    };

    // Use gemini-2.5-flash (best free tier availability)
    const model = 'gemini-2.5-flash';

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      if (res.status === 429) {
        // Rate limited — auto-retry after delay
        if (retryCount < 3) {
          const waitSec = (retryCount + 1) * 3;
          await new Promise(r => setTimeout(r, waitSec * 1000));
          return callGeminiAPI(userMessage, retryCount + 1);
        }
        return '⏳ Server is busy. Please wait a few seconds and try again.';
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t process that. Please try again.';

      // Add to history
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });

      return reply;

    } catch (err) {
      console.error('Gemini API Error:', err);
      // Auto-retry on network errors
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return callGeminiAPI(userMessage, retryCount + 1);
      }
      return `❌ Connection error. Please check your internet and try again.`;
    }
  }

  // ───── Simple Markdown to HTML ─────
  function md(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
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
      msg.innerHTML = `<div class="cg-msg-bubble">${text}</div>`;
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
