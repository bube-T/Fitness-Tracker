let weeklyChart = null;

const GOAL_KEY = "calorie_goal";
const DEFAULT_GOAL = 2000;

function getGoal() {
  return Number(localStorage.getItem(GOAL_KEY)) || DEFAULT_GOAL;
}

function saveGoal(n) {
  localStorage.setItem(GOAL_KEY, String(n));
}

function updateProgressBar(calories) {
  const goal = getGoal();
  const pct = Math.min((calories / goal) * 100, 100);
  const bar = document.getElementById("calorie-progress-bar");
  bar.style.width = pct + "%";
  bar.classList.remove("warn", "over");
  if (calories > goal) {
    bar.classList.add("over");
  } else if (pct >= 85) {
    bar.classList.add("warn");
  }
  document.getElementById("calorie-goal-display").textContent = goal;
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("dashboard.html");

  document.getElementById("set-goal-btn").addEventListener("click", openGoalModal);
  document.getElementById("goal-cancel").addEventListener("click", closeGoalModal);
  document.getElementById("goal-save").addEventListener("click", onGoalSave);
  document.getElementById("goal-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeGoalModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeGoalModal();
  });

  await loadStats();
});

async function loadStats() {
  try {
    const stats = await apiRequest("/stats/weekly");
    document.getElementById("today-calories").textContent = stats.today_calories;
    document.getElementById("today-minutes").textContent = stats.today_workout_minutes;
    document.getElementById("current-streak").textContent = stats.current_streak;
    const weightCard = document.getElementById("weight-stat-card");
    if (stats.latest_weight_kg != null) {
      document.getElementById("latest-weight").textContent = stats.latest_weight_kg;
      weightCard.hidden = false;
    } else {
      weightCard.hidden = true;
    }
    updateProgressBar(stats.today_calories);
    renderChart(stats.days);

    const hasMacros = stats.today_protein_g > 0 || stats.today_carbs_g > 0 || stats.today_fat_g > 0;
    const macrosPanel = document.getElementById("macros-panel");
    macrosPanel.hidden = !hasMacros;
    if (hasMacros) {
      document.getElementById("today-protein").textContent = stats.today_protein_g;
      document.getElementById("today-carbs").textContent = stats.today_carbs_g;
      document.getElementById("today-fat").textContent = stats.today_fat_g;
    }
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

function openGoalModal() {
  document.getElementById("goal-input").value = getGoal();
  document.getElementById("goal-modal").hidden = false;
  document.getElementById("goal-input").focus();
}

function closeGoalModal() {
  document.getElementById("goal-modal").hidden = true;
}

function onGoalSave() {
  const input = document.getElementById("goal-input");
  const val = Number(input.value);
  if (!val || val < 500) { input.focus(); return; }
  saveGoal(val);
  closeGoalModal();
  loadStats();
}

function renderChart(days) {
  const ctx = document.getElementById("weekly-chart");
  const labels = days.map((d) => formatShortDate(d.date));
  const calories = days.map((d) => d.total_calories);
  const minutes = days.map((d) => d.total_workout_minutes);

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Calories",
          data: calories,
          backgroundColor: "rgba(199, 242, 132, 0.7)",
          borderRadius: 6,
        },
        {
          label: "Workout (min)",
          data: minutes,
          backgroundColor: "rgba(96, 165, 250, 0.65)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "rgba(255,255,255,0.6)" } } },
      scales: {
        x: { ticks: { color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { beginAtZero: true, ticks: { color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.06)" } },
      },
    },
  });
}
