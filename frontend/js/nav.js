// Shared sidebar + utilities loaded on every authenticated page.

let _confirmResolve = null;

const NAV_LINKS = [
  { href: "dashboard.html",  label: "Dashboard",      icon: "dashboard" },
  { href: "meals.html",      label: "Log Meal",        icon: "restaurant" },
  { href: "workouts.html",   label: "Log Workout",     icon: "fitness_center" },
  { href: "weight.html",     label: "Weight Trends",   icon: "trending_up" },
];

const BOTTOM_LINKS = [
  { href: "profile.html",    label: "Settings",        icon: "settings" },
  { href: "#support",        label: "Support",         icon: "help" },
];

function _getInitials(email) {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return name.split(" ").slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase() || "?";
}

function _getDisplayName(email) {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return name.split(" ").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
}

function renderNav(activePage) {
  requireAuth();

  const streak = Number(localStorage.getItem("apex_streak") || 0);
  const streakText = streak > 0 ? streak + " Day Streak 🔥" : "No streak yet";

  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML =
    '<div class="sidebar-brand">' +
      '<span class="sidebar-brand-name">APEX</span>' +
    '</div>' +
    '<div class="sidebar-profile">' +
      '<div class="sidebar-avatar" id="sidebar-avatar">?</div>' +
      '<div class="sidebar-profile-info">' +
        '<div class="sidebar-user-name" id="sidebar-name">Loading…</div>' +
        '<div class="sidebar-user-streak" id="sidebar-streak">' + streakText + "</div>" +
      "</div>" +
    "</div>" +
    '<nav class="sidebar-nav">' +
    NAV_LINKS.map(function (l) {
      return (
        '<a href="' + l.href + '" class="sidebar-link' +
        (l.href === activePage ? " active" : "") + '">' +
        '<span class="material-symbols-outlined">' + l.icon + "</span>" +
        l.label + "</a>"
      );
    }).join("") +
    '<div style="flex:1"></div>' +
    BOTTOM_LINKS.map(function (l) {
      return (
        '<a href="' + l.href + '" class="sidebar-link' +
        (l.href === activePage ? " active" : "") + '">' +
        '<span class="material-symbols-outlined">' + l.icon + "</span>" +
        l.label + "</a>"
      );
    }).join("") +
    "</nav>" +
    '<div class="sidebar-footer">' +
      '<span id="sidebar-email" class="sidebar-email"></span>' +
      '<button type="button" id="sidebar-logout" class="btn btn-ghost btn-sm">Log out</button>' +
    "</div>" +
    '<div class="sidebar-cta">' +
      '<a href="workouts.html" class="btn-cta">' +
        '<span class="material-symbols-outlined" style="font-size:16px">add</span>' +
        "NEW WORKOUT" +
      "</a>" +
    "</div>";

  document.getElementById("sidebar-logout").addEventListener("click", logout);

  var supportLink = document.querySelector('.sidebar-link[href="#support"]');
  if (supportLink) {
    supportLink.addEventListener("click", function (e) {
      e.preventDefault();
      var panel = document.getElementById("chat-panel");
      if (panel) { panel.hidden = false; document.getElementById("chat-input").focus(); }
    });
  }

  fetchMe()
    .then(function (user) {
      var emailEl = document.getElementById("sidebar-email");
      var nameEl  = document.getElementById("sidebar-name");
      var avatarEl = document.getElementById("sidebar-avatar");
      if (emailEl) emailEl.textContent = user.email;
      if (nameEl)  nameEl.textContent  = _getDisplayName(user.email);
      if (avatarEl) avatarEl.textContent = _getInitials(user.email);
    })
    .catch(function () { logout(); });

  // Inject shared confirm modal once per page
  if (!document.getElementById("confirm-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="confirm-modal" class="modal-overlay" hidden role="dialog" aria-modal="true">' +
        '<div class="modal modal-sm">' +
          '<p id="confirm-message" class="confirm-message"></p>' +
          '<div class="modal-actions">' +
            '<button type="button" id="confirm-cancel" class="btn btn-ghost">Cancel</button>' +
            '<button type="button" id="confirm-ok" class="btn btn-danger">Delete</button>' +
          "</div></div></div>"
    );
    document.getElementById("confirm-cancel").addEventListener("click", function () { closeConfirm(false); });
    document.getElementById("confirm-ok").addEventListener("click", function () { closeConfirm(true); });
    document.getElementById("confirm-modal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) closeConfirm(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeConfirm(false);
    });
  }

}

function openConfirm(message) {
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-modal").hidden = false;
  document.getElementById("confirm-ok").focus();
  return new Promise(function (resolve) { _confirmResolve = resolve; });
}

function closeConfirm(result) {
  document.getElementById("confirm-modal").hidden = true;
  if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}

function showAlert(el, message, type) {
  el.textContent = message;
  el.className = "alert alert-" + type;
  el.hidden = false;
  setTimeout(function () { el.hidden = true; }, 4000);
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatShortDate(isoDate) {
  var d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}
