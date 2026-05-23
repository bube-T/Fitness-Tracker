let _modalResolve = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("meals.html");

  document.getElementById("meal-form").addEventListener("submit", onMealSubmit);
  document.getElementById("meal-list").addEventListener("click", handleListAction);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveModal);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  setDefaultDate();
  await loadMeals();
});

function setDefaultDate() {
  const input = document.getElementById("meal-date");
  if (input && !input.value) input.value = todayIso();
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
    setDefaultDate();
    showAlert(alertBox, "Meal logged!", "success");
    await loadMeals();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function loadMeals() {
  try {
    const meals = await apiRequest("/meals?limit=100");
    const list = document.getElementById("meal-list");
    list.innerHTML = meals.length
      ? meals.map(renderMealRow).join("")
      : '<p class="empty">No meals logged yet. Add your first meal above.</p>';
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

function renderMealRow(meal) {
  return (
    '<article class="list-item" data-id="' + meal.id + '">' +
    '<div class="list-item-main">' +
    "<strong>" + escapeHtml(meal.name) + "</strong>" +
    "<span>" + meal.calories + " kcal · " + meal.log_date + "</span>" +
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
      if (!await openConfirm("Delete this meal? This can’t be undone.")) return;
      await apiRequest("/meals/" + id, { method: "DELETE" });
      showAlert(alertBox, "Meal deleted.", "success");
    } else {
      await editMeal(id, alertBox);
    }
    await loadMeals();
  } catch (err) {
    showAlert(alertBox, err.message, "error");
  }
}

async function editMeal(id, alertBox) {
  const meal = await apiRequest("/meals/" + id);
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
  if (!document.getElementById("edit-meal-form").reportValidity()) return;
  document.getElementById("edit-modal").hidden = true;
  if (_modalResolve) { _modalResolve(true); _modalResolve = null; }
}
