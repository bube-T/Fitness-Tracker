let weeklyChart = null;

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("meal-form").addEventListener("submit", onMealSubmit);
  document.getElementById("workout-form").addEventListener("submit", onWorkoutSubmit);
  document.getElementById("meal-list").addEventListener("click", handleListAction);
  document.getElementById("workout-list").addEventListener("click", handleListAction);

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
      if (!confirm("Delete this meal?")) return;
      await apiRequest("/meals/" + id, { method: "DELETE" });
      showAlert(alertBox, "Meal deleted.", "success");
    } else if (action === "delete-workout") {
      if (!confirm("Delete this workout?")) return;
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
  const name = prompt("Meal name:", meal.name);
  if (name === null) return;
  const caloriesStr = prompt("Calories:", String(meal.calories));
  if (caloriesStr === null) return;
  const logDate = prompt("Date (YYYY-MM-DD):", meal.log_date);
  if (logDate === null) return;

  await apiRequest("/meals/" + id, {
    method: "PUT",
    body: JSON.stringify({
      name: name.trim(),
      calories: Number(caloriesStr),
      log_date: logDate,
    }),
  });
  showAlert(alertBox, "Meal updated.", "success");
}

async function editWorkout(id, alertBox) {
  const workout = await apiRequest("/workouts/" + id);
  const type = prompt("Workout type:", workout.workout_type);
  if (type === null) return;
  const durationStr = prompt("Duration (minutes):", String(workout.duration_minutes));
  if (durationStr === null) return;
  const logDate = prompt("Date (YYYY-MM-DD):", workout.log_date);
  if (logDate === null) return;

  await apiRequest("/workouts/" + id, {
    method: "PUT",
    body: JSON.stringify({
      workout_type: type.trim(),
      duration_minutes: Number(durationStr),
      log_date: logDate,
    }),
  });
  showAlert(alertBox, "Workout updated.", "success");
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
