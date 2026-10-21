
const IMPACT_MS = 460;
const TEAM_STAGGER_MS = 90;
const SVG_NS = "http://www.w3.org/2000/svg";
const UNITY_CUP_API = "https://script.google.com/macros/s/AKfycbwJTBui5jUqL8g31zzE4bclNhMPyynAsPGup8yDexhcOmdK3cMWaAIb9CzDCW_l5XaENw/exec";

let unityCupEditor = null;
let unityCupToken = null;
let unityCupData = { teams: { A: [], B: [] }, matches: [], standings: { A: [], B: [] } };
let unityCupDataLoading = false;

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function showTab(name) {
  ["standings", "matches", "teams"].forEach(id => {
    document.getElementById(id)?.classList.toggle("hidden", id !== name);
  });
  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  if (name === "matches") playFusion();
  if (name === "standings") playLanding();
  if (name === "teams") playAssemble();
}

function playFusion() {
  const overlay = document.getElementById("fusionOverlay");
  if (!overlay || prefersReducedMotion()) return;
  overlay.classList.remove("play");
  void overlay.offsetWidth;
  generateLightning(overlay);
  overlay.classList.add("play");
}

function generateLightning(overlay) {
  const svg = overlay.querySelector(".lightning-svg");
  if (!svg || prefersReducedMotion()) return;
  svg.innerHTML = "";
  const rect = overlay.getBoundingClientRect();
  const width = rect.width || 400;
  const height = rect.height || 160;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const cx = width / 2, cy = height / 2;
  const reach = Math.min(width, height) * .55 + Math.max(width, height) * .15;
  const count = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const points = buildJaggedPath(cx, cy, angle, reach * (.55 + Math.random() * .55));
    drawBolt(svg, points, false);
    if (Math.random() < .75) {
      const branch = buildBranch(points);
      if (branch) drawBolt(svg, branch, true);
    }
  }
}

function buildJaggedPath(x, y, angle, length) {
  const segments = 5 + Math.floor(Math.random() * 4);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const sx = -dy, sy = dx;
  const points = [{ x, y }];
  let drift = 0;
  for (let i = 1; i <= segments; i++) {
    drift += (Math.random() - .5) * length * .22;
    const distance = length / segments * i;
    points.push({ x: x + dx * distance + sx * drift, y: y + dy * distance + sy * drift });
  }
  return points;
}

function buildBranch(points) {
  if (points.length < 4) return null;
  const i = 1 + Math.floor(Math.random() * (points.length - 3));
  const a = points[i], b = points[i + 1];
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const turn = (.5 + Math.random() * .9) * (Math.random() < .5 ? -1 : 1);
  const length = Math.hypot(b.x - a.x, b.y - a.y) * (2.5 + Math.random() * 2.5);
  return buildJaggedPath(a.x, a.y, angle + turn, length);
}

function pointsToPath(points) {
  return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function drawBolt(svg, points, isBranch) {
  const d = pointsToPath(points);
  const paths = ["bolt-glow", "bolt-core"].map(cls => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", cls);
    svg.appendChild(path);
    return path;
  });
  const delay = IMPACT_MS + Math.random() * 25 + (isBranch ? 40 + Math.random() * 70 : 0);
  const peak = isBranch ? .75 : 1;
  paths.forEach(path => {
    const length = path.getTotalLength();
    path.animate([
      { strokeDashoffset: length, opacity: 0, offset: 0 },
      { strokeDashoffset: length * .55, opacity: peak, offset: .18 },
      { strokeDashoffset: 0, opacity: peak, offset: .42 },
      { strokeDashoffset: 0, opacity: peak * .15, offset: .55 },
      { strokeDashoffset: 0, opacity: peak * .9, offset: .63 },
      { strokeDashoffset: 0, opacity: peak * .1, offset: .74 },
      { strokeDashoffset: 0, opacity: peak * .6, offset: .8 },
      { strokeDashoffset: 0, opacity: 0, offset: 1 }
    ], { duration: 510 + Math.random() * 70, delay, easing: "linear", fill: "forwards" });
  });
}

