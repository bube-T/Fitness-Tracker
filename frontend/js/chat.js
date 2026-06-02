// APEX AI Assistant — floating chat widget loaded on every app page

(function () {
  const HISTORY_KEY = "apex_chat_history";
  const MAX_HISTORY = 20;

  let history = [];
  let busy    = false;

  function loadHistory() {
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; }
    catch { history = []; }
  }

  function saveHistory() {
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function inject() {
    document.body.insertAdjacentHTML("beforeend", [
      '<button class="chat-bubble" id="chat-bubble" aria-label="Open AI assistant" title="APEX Assistant">',
        '<span class="material-symbols-outlined">smart_toy</span>',
      '</button>',
      '<div class="chat-panel" id="chat-panel" hidden role="dialog" aria-label="APEX Assistant">',
        '<div class="chat-header">',
          '<div class="chat-header-info">',
            '<span class="chat-header-dot"></span>',
            '<div>',
              '<div class="chat-header-title">APEX Assistant</div>',
              '<div class="chat-header-sub">Powered by Claude</div>',
            '</div>',
          '</div>',
          '<button class="chat-close" id="chat-close" aria-label="Close">',
            '<span class="material-symbols-outlined">close</span>',
          '</button>',
        '</div>',
        '<div class="chat-messages" id="chat-messages"></div>',
        '<div class="chat-input-row">',
          '<textarea class="chat-input" id="chat-input" placeholder="Ask anything about your health…" rows="1"></textarea>',
          '<button class="chat-send" id="chat-send" aria-label="Send">',
            '<span class="material-symbols-outlined">send</span>',
          '</button>',
        '</div>',
      '</div>',
    ].join(""));

    document.getElementById("chat-bubble").addEventListener("click", openChat);
    document.getElementById("chat-close").addEventListener("click", closeChat);
    document.getElementById("chat-send").addEventListener("click", sendMessage);
    document.getElementById("chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById("chat-input").addEventListener("input", autoResize);

    loadHistory();
    if (history.length) renderHistory();
  }

  function openChat() {
    document.getElementById("chat-panel").hidden = false;
    document.getElementById("chat-input").focus();
    scrollBottom();
    if (!history.length) addGreeting();
  }

  function closeChat() {
    document.getElementById("chat-panel").hidden = true;
  }

  function addGreeting() {
    appendMsg("assistant", "Hi! I'm your APEX Assistant. I can see your today's nutrition and workout data. What can I help you with?");
  }

  function autoResize() {
    var ta = document.getElementById("chat-input");
    ta.style.height = "38px";
    ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
  }

  function renderHistory() {
    var container = document.getElementById("chat-messages");
    container.innerHTML = "";
    history.forEach(function (m) { appendMsg(m.role, m.content, false); });
    scrollBottom();
  }

  function appendMsg(role, content, scroll) {
    var container = document.getElementById("chat-messages");
    var div = document.createElement("div");
    div.className = "chat-msg " + role;
    div.textContent = content;
    container.appendChild(div);
    if (scroll !== false) scrollBottom();
    return div;
  }

  function showTyping() {
    var container = document.getElementById("chat-messages");
    var div = document.createElement("div");
    div.className = "chat-typing";
    div.id = "chat-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    container.appendChild(div);
    scrollBottom();
  }

  function removeTyping() {
    var el = document.getElementById("chat-typing");
    if (el) el.remove();
  }

  function scrollBottom() {
    var c = document.getElementById("chat-messages");
    if (c) c.scrollTop = c.scrollHeight;
  }

  async function sendMessage() {
    if (busy) return;
    var input = document.getElementById("chat-input");
    var text  = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "38px";

    appendMsg("user", text);
    history.push({ role: "user", content: text });

    busy = true;
    document.getElementById("chat-send").disabled = true;
    showTyping();

    try {
      var res = await apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1).slice(-10),
        }),
      });
      removeTyping();
      appendMsg("assistant", res.reply);
      history.push({ role: "assistant", content: res.reply });
      saveHistory();
    } catch (err) {
      removeTyping();
      appendMsg("assistant", "Sorry, I'm having trouble connecting right now. Please try again.");
    }

    busy = false;
    document.getElementById("chat-send").disabled = false;
    document.getElementById("chat-input").focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
