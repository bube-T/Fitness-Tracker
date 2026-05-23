let _modalResolve = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("workouts.html");

  document.getElementById("workout-form").addEventListener("submit", onWorkoutSubmit);
  document.getElementById("workout-list").addEventListener("click", handleListAction);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveModal);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  setDefaultDate();
  await loadWorkouts();
});

function setDefaultDate() {
  const input = document.getElementById("workout-date");
  if (input && !input.value) input.value = todayIso();
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
    setDefaultDate();
    showAlert(alertBox, "Workout logged!", "success");
    await loadWorkouts();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function loadWorkouts() {
  try {
    const workouts = await apiRequest("/workouts?limit=100");
    const list = document.getElementById("workout-list");
    list.innerHTML = workouts.length
      ? workouts.map(renderWorkoutRow).join("")
      : '<p class="empty">No workouts logged yet. Add your first workout above.</p>';
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

function renderWorkoutRow(workout) {
  return (
    '<article class="list-item" data-id="' + workout.id + '">' +
    '<div class="list-item-main">' +
    "<strong>" + escapeHtml(workout.workout_type) + "</strong>" +
    "<span>" + workout.duration_minutes + " min · " + workout.log_date + "</span>" +
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
      if (!await openConfirm("Delete this workout? This can't be undone.")) return;
      await apiRequest("/workouts/" + id, { method: "DELETE" });
      showAlert(alertBox, "Workout deleted.", "success");
    } else {
      await editWorkout(id, alertBox);
    }
    await loadWorkouts();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function editWorkout(id, alertBox) {
  const workout = await apiRequest("/workouts/" + id);
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
  return new Promise((resolve) => { _modalResolve = resolve; });
}

function closeModal() {
  document.getElementById("edit-modal").hidden = true;
  if (_modalResolve) { _modalResolve(false); _modalResolve = null; }
}

function saveModal() {
  if (!document.getElementById("edit-workout-form").reportValidity()) return;
  document.getElementById("edit-modal").hidden = true;
  if (_modalResolve) { _modalResolve(true); _modalResolve = null; }
}