function playLanding() {
  const cards = document.querySelectorAll("#standings .group-card");
  cards.forEach(card => card.classList.remove("drop"));
  void document.getElementById("standings")?.offsetWidth;
  cards.forEach(card => card.classList.add("drop"));
}

function playAssemble() {
  const cards = document.querySelectorAll("#teams .team-card");
  cards.forEach(card => card.classList.remove("materialize"));
  void document.getElementById("teams")?.offsetWidth;
  cards.forEach((card, i) => {
    card.style.setProperty("--stagger", `${i * TEAM_STAGGER_MS}ms`);
    card.classList.add("materialize");
  });
}

function cupEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function cupAttr(value) {
  return cupEscape(value);
}

async function unityCupRequest(action, fields = {}) {
  const response = await fetch(UNITY_CUP_API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: unityCupToken, ...fields })
  });
  const raw = await response.text();
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error("The server returned an unreadable response. Check the Apps Script deployment.");
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return result;
}

function cupStatus(message, type = "") {
  let el = document.getElementById("unityCupDataStatus");
  if (!el) {
    el = document.createElement("p");
    el.id = "unityCupDataStatus";
    el.className = "editor-notice";
    document.querySelector("main")?.prepend(el);
  }
  el.className = `editor-notice ${type}`.trim();
  el.textContent = message;
}

function cupHideStatus() {
  document.getElementById("unityCupDataStatus")?.remove();
}

function cupTeams() {
  return ["A", "B"].flatMap(group =>
    (unityCupData.teams?.[group] || []).map(name => ({ name, group }))
  );
}

function cupTeamOptions(selected = "") {
  return cupTeams().map(t =>
    `<option value="${cupAttr(t.name)}" ${t.name === selected ? "selected" : ""}>${cupEscape(t.name)} (Group ${t.group})</option>`
  ).join("");
}

function cupFormField(label, name, value = "", type = "text", extra = "") {
  return `<div class="form-field">
    <label for="${name}">${label}</label>
    <input id="${name}" name="${name}" type="${type}" value="${cupAttr(value)}" ${extra}>
  </div>`;
}

function cupFormSelect(label, name, options, selected) {
  return `<div class="form-field">
    <label for="${name}">${label}</label>
    <select id="${name}" name="${name}" required>${options.map(o =>
      `<option value="${cupAttr(o.value)}" ${o.value === selected ? "selected" : ""}>${cupEscape(o.label)}</option>`
    ).join("")}</select>
  </div>`;
}

function cupEditorButtons(saveText = "Save", cancelText = "Cancel") {
  return `<div class="form-actions">
    <button class="account-button" type="submit">${cupEscape(saveText)}</button>
    <button class="editor-button" type="button" data-cancel-editor>Cancel</button>
  </div>`;
}

function cupShowForm(containerId, html) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = html;
  container.classList.remove("hidden");
  container.querySelector("input,select,textarea")?.focus();
  container.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  container.querySelector("[data-cancel-editor]")?.addEventListener("click", () => {
    container.innerHTML = "";
    container.classList.add("hidden");
  });
}

function cupCloseForm(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
    container.classList.add("hidden");
  }
}

function cupEnsureEditorContainers() {
  const matchSection = document.getElementById("matches");
  const teamsSection = document.getElementById("teams");
  if (!matchSection || !teamsSection) return;

  let matchToolbar = document.getElementById("matchEditorToolbar");
  if (!matchToolbar) {
    matchToolbar = document.createElement("div");
    matchToolbar.id = "matchEditorToolbar";
    matchToolbar.className = "editor-toolbar hidden";
    matchToolbar.innerHTML = '<button id="addMatchButton" class="account-button" type="button">+ Add Match</button>';
    matchSection.prepend(matchToolbar);
  }

  let matchForm = document.getElementById("matchFormContainer");
  if (!matchForm) {
    matchForm = document.createElement("div");
    matchForm.id = "matchFormContainer";
    matchForm.className = "inline-editor-container hidden";
    matchToolbar.after(matchForm);
  }

  let teamToolbar = document.getElementById("teamEditorToolbar");
  if (!teamToolbar) {
    teamToolbar = document.createElement("div");
    teamToolbar.id = "teamEditorToolbar";
    teamToolbar.className = "editor-toolbar hidden";
    teamToolbar.innerHTML = '<button id="addTeamButton" class="account-button" type="button">+ Add Team</button>';
    teamsSection.prepend(teamToolbar);
  }

  let teamForm = document.getElementById("teamFormContainer");
  if (!teamForm) {
    teamForm = document.createElement("div");
    teamForm.id = "teamFormContainer";
    teamForm.className = "inline-editor-container hidden";
    teamToolbar.after(teamForm);
  }
}

