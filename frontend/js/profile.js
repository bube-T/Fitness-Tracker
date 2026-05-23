const GOAL_KEY = "calorie_goal";
const DEFAULT_GOAL = 2000;

document.addEventListener("DOMContentLoaded", async () => {
  renderNav("profile.html");

  document.getElementById("save-goal-btn").addEventListener("click", onSaveGoal);
  document.getElementById("goal-input").value =
    Number(localStorage.getItem(GOAL_KEY)) || DEFAULT_GOAL;

  try {
    const user = await fetchMe();
    document.getElementById("profile-email").textContent = user.email;
    if (user.created_at) {
      document.getElementById("profile-since").textContent = new Date(
        user.created_at
      ).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }
  } catch {
    logout();
  }
});

function onSaveGoal() {
  const val = Number(document.getElementById("goal-input").value);
  if (!val || val < 500) {
    document.getElementById("goal-input").focus();
    return;
  }
  localStorage.setItem(GOAL_KEY, String(val));
  showAlert(document.getElementById("alert"), "Calorie goal saved!", "success");
}
