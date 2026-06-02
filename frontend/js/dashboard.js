let weeklyChart = null;
let macroDonut  = null;

const GOAL_KEY    = "calorie_goal";
const DEFAULT_GOAL = 2000;

function getGoal() {
  return Number(localStorage.getItem(GOAL_KEY)) || DEFAULT_GOAL;
}

function saveGoal(n) {
  localStorage.setItem(GOAL_KEY, String(n));
}

function updateProgressBar(calories) {
  const goal = getGoal();
  const pct  = Math.min((calories / goal) * 100, 100);
  const bar  = document.getElementById("calorie-progress-bar");
  bar.style.width = pct + "%";
  bar.classList.remove("warn", "over");
  if (calories > goal)  bar.classList.add("over");
  else if (pct >= 85)   bar.classList.add("warn");
  document.getElementById("calorie-goal-display").textContent = goal;
}

function renderGreeting(email, streak) {
  const raw       = email.split("@")[0].replace(/[._-]/g, " ");
  const firstName = raw.split(" ")[0];
  const name      = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const now     = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  let status;
  if (streak >= 14)     status = "You're on fire. Keep pushing.";
  else if (streak >= 7) status = "Optimal performance state detected.";
  else if (streak >= 1) status = "Keep the momentum going.";
  else                  status = "Start strong today.";

  document.getElementById("greeting-title").textContent = "Push your limits, " + name + ".";
  document.getElementById("greeting-sub").textContent   = dayName + ", " + dateStr + " — " + status;

  localStorage.setItem("apex_streak", String(streak));

  // Update sidebar streak badge if it's visible
  var streakEl = document.getElementById("sidebar-streak");
  if (streakEl) streakEl.textContent = streak > 0 ? streak + " Day Streak 🔥" : "No streak yet";
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

  await Promise.all([loadStats(), loadRecentActivity()]);
});

async function loadStats() {
  try {
    const stats = await apiRequest("/stats/weekly");
    const me    = await apiRequest("/auth/me");

    renderGreeting(me.email, stats.current_streak);

    document.getElementById("today-calories").textContent = stats.today_calories;
    document.getElementById("today-minutes").textContent  = stats.today_workout_minutes;
    document.getElementById("latest-weight").textContent  =
      stats.latest_weight_kg != null ? stats.latest_weight_kg : "—";

    updateProgressBar(stats.today_calories);
    renderWeeklyChart(stats.days);
    renderDonut(stats.today_protein_g, stats.today_carbs_g, stats.today_fat_g);
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

async function loadRecentActivity() {
  try {
    const [meals, workouts, weights] = await Promise.all([
      apiRequest("/meals?limit=5"),
      apiRequest("/workouts?limit=5"),
      apiRequest("/weight?limit=3"),
    ]);

    const activities = [
      ...meals.map((m) => ({
        type: "meal",
        icon: "restaurant",
        title: m.name,
        meta: "Meal · " + m.calories + " kcal",
        date: m.log_date,
      })),
      ...workouts.map((w) => ({
        type: "workout",
        icon: "fitness_center",
        title: w.workout_type,
        meta: "Workout · " + w.duration_minutes + " min",
        date: w.log_date,
      })),
      ...weights.map((w) => ({
        type: "weight",
        icon: "monitor_weight",
        title: "Weight Logged",
        meta: w.weight_kg + " kg",
        date: w.log_date,
      })),
    ];

    activities.sort((a, b) => b.date.localeCompare(a.date));
    const top = activities.slice(0, 6);

    const el = document.getElementById("activity-list");
    el.innerHTML = top.length
      ? top.map((a) =>
          '<div class="activity-item">' +
          '<div class="activity-icon ' + a.type + '">' +
          '<span class="material-symbols-outlined">' + a.icon + "</span>" +
          "</div>" +
          '<div class="activity-info">' +
          '<div class="activity-title">' + escapeHtml(a.title) + "</div>" +
          '<div class="activity-meta">' + a.meta + " · " + a.date + "</div>" +
          "</div>" +
          "</div>"
        ).join("")
      : '<p class="empty">No recent activity. Start logging meals or workouts!</p>';
  } catch {
    // non-critical
  }
}

function renderWeeklyChart(days) {
  const ctx      = document.getElementById("weekly-chart");
  const labels   = days.map((d) => formatShortDate(d.date));
  const calories = days.map((d) => d.total_calories);
  const minutes  = days.map((d) => d.total_workout_minutes);

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Calories",
          data: calories,
          backgroundColor: "rgba(59, 130, 246, 0.65)",
          borderRadius: 6,
        },
        {
          label: "Workout (min)",
          data: minutes,
          backgroundColor: "rgba(167, 139, 250, 0.65)",
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

function renderDonut(protein, carbs, fat) {
  const total = protein + carbs + fat;
  const panel = document.getElementById("macro-donut-panel");
  if (total === 0) { panel.hidden = true; return; }
  panel.hidden = false;

  const ctx = document.getElementById("macro-donut");
  if (macroDonut) macroDonut.destroy();

  macroDonut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Protein", "Carbs", "Fat"],
      datasets: [{
        data: [protein, carbs, fat],
        backgroundColor: ["#3B82F6", "#F59E0B", "#EF4444"],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              " " + ctx.label + ": " + ctx.raw + "g (" +
              Math.round((ctx.raw / total) * 100) + "%)",
          },
        },
      },
    },
  });

  const colors = ["#3B82F6", "#F59E0B", "#EF4444"];
  const labels = ["Protein", "Carbs", "Fat"];
  const values = [protein, carbs, fat];
  document.getElementById("donut-legend").innerHTML = labels
    .map((l, i) =>
      '<div class="donut-legend-item">' +
      '<span class="donut-legend-dot" style="background:' + colors[i] + '"></span>' +
      "<span>" + l + "</span>" +
      '<span class="donut-legend-pct">' + Math.round((values[i] / total) * 100) + "%</span>" +
      "</div>"
    )
    .join("");
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
  const val   = Number(input.value);
  if (!val || val < 500) { input.focus(); return; }
  saveGoal(val);
  closeGoalModal();
  loadStats();
}