function renderUnityCupData() {
  cupEnsureEditorContainers();

  const standings = document.querySelector("#standings .groups-grid");
  const teams = document.getElementById("teamsGrid") || document.querySelector("#teams .teams-grid");
  const matches = document.getElementById("matchesList") || document.querySelector("#matches .matches-list");
  if (!standings || !teams || !matches) return;

  standings.innerHTML = ["A", "B"].map(group => {
    const rows = unityCupData.standings?.[group] || [];
    return `<div class="group-card group-${group.toLowerCase()}">
      <h2>Group ${group}</h2>
      <table>
        <thead><tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th class="pts">PTS</th></tr></thead>
        <tbody>${rows.map(row => `<tr>
          <td>${cupEscape(row.team)}</td><td>${cupEscape(row.mp)}</td>
          <td>${cupEscape(row.w)}</td><td>${cupEscape(row.l)}</td>
          <td class="pts">${cupEscape(row.pts)}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }).join("");

  const editor = Boolean(unityCupEditor && unityCupToken);
  document.getElementById("matchEditorToolbar")?.classList.toggle("hidden", !editor);
  document.getElementById("teamEditorToolbar")?.classList.toggle("hidden", !editor);

  const teamCards = cupTeams();
  teams.innerHTML = teamCards.map(team => `<div class="team-card" data-group="${team.group}">
    <span class="group-tag">Group ${team.group}</span>
    <h3>${cupEscape(team.name)}</h3>
    ${editor ? `<div class="team-card-actions">
      <button class="editor-button team-edit" data-team="${cupAttr(team.name)}" data-group="${team.group}" type="button">Edit</button>
      <button class="editor-button danger team-delete" data-team="${cupAttr(team.name)}" type="button">Delete</button>
    </div>` : ""}
  </div>`).join("");

  matches.innerHTML = (unityCupData.matches || []).map(match => {
    const date = match.date || "";
    const time = match.time || "";
    const score = match.score || "";
    const winner = match.winner || "";
    const id = match.id ?? match.matchId ?? "";
    const scoreDisplay = score ? cupEscape(score) : "Not played";
    return `<article class="match-row" data-match-id="${cupAttr(id)}">
      <span class="team team-1">${cupEscape(match.team1)}</span>
      <div class="sets"><span class="set">${scoreDisplay}</span></div>
      <span class="team team-2">${cupEscape(match.team2)}</span>
      <div class="match-details">
        <span class="match-detail">
          <span class="match-detail-label">Date:</span>
          ${editor
            ? `<button type="button" class="match-detail-edit match-edit" data-id="${cupAttr(id)}">${date ? cupEscape(date) : "Date not added"}</button>`
            : `<span class="match-detail-value ${date ? "" : "missing"}">${date ? cupEscape(date) : "Date not added"}</span>`}
        </span>
        <span class="match-detail">
          <span class="match-detail-label">Time:</span>
          ${editor
            ? `<button type="button" class="match-detail-edit match-edit" data-id="${cupAttr(id)}">${time ? cupEscape(time) : "Time not added"}</button>`
            : `<span class="match-detail-value ${time ? "" : "missing"}">${time ? cupEscape(time) : "Time not added"}</span>`}
        </span>
        <span class="match-detail">
          <span class="match-detail-label">Winner:</span>
          <span class="match-detail-value ${winner ? "match-winner" : "missing"}">${winner ? cupEscape(winner) : "Not decided"}</span>
        </span>
      </div>
      ${editor ? `<div class="match-editor-actions">
        <button type="button" class="editor-button match-edit" data-id="${cupAttr(id)}">Edit match</button>
        <button type="button" class="editor-button danger match-delete" data-id="${cupAttr(id)}">Delete</button>
      </div>` : ""}
    </article>`;
  }).join("") || '<p class="editor-notice">No matches have been added yet.</p>';

  document.getElementById("addTeamButton")?.addEventListener("click", () => showTeamForm());
  document.getElementById("addMatchButton")?.addEventListener("click", () => showMatchForm());

  document.querySelectorAll(".team-edit").forEach(button => button.addEventListener("click", () =>
    showTeamForm(button.dataset.team, button.dataset.group)));
  document.querySelectorAll(".team-delete").forEach(button => button.addEventListener("click", () =>
    deleteUnityCupTeam(button.dataset.team)));
  document.querySelectorAll(".match-edit").forEach(button => button.addEventListener("click", () =>
    showMatchForm(button.dataset.id)));
  document.querySelectorAll(".match-delete").forEach(button => button.addEventListener("click", () =>
    deleteUnityCupMatch(button.dataset.id)));

  if (!prefersReducedMotion()) {
    playLanding();
    playAssemble();
  }
}

