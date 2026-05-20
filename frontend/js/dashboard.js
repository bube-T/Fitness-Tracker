let weeklyChart = null;
let modalResolve = null;
let confirmResolve = null;

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
  requireAuth();

  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("meal-form").addEventListener("submit", onMealSubmit);
  document.getElementById("workout-form").addEventListener("submit", onWorkoutSubmit);
  document.getElementById("meal-list").addEventListener("click", handleListAction);
  document.getElementById("workout-list").addEventListener("click", handleListAction);

  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveModal);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById("set-goal-btn").addEventListener("click", openGoalModal);
  document.getElementById("goal-cancel").addEventListener("click", closeGoalModal);
  document.getElementById("goal-save").addEventListener("click", onGoalSave);
  document.getElementById("goal-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeGoalModal();
  });

  document.getElementById("confirm-cancel").addEventListener("click", () => closeConfirm(false));
  document.getElementById("confirm-ok").addEventListener("click", () => closeConfirm(true));
  document.getElementById("confirm-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeConfirm(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeConfirm(false); closeGoalModal(); }
  });

  setDefaultDates();
  await refreshAll();
});

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  const mealDate = document.getElementById("meal-date");
  const workoutDate = document.getElementById("workout-date");
  if (mealDate && !mealDate.value) mealDate.value = today;
  if (workoutDate && !workoutDate.value) workoutDate.value = today;
}

async function refreshAll() {
  await Promise.all([loadUser(), loadMeals(), loadWorkouts(), loadStats()]);
}

async function loadUser() {
  try {
    const user = await fetchMe();
    document.getElementById("user-email").textContent = user.email;
  } catch {
    logout();
  }
}

