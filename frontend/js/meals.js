const MACRO_GOALS_KEY = "apex_macro_goals";
const DEFAULT_MACRO_GOALS = { protein: 150, carbs: 250, fat: 70 };

function getMacroGoals() {
  try {
    return JSON.parse(localStorage.getItem(MACRO_GOALS_KEY)) || DEFAULT_MACRO_GOALS;
  } catch {
    return DEFAULT_MACRO_GOALS;
  }
}

let _modalResolve = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("meals.html");

  document.getElementById("meal-form").addEventListener("submit", onMealSubmit);
  document.getElementById("meal-categories").addEventListener("click", handleItemAction);
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

function parseMacro(id) {
  const raw = document.getElementById(id).value;
  if (raw === "" || raw == null) return null;
  const val = Number(raw);
  return Number.isFinite(val) && val >= 0 ? val : null;
}

async function onMealSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById("alert");
  const mealType = document.getElementById("meal-type-select").value || null;
  try {
    await apiRequest("/meals", {
      method: "POST",
      body: JSON.stringify({
        name:      document.getElementById("meal-name").value.trim(),
        calories:  Number(document.getElementById("meal-calories").value),
        meal_type: mealType,
        protein_g: parseMacro("meal-protein"),
        carbs_g:   parseMacro("meal-carbs"),
        fat_g:     parseMacro("meal-fat"),
        log_date:  document.getElementById("meal-date").value || undefined,
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
    const meals   = await apiRequest("/meals?limit=200");
    const today   = todayIso();
    const todayMeals   = meals.filter((m) => m.log_date === today);
    const historyMeals = meals.filter((m) => m.log_date !== today);

    renderMacroProgress(todayMeals);
    renderCategoryGrid(todayMeals);
    renderHistory(historyMeals);
  } catch (err) {
    showAlert(document.getElementById("alert"), err.message, "error");
  }
}

// ── Macro progress bars ───────────────────────────────────────

function renderMacroProgress(todayMeals) {
  const goals  = getMacroGoals();
  const totals = { protein: 0, carbs: 0, fat: 0 };
  todayMeals.forEach((m) => {
    totals.protein += m.protein_g || 0;
    totals.carbs   += m.carbs_g   || 0;
    totals.fat     += m.fat_g     || 0;
  });

  ["protein", "carbs", "fat"].forEach((key) => {
    const goal = goals[key];
    const pct  = goal > 0 ? Math.min((totals[key] / goal) * 100, 100) : 0;
    document.getElementById("mb-" + key).textContent           = totals[key];
    document.getElementById("mb-" + key + "-goal").textContent = goal;
    document.getElementById("mb-" + key + "-fill").style.width = pct + "%";
  });
}

// ── Today's meals grouped by category ────────────────────────

const CATEGORY_META = {
  breakfast: { label: "Breakfast", icon: "wb_sunny" },
  lunch:     { label: "Lunch",     icon: "lunch_dining" },
  dinner:    { label: "Dinner",    icon: "dinner_dining" },
  snack:     { label: "Snack",     icon: "cookie" },
};

function renderCategoryGrid(todayMeals) {
  const container = document.getElementById("meal-categories");

  if (!todayMeals.length) {
    container.innerHTML = '<p class="empty">No meals logged today. Add your first meal above.</p>';
    return;
  }

  const groups = { breakfast: [], lunch: [], dinner: [], snack: [], other: [] };
  todayMeals.forEach((m) => {
    const key = m.meal_type && groups[m.meal_type] ? m.meal_type : "other";
    groups[key].push(m);
  });

  const cards = [];
  Object.entries(CATEGORY_META).forEach(([key, meta]) => {
    if (groups[key].length) cards.push(renderCategoryCard(key, meta, groups[key]));
  });
  if (groups.other.length) {
    cards.push(renderCategoryCard("other", { label: "Other", icon: "restaurant" }, groups.other));
  }

  container.innerHTML = cards.join("");
}

function renderCategoryCard(key, meta, items) {
  const totalCal = items.reduce((s, m) => s + m.calories, 0);
  return (
    '<div class="meal-category-card">' +
    '<div class="meal-category-header">' +
    '<span class="meal-category-title">' +
    '<span class="material-symbols-outlined">' + meta.icon + "</span>" +
    meta.label +
    "</span>" +
    '<span class="meal-category-kcal">' + totalCal + " kcal</span>" +
    "</div>" +
    items.map(renderCategoryItem).join("") +
    "</div>"
  );
}

function renderCategoryItem(meal) {
  const macros = renderMacroLine(meal);
  return (
    '<div class="meal-category-item" data-id="' + meal.id + '">' +
    '<span class="meal-category-item-name">' + escapeHtml(meal.name) + "</span>" +
    '<span class="meal-category-item-kcal">' + meal.calories + " kcal" + macros + "</span>" +
    '<div class="meal-category-actions">' +
    '<button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="delete">Del</button>' +
    "</div>" +
    "</div>"
  );
}

// ── History (past dates) ──────────────────────────────────────

function renderHistory(historyMeals) {
  const list = document.getElementById("meal-list");
  if (!historyMeals.length) {
    list.innerHTML = '<p class="empty">No past meals to show.</p>';
    return;
  }
  list.innerHTML = historyMeals.map(renderMealRow).join("");
}

function renderMealRow(meal) {
  const typeTag = meal.meal_type
    ? '<span class="tag tag-' + meal.meal_type + '">' + meal.meal_type + "</span> "
    : "";
  return (
    '<article class="list-item" data-id="' + meal.id + '">' +
    '<div class="list-item-main">' +
    "<strong>" + escapeHtml(meal.name) + "</strong>" +
    "<span>" + typeTag + meal.calories + " kcal" + renderMacroLine(meal) + " · " + meal.log_date + "</span>" +
    "</div>" +
    '<div class="list-actions">' +
    '<button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>' +
    "</div></article>"
  );
}

function renderMacroLine(meal) {
  const parts = [];
  if (meal.protein_g != null) parts.push("P " + meal.protein_g + "g");
  if (meal.carbs_g   != null) parts.push("C " + meal.carbs_g   + "g");
  if (meal.fat_g     != null) parts.push("F " + meal.fat_g     + "g");
  return parts.length ? " · " + parts.join(" · ") : "";
}

// ── Action handlers ───────────────────────────────────────────

async function handleItemAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id       = Number(btn.closest("[data-id]").dataset.id);
  const alertBox = document.getElementById("alert");
  try {
    if (btn.dataset.action === "delete") {
      if (!await openConfirm("Delete this meal? This can't be undone.")) return;
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

async function handleListAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id       = Number(btn.closest(".list-item").dataset.id);
  const alertBox = document.getElementById("alert");
  try {
    if (btn.dataset.action === "delete") {
      if (!await openConfirm("Delete this meal? This can't be undone.")) return;
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

// ── Edit modal ────────────────────────────────────────────────

function setMacroInput(id, val) {
  document.getElementById(id).value = val != null ? val : "";
}

async function editMeal(id, alertBox) {
  const meal = await apiRequest("/meals/" + id);
  document.getElementById("edit-meal-name").value     = meal.name;
  document.getElementById("edit-meal-calories").value = meal.calories;
  document.getElementById("edit-meal-date").value     = meal.log_date;
  document.getElementById("edit-meal-type").value     = meal.meal_type || "";
  setMacroInput("edit-meal-protein", meal.protein_g);
  setMacroInput("edit-meal-carbs",   meal.carbs_g);
  setMacroInput("edit-meal-fat",     meal.fat_g);

  const confirmed = await openModal();
  if (!confirmed) return;

  await apiRequest("/meals/" + id, {
    method: "PUT",
    body: JSON.stringify({
      name:      document.getElementById("edit-meal-name").value.trim(),
      calories:  Number(document.getElementById("edit-meal-calories").value),
      meal_type: document.getElementById("edit-meal-type").value || null,
      protein_g: parseMacro("edit-meal-protein"),
      carbs_g:   parseMacro("edit-meal-carbs"),
      fat_g:     parseMacro("edit-meal-fat"),
      log_date:  document.getElementById("edit-meal-date").value,
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