function showTeamForm(existingName = "", existingGroup = "A") {
  if (!unityCupEditor || !unityCupToken) return;
  const isEdit = Boolean(existingName);
  const containerId = "teamFormContainer";
  const group = existingGroup || "A";
  cupShowForm(containerId, `<form class="inline-editor" id="teamEditorForm">
    <h3>${isEdit ? "Edit Team" : "Add Team"}</h3>
    ${cupFormField("Team name", "teamName", existingName, "text", 'maxlength="80" required')}
    ${cupFormSelect("Group", "teamGroup", [
      { value: "A", label: "Group A" }, { value: "B", label: "Group B" }
    ], group)}
    <p class="form-message" id="teamFormMessage" role="status"></p>
    ${cupEditorButtons(isEdit ? "Save Team" : "Add Team")}
  </form>`);
  document.getElementById("teamEditorForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.teamName.value.trim();
    const newGroup = form.teamGroup.value;
    const msg = document.getElementById("teamFormMessage");
    if (!name) { msg.textContent = "Enter a team name."; return; }
    setFormBusy(form, true);
    try {
      if (isEdit) {
        await unityCupRequest("updateTeam", { oldName: existingName, name, group: newGroup });
      } else {
        await unityCupRequest("addTeam", { name, group: newGroup });
      }
      cupCloseForm(containerId);
      await refreshUnityCupData(isEdit ? "Team updated." : "Team added.");
    } catch (error) {
      msg.textContent = error.message;
      setFormBusy(form, false);
    }
  });
}

