// Shared sidebar + utilities loaded on every authenticated page.

let _confirmResolve = null;

const NAV_LINKS = [
  { href: "dashboard.html",  label: "Dashboard",  icon: "dashboard" },
  { href: "meals.html",      label: "Meals",       icon: "restaurant" },
  { href: "workouts.html",   label: "Workouts",    icon: "fitness_center" },
  { href: "weight.html",     label: "Weight",      icon: "monitor_weight" },
  { href: "profile.html",    label: "Profile",     icon: "person" },
];

function renderNav(activePage) {
  requireAuth();

  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML =
    '<div class="sidebar-brand">' +
      '<span class="sidebar-brand-name">VITALITY</span>' +
      '<span class="sidebar-brand-sub">Elite Performance</span>' +
    '</div>' +
    '<nav class="sidebar-nav">' +
    NAV_LINKS.map(function (l) {
      return (
        '<a href="' + l.href + '" class="sidebar-link' +
        (l.href === activePage ? " active" : "") + '">' +
        '<span class="material-symbols-outlined">' + l.icon + '</span>' +
        l.label + "</a>"
      );
    }).join("") +
    "</nav>" +
    '<div class="sidebar-footer">' +
      '<span id="sidebar-email" class="sidebar-email"></span>' +
      '<button type="button" id="sidebar-logout" class="btn btn-ghost btn-sm">Log out</button>' +
    "</div>";

  document.getElementById("sidebar-logout").addEventListener("click", logout);

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

  fetchMe()
    .then(function (user) {
      var el = document.getElementById("sidebar-email");
      if (el) el.textContent = user.email;
    })
    .catch(function () { logout(); });

  // Mouse-tracking glow on glass cards
  document.addEventListener("mousemove", function (e) {
    document.querySelectorAll(".stat-card, .panel, .quick-link-card, .card").forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty("--glow-x", x + "px");
      card.style.setProperty("--glow-y", y + "px");
    });
  });
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