async function onMealSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById("alert");
  try {
    await apiRequest("/meals", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("meal-name").value.trim(),
        calories: Number(document.getElementById("meal-calories").value),
        log_date: document.getElementById("meal-date").value || undefined,
      }),
    });
    e.target.reset();
    setDefaultDates();
    showAlert(alertBox, "Meal logged!", "success");
    await refreshAll();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function onWorkoutSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById("alert");
  try {
    await apiRequest("/workouts", {
      method: "POST",
      body: JSON.stringify({
        workout_type: document.getElementById("workout-type").value.trim(),
        duration_minutes: Number(document.getElementById("workout-duration").value),
        log_date: document.getElementById("workout-date").value || undefined,
      }),
    });
    e.target.reset();
    setDefaultDates();
    showAlert(alertBox, "Workout logged!", "success");
    await refreshAll();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function loadMeals() {
  const meals = await apiRequest("/meals");
  const list = document.getElementById("meal-list");
  list.innerHTML = meals.length
    ? meals.map((m) => renderMealRow(m)).join("")
    : '<p class="empty">No meals yet. Log your first meal above.</p>';
}

async function loadWorkouts() {
  const workouts = await apiRequest("/workouts");
  const list = document.getElementById("workout-list");
  list.innerHTML = workouts.length
    ? workouts.map((w) => renderWorkoutRow(w)).join("")
    : '<p class="empty">No workouts yet. Log your first workout above.</p>';
}

async function loadStats() {
  const stats = await apiRequest("/stats/weekly");
  document.getElementById("today-calories").textContent = stats.today_calories;
  document.getElementById("today-minutes").textContent = stats.today_workout_minutes;
  updateProgressBar(stats.today_calories);
  renderChart(stats.days);
}

function renderMealRow(meal) {
  return (
    '<article class="list-item" data-type="meal" data-id="' +
    meal.id +
    '">' +
    '<div class="list-item-main">' +
    "<strong>" +
    escapeHtml(meal.name) +
    "</strong>" +
    "<span>" +
    meal.calories +
    " kcal · " +
    meal.log_date +
    "</span>" +
    "</div>" +
    '<div class="list-actions">' +
    '<button type="button" class="btn btn-ghost btn-sm" data-action="edit-meal">Edit</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="delete-meal">Delete</button>' +
    "</div>" +
    "</article>"
  );
}

function renderWorkoutRow(workout) {
  return (
    '<article class="list-item" data-type="workout" data-id="' +
    workout.id +
    '">' +
    '<div class="list-item-main">' +
    "<strong>" +
    escapeHtml(workout.workout_type) +
    "</strong>" +
    "<span>" +
    workout.duration_minutes +
    " min · " +
    workout.log_date +
    "</span>" +
    "</div>" +
    '<div class="list-actions">' +
    '<button type="button" class="btn btn-ghost btn-sm" data-action="edit-workout">Edit</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="delete-workout">Delete</button>' +
    "</div>" +
    "</article>"
  );
}

async function handleListAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const item = btn.closest(".list-item");
  const id = Number(item.dataset.id);
  const action = btn.dataset.action;
  const alertBox = document.getElementById("alert");

  try {
    if (action === "delete-meal") {
      if (!await openConfirm("Delete this meal? This can't be undone.")) return;
      await apiRequest("/meals/" + id, { method: "DELETE" });
      showAlert(alertBox, "Meal deleted.", "success");
    } else if (action === "delete-workout") {
      if (!await openConfirm("Delete this workout? This can't be undone.")) return;
      await apiRequest("/workouts/" + id, { method: "DELETE" });
      showAlert(alertBox, "Workout deleted.", "success");
    } else if (action === "edit-meal") {
      await editMeal(id, alertBox);
    } else if (action === "edit-workout") {
      await editWorkout(id, alertBox);
    }
    await refreshAll();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function editMeal(id, alertBox) {
  const meal = await apiRequest("/meals/" + id);

  document.getElementById("modal-title").textContent = "Edit meal";
  document.getElementById("edit-meal-form").hidden = false;
  document.getElementById("edit-workout-form").hidden = true;
  document.getElementById("edit-meal-name").value = meal.name;
  document.getElementById("edit-meal-calories").value = meal.calories;
  document.getElementById("edit-meal-date").value = meal.log_date;

  const confirmed = await openModal();
  if (!confirmed) return;

  await apiRequest("/meals/" + id, {
    method: "PUT",
    body: JSON.stringify({
      name: document.getElementById("edit-meal-name").value.trim(),
      calories: Number(document.getElementById("edit-meal-calories").value),
      log_date: document.getElementById("edit-meal-date").value,
    }),
  });
  showAlert(alertBox, "Meal updated.", "success");
}

async function editWorkout(id, alertBox) {
  const workout = await apiRequest("/workouts/" + id);

  document.getElementById("modal-title").textContent = "Edit workout";
  document.getElementById("edit-workout-form").hidden = false;
  document.getElementById("edit-meal-form").hidden = true;
  document.getElementById("edit-workout-type").value = workout.workout_type;
  document.getElementById("edit-workout-duration").value = workout.duration_minutes;
  document.getElementById("edit-workout-date").value = workout.log_date;

  const confirmed = await openModal();
  if (!confirmed) return;

  await apiRequest("/workouts/" + id, {
    method: "PUT",
    body: JSON.stringify({
      workout_type: document.getElementById("edit-workout-type").value.trim(),
      duration_minutes: Number(document.getElementById("edit-workout-duration").value),
      log_date: document.getElementById("edit-workout-date").value,
    }),
  });
  showAlert(alertBox, "Workout updated.", "success");
}

function openModal() {
  document.getElementById("edit-modal").hidden = false;
  document.getElementById("modal-save").focus();
  return new Promise((resolve) => { modalResolve = resolve; });
}

function closeModal() {
  document.getElementById("edit-modal").hidden = true;
  if (modalResolve) { modalResolve(false); modalResolve = null; }
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

function openConfirm(message) {
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-modal").hidden = false;
  document.getElementById("confirm-ok").focus();
  return new Promise((resolve) => { confirmResolve = resolve; });
}

function closeConfirm(result) {
  document.getElementById("confirm-modal").hidden = true;
  if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
}

function saveModal() {
  const mealForm = document.getElementById("edit-meal-form");
  const workoutForm = document.getElementById("edit-workout-form");
  const activeForm = mealForm.hidden ? workoutForm : mealForm;
  if (!activeForm.reportValidity()) return;
  document.getElementById("edit-modal").hidden = true;
  if (modalResolve) { modalResolve(true); modalResolve = null; }
}

function renderChart(days) {
  const ctx = document.getElementById("weekly-chart");
  const labels = days.map((d) => formatShortDate(d.date));
  const calories = days.map((d) => d.total_calories);
  const minutes = days.map((d) => d.total_workout_minutes);

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Calories",
          data: calories,
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 6,
        },
        {
          label: "Workout (min)",
          data: minutes,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#e2e8f0" } },
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.15)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.15)" },
        },
      },
    },
  });
}

function formatShortDate(isoDate) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(el, message, type) {
  el.textContent = message;
  el.className = "alert alert-" + type;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 4000);
}