function showMatchForm(id = "") {
  if (!unityCupEditor || !unityCupToken) return;
  const match = id ? unityCupData.matches.find(m => String(m.id ?? m.matchId) === String(id)) : null;
  if (id && !match) {
    cupStatus("Could not find that match. Refresh the page and try again.", "error");
    return;
  }
  if (!id && cupTeams().length < 2) {
    cupStatus("Add at least two teams before creating a match.", "error");
    return;
  }
  const isEdit = Boolean(match);
  const containerId = "matchFormContainer";
  const teamOpts = cupTeams();
  const team1 = match?.team1 || teamOpts[0]?.name || "";
  const team2 = match?.team2 || teamOpts.find(t => t.name !== team1)?.name || "";
  cupShowForm(containerId, `<form class="inline-editor" id="matchEditorForm">
    <h3>${isEdit ? "Edit Match" : "Add Match"}</h3>
    ${cupFormSelect("Team 1", "matchTeam1", teamOpts.map(t => ({ value: t.name, label: `${t.name} (Group ${t.group})` })), team1)}
    ${cupFormSelect("Team 2", "matchTeam2", teamOpts.map(t => ({ value: t.name, label: `${t.name} (Group ${t.group})` })), team2)}
    ${cupFormField("Date", "matchDate", match?.date || "", "date")}
    ${cupFormField("Time", "matchTime", normalizeTimeForInput(match?.time || ""), "time")}
    ${cupFormField("Set scores", "matchScore", match?.score || "", "text", 'placeholder="25-22, 26-24" maxlength="100"')}
    ${cupFormSelect("Winner", "matchWinner", [
      { value: "", label: "Not decided" },
      { value: team1, label: team1 },
      { value: team2, label: team2 }
    ], match?.winner || "")}
    <p class="form-hint form-full">Choose the winner manually. Scores are displayed as information and do not determine the winner automatically. Time is entered in your browser's local time format.</p>
    <p class="form-message" id="matchFormMessage" role="status"></p>
    ${cupEditorButtons(isEdit ? "Save Match" : "Add Match")}
  </form>`);

  const form = document.getElementById("matchEditorForm");
  const winner = form.matchWinner;
  function refreshWinnerOptions() {
    const t1 = form.matchTeam1.value, t2 = form.matchTeam2.value;
    const previous = winner.value;
    winner.innerHTML = `<option value="">Not decided</option>
      <option value="${cupAttr(t1)}">${cupEscape(t1)}</option>
      <option value="${cupAttr(t2)}">${cupEscape(t2)}</option>`;
    winner.value = [ "", t1, t2 ].includes(previous) ? previous : "";
  }
  form.matchTeam1.addEventListener("change", refreshWinnerOptions);
  form.matchTeam2.addEventListener("change", refreshWinnerOptions);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const msg = document.getElementById("matchFormMessage");
    const t1 = form.matchTeam1.value;
    const t2 = form.matchTeam2.value;
    if (!t1 || !t2 || t1 === t2) {
      msg.textContent = "Choose two different teams.";
      return;
    }
    const fields = {
      id: id || undefined,
      team1: t1,
      team2: t2,
      date: form.matchDate.value,
      time: normalizeTimeForStorage(form.matchTime.value),
      score: form.matchScore.value.trim(),
      winner: form.matchWinner.value
    };
    setFormBusy(form, true);
    try {
      await unityCupRequest(isEdit ? "updateMatch" : "addMatch", fields);
      cupCloseForm(containerId);
      await refreshUnityCupData(isEdit ? "Match updated." : "Match added.");
    } catch (error) {
      msg.textContent = error.message;
      setFormBusy(form, false);
    }
  });
}

