let _weightChart = null;
let _modalResolve = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("weight.html");

  document.getElementById("weight-form").addEventListener("submit", onWeightSubmit);
  document.getElementById("weight-list").addEventListener("click", handleListAction);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveModal);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  setDefaultDate();
  await Promise.all([loadHistory(), loadList()]);
});

function setDefaultDate() {
  const input = document.getElementById("weight-date");
  if (input && !input.value) input.value = todayIso();
}

async function onWeightSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById("alert");
  try {
    await apiRequest("/weight", {
      method: "POST",
      body: JSON.stringify({
        weight_kg: parseFloat(document.getElementById("weight-value").value),
        log_date: document.getElementById("weight-date").value || undefined,
      }),
    });
    e.target.reset();
    setDefaultDate();
    showAlert(alertBox, "Weight logged!", "success");
    await Promise.all([loadHistory(), loadList()]);
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function loadHistory() {
  try {
    const entries = await apiRequest("/weight/history?days=90");
    const panel = document.getElementById("chart-panel");
    if (!entries.length) { panel.hidden = true; return; }
    panel.hidden = false;
    renderChart(entries);
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

async function loadList() {
  try {
    const entries = await apiRequest("/weight?limit=100");
    const list = document.getElementById("weight-list");
    list.innerHTML = entries.length
      ? entries.map(renderRow).join("")
      : '<p class="empty">No entries yet. Log your first weight above.</p>';
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

function renderRow(entry) {
  return (
    '<article class="list-item" data-id="' + entry.id + '">' +
    '<div class="list-item-main">' +
    "<strong>" + entry.weight_kg + " kg</strong>" +
    "<span>" + entry.log_date + "</span>" +
    "</div>" +
    '<div class="list-actions">' +
    '<button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>' +
    "</div></article>"
  );
}

async function handleListAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.closest(".list-item").dataset.id);
  const alertBox = document.getElementById("alert");
  try {
    if (btn.dataset.action === "delete") {
      if (!await openConfirm("Delete this entry? This can't be undone.")) return;
      await apiRequest("/weight/" + id, { method: "DELETE" });
      showAlert(alertBox, "Entry deleted.", "success");
    } else {
      await editEntry(id, alertBox);
    }
    await Promise.all([loadHistory(), loadList()]);
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function editEntry(id, alertBox) {
  const entry = await apiRequest("/weight/" + id);
  document.getElementById("edit-weight-value").value = entry.weight_kg;
  document.getElementById("edit-weight-date").value = entry.log_date;

  const confirmed = await openModal();
  if (!confirmed) return;

  await apiRequest("/weight/" + id, {
    method: "PUT",
    body: JSON.stringify({
      weight_kg: parseFloat(document.getElementById("edit-weight-value").value),
      log_date: document.getElementById("edit-weight-date").value,
    }),
  });
  showAlert(alertBox, "Entry updated.", "success");
}

function renderChart(entries) {
  const ctx = document.getElementById("weight-chart");
  const labels = entries.map((e) => e.log_date);
  const data = entries.map((e) => e.weight_kg);

  if (_weightChart) _weightChart.destroy();

  _weightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Weight (kg)",
        data,
        borderColor: "#C7F284",
        backgroundColor: "rgba(199, 242, 132, 0.08)",
        borderWidth: 2,
        pointBackgroundColor: "#C7F284",
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "rgba(255,255,255,0.6)" } } },
      scales: {
        x: { ticks: { color: "rgba(255,255,255,0.4)", maxTicksLimit: 10 }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { ticks: { color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.06)" } },
      },
    },
  });
}

function openModal() {
  document.getElementById("edit-modal").hidden = false;
  document.getElementById("modal-save").focus();
  return new Promise((resolve) => { _modalResolve = resolve; });
}

function closeModal() {
  document.getElementById("edit-modal").hidden = true;
  if (_modalResolve) { _modalResolve(false); _modalResolve = null; }
}

function saveModal() {
  if (!document.getElementById("edit-weight-form").reportValidity()) return;
  document.getElementById("edit-modal").hidden = true;
  if (_modalResolve) { _modalResolve(true); _modalResolve = null; }
}