function normalizeTimeForInput(value) {
  const s = String(value || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return "";
  let h = Number(m[1]), min = Number(m[2]);
  if (m[3]) {
    const ampm = m[3].toUpperCase();
    if (h < 1 || h > 12 || min > 59) return "";
    if (ampm === "AM") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  }
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function normalizeTimeForStorage(value) {
  if (!value) return "";
  const m = value.match(/^(\d{2}):(\d{2})$/);
  if (!m) return value;
  let h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

function setFormBusy(form, busy) {
  form.querySelectorAll("button, input, select, textarea").forEach(el => {
    if (el.type !== "hidden") el.disabled = busy;
  });
}

async function deleteUnityCupTeam(name) {
  if (!unityCupEditor || !unityCupToken) return;
  if (!confirm(`Delete team "${name}"? Teams referenced by matches cannot be deleted.`)) return;
  try {
    await unityCupRequest("deleteTeam", { name });
    await refreshUnityCupData("Team deleted.");
  } catch (error) {
    cupStatus("Could not delete team: " + error.message, "error");
  }
}

async function deleteUnityCupMatch(id) {
  if (!unityCupEditor || !unityCupToken) return;
  if (!confirm("Delete this match? This cannot be undone.")) return;
  try {
    await unityCupRequest("deleteMatch", { id });
    await refreshUnityCupData("Match deleted.");
  } catch (error) {
    cupStatus("Could not delete match: " + error.message, "error");
  }
}

async function loadUnityCupData() {
  if (unityCupDataLoading) return;
  unityCupDataLoading = true;
  try {
    const result = await unityCupRequest("getData");
    unityCupData = {
      teams: result.teams || { A: [], B: [] },
      matches: result.matches || [],
      standings: result.standings || { A: [], B: [] }
    };
    renderUnityCupData();
    if (unityCupToken) await loadUnityCupActivity();
  } catch (error) {
    console.error("Could not load Unity Cup data:", error);
    cupStatus("Could not load live data: " + error.message, "error");
  } finally {
    unityCupDataLoading = false;
  }
}

async function refreshUnityCupData(message) {
  cupStatus(message || "Updating…");
  try {
    const result = await unityCupRequest("getData");
    unityCupData = {
      teams: result.teams || { A: [], B: [] },
      matches: result.matches || [],
      standings: result.standings || { A: [], B: [] }
    };
    renderUnityCupData();
    if (unityCupToken) await loadUnityCupActivity();
    cupStatus(message || "Data updated.", "success");
  } catch (error) {
    cupStatus("Could not refresh data: " + error.message, "error");
  }
}

async function loadUnityCupActivity() {
  if (!unityCupToken) return;
  try {
    const result = await unityCupRequest("getActivity");
    let details = document.getElementById("unityCupActivity");
    if (!details) {
      details = document.createElement("details");
      details.id = "unityCupActivity";
      details.className = "activity-dropdown";
      document.querySelector(".account-bar")?.after(details);
    }
    details.innerHTML = `<summary>Recent editor activity</summary>
      <div class="activity-list">${(result.activity || []).map(item => `
        <p><strong>${cupEscape(item.name || item.email || "Editor")}</strong>
        ${cupEscape(item.action)} ${cupEscape(item.target)}
        <small>${cupEscape(item.at)}</small></p>`).join("") || "<p>No activity recorded yet.</p>"}</div>`;
  } catch (error) {
    console.warn("Could not load editor activity:", error);
  }
}

function initUnityCupLogin() {
  const bar = document.querySelector(".account-bar");
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const loginPanel = document.getElementById("loginPanel");
  const loginForm = document.getElementById("loginForm");
  const accountMessage = document.getElementById("accountMessage");
  const loginMessage = document.getElementById("loginMessage");
  const loginSubmit = document.getElementById("loginSubmit");
  if (!bar || !signInButton || !signOutButton || !loginPanel || !loginForm) return;

  function renderAccount() {
    const signedIn = Boolean(unityCupEditor && unityCupToken);
    accountMessage.textContent = signedIn
      ? `Signed in as ${unityCupEditor.name} (${unityCupEditor.email})`
      : "Viewing as guest";
    signInButton.classList.toggle("hidden", signedIn);
    signOutButton.classList.toggle("hidden", !signedIn);
    bar.classList.toggle("signed-in", signedIn);
    loginPanel.classList.add("hidden");
    document.getElementById("matchEditorToolbar")?.classList.toggle("hidden", !signedIn);
    document.getElementById("teamEditorToolbar")?.classList.toggle("hidden", !signedIn);
  }

  signInButton.addEventListener("click", () => {
    loginMessage.textContent = "";
    loginPanel.classList.toggle("hidden");
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginMessage.textContent = "Signing in…";
    loginSubmit.disabled = true;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
      const response = await fetch(UNITY_CUP_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Sign-in failed.");
      unityCupToken = result.token;
      unityCupEditor = result.editor;
      document.getElementById("loginPassword").value = "";
      loginMessage.textContent = "";
      renderAccount();
      await loadUnityCupData();
    } catch (error) {
      loginMessage.textContent = "Could not sign in: " + (error.message || "Please try again.");
    } finally {
      loginSubmit.disabled = false;
    }
  });

  signOutButton.addEventListener("click", async () => {
    try {
      if (unityCupToken) {
        await fetch(UNITY_CUP_API, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "logout", token: unityCupToken })
        });
      }
    } catch (error) {
      console.warn("Server sign-out request failed.", error);
    }
    unityCupToken = null;
    unityCupEditor = null;
    cupCloseForm("matchFormContainer");
    cupCloseForm("teamFormContainer");
    renderAccount();
    renderUnityCupData();
    loginMessage.textContent = "";
  });
  renderAccount();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
  initUnityCupLogin();
  playLanding();
  loadUnityCupData();
});
