const IMPACT_MS=460;
const TEAM_STAGGER_MS=90;
const SVG_NS="http://www.w3.org/2000/svg";
function showTab(name)
{
  ["standings","matches","teams"].forEach(function (id)
  {
    const section=document.getElementById(id);
    if(section)
      {
        section.classList.toggle("hidden",id!==name);
      }
  });
  document.querySelectorAll(".tab").forEach(function (btn)
  {
    btn.classList.toggle("active",btn.dataset.tab===name);
  });
  if(name==="matches")
    {
      playFusion();
    }
  if(name==="standings")
    {
      playLanding();
    }
  if(name==="teams")
    {
      playAssemble();
    }
}
function prefersReducedMotion()
{
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function playFusion()
{
  const overlay=document.getElementById("fusionOverlay");
  if(!overlay)
    {
      return;
    }
  overlay.classList.remove("play");
  void overlay.offsetWidth;
  generateLightning(overlay);
  overlay.classList.add("play");
}
function generateLightning(overlay)
{
  const svg=overlay.querySelector(".lightning-svg");
  if(!svg)
    {
      return;
    }
  svg.innerHTML="";
  if(prefersReducedMotion())
    {
      return;
    }
  const rect=overlay.getBoundingClientRect();
  const width=rect.width || 400;
  const height=rect.height || 160;
  svg.setAttribute("viewBox","0 0 "+width+" "+height);
  svg.setAttribute("preserveAspectRatio","none");
  const centerX=width/2;
  const centerY=height/2;
  const reach=Math.min(width,height)*0.55+Math.max(width,height)*0.15;
  const boltCount=5+Math.floor(Math.random()*3);
  for(let i=0;i<boltCount;i++)
    {
      const angle=Math.random()*Math.PI*2;
      const length=reach*(0.55+Math.random()*0.55);
      const mainBolt=buildJaggedPath(centerX,centerY,angle,length);
      drawBolt(svg,mainBolt,false);
      let forks=0;
      if(Math.random()<0.75)
        {
          forks=Math.random()<0.3 ? 2:1;
        }
      for(let f=0;f<forks;f++)
        {
          const fork=buildBranch(mainBolt);
          if(fork)
            {
              drawBolt(svg,fork,true);
            }
        }
    }
}
function buildJaggedPath(startX,startY,angle,length)
{
  const segments=5+Math.floor(Math.random()*4);
  const dirX=Math.cos(angle);
  const dirY=Math.sin(angle);
  const sideX=-dirY;
  const sideY=dirX;
  const points=[{x:startX,y:startY}];
  let drift=0;
  for(let s=1;s<=segments;s++)
    {
      const distance=(length/segments)*s;
      drift+=(Math.random()-0.5)*length*0.22;
      points.push(
        {
          x:startX+dirX*distance+sideX*drift,y:startY+dirY*distance+sideY*drift
        });
    }
  return points;
}
function buildBranch(mainPoints)
{
  if(mainPoints.length<4)
    {
      return null;
    }
  const index=1+Math.floor(Math.random()*(mainPoints.length-3));
  const start=mainPoints[index];
  const next=mainPoints[index+1];
  const parentAngle=Math.atan2(next.y-start.y,next.x-start.x);
  const turn=(0.5+Math.random()*0.9)*(Math.random()<0.5 ? -1:1);
  const stepLength=Math.hypot(next.x-start.x,next.y-start.y);
  const branchLength=stepLength*(2.5+Math.random()*2.5);
  return buildJaggedPath(start.x,start.y,parentAngle+turn,branchLength);
}
function pointsToPath(points)
{
  return points.map(function (p,i)
  {
    return (i===0 ? "M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1);
  }).join(" ");
}
function drawBolt(svg,points,isBranch)
{
  const d=pointsToPath(points);
  const glow=document.createElementNS(SVG_NS,"path");
  glow.setAttribute("d",d);
  glow.setAttribute("class","bolt-glow");
  const core=document.createElementNS(SVG_NS,"path");
  core.setAttribute("d",d);
  core.setAttribute("class","bolt-core");
  svg.appendChild(glow);
  svg.appendChild(core);
  let delay=IMPACT_MS+Math.random()*25;
  if(isBranch)
    {
      delay+=40+Math.random()*70;
    }
  const peak=isBranch ? 0.75:1;
  const travelTime=90+Math.random()*70;
  [glow,core].forEach(function (path)
  {
    const length=path.getTotalLength();
    path.style.strokeDasharray=length;
    path.animate([{strokeDashoffset:length,opacity:0,offset:0},{strokeDashoffset:length*0.55,opacity:peak,offset:0.18},{strokeDashoffset:0,opacity:peak,offset:0.42},{strokeDashoffset:0,opacity:peak*0.15,offset:0.55},{strokeDashoffset:0,opacity:peak*0.9,offset:0.63},{strokeDashoffset:0,opacity:peak*0.1,offset:0.74},{strokeDashoffset:0,opacity:peak*0.6,offset:0.8},{strokeDashoffset:0,opacity:0,offset:1}],
      {
        duration:420+travelTime,
        delay:delay,
        easing:"linear",
        fill:"forwards"
      });
  });
}
function playLanding()
{
  const cards=document.querySelectorAll("#standings .group-card");
  cards.forEach(function (card)
  {
    card.classList.remove("drop");
  });
  const section=document.getElementById("standings");
  if(section)
    {
      void section.offsetWidth;
    }
  cards.forEach(function (card)
  {
    card.classList.add("drop");
  });
}
function playAssemble()
{
  const cards=document.querySelectorAll("#teams .team-card");
  cards.forEach(function (card)
  {
    card.classList.remove("materialize");
  });
  const section=document.getElementById("teams");
  if (section)
    {
      void section.offsetWidth;
    }
  cards.forEach(function (card,i)
  {
    card.style.setProperty("--stagger",i*TEAM_STAGGER_MS+"ms");
    card.classList.add("materialize");
  });
}
document.addEventListener("DOMContentLoaded",function ()
{
  document.querySelectorAll(".tab").forEach(function (btn)
  {
    btn.addEventListener("click",function ()
    {
      showTab(btn.dataset.tab);
    });
  });
  playLanding();
});






/* Unity Cup editor login */
const UNITY_CUP_API = "https://script.google.com/macros/s/AKfycbwJTBui5jUqL8g31zzE4bclNhMPyynAsPGup8yDexhcOmdK3cMWaAIb9CzDCW_l5XaENw/exec";

let unityCupEditor = null;
let unityCupToken = null;

document.addEventListener("DOMContentLoaded", function () {
  const bar = document.querySelector(".account-bar");
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const loginPanel = document.getElementById("loginPanel");
  const loginForm = document.getElementById("loginForm");
  const accountMessage = document.getElementById("accountMessage");
  const loginMessage = document.getElementById("loginMessage");
  const loginSubmit = document.getElementById("loginSubmit");

  if (!bar || !signInButton || !signOutButton || !loginPanel ||
      !loginForm || !accountMessage || !loginMessage || !loginSubmit) {
    console.error("Unity Cup login elements are missing from index.html.");
    return;
  }

  function renderAccount() {
    const signedIn = Boolean(unityCupEditor && unityCupToken);
    accountMessage.textContent = signedIn
      ? "Signed in as " + unityCupEditor.name + " (" + unityCupEditor.email + ")"
      : "Viewing as guest";
    signInButton.classList.toggle("hidden", signedIn);
    signOutButton.classList.toggle("hidden", !signedIn);
    bar.classList.toggle("signed-in", signedIn);
    loginPanel.classList.add("hidden");
  }

  signInButton.addEventListener("click", function () {
    loginMessage.textContent = "";
    loginPanel.classList.toggle("hidden");
  });

  loginForm.addEventListener("submit", async function (event) {
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
      loginMessage.textContent =
        "Could not sign in: " + (error.message || "Please try again.");
    } finally {
      loginSubmit.disabled = false;
    }
  });

  signOutButton.addEventListener("click", async function () {
    try {
      if (unityCupToken) {
        await fetch(UNITY_CUP_API, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "logout", token: unityCupToken })
        });
      }
    } catch (error) {
      console.warn("The server sign-out request could not be completed.", error);
    } finally {
      unityCupToken = null;
      unityCupEditor = null;
      renderAccount();
      loginMessage.textContent = "";
    }
  });

  renderAccount();
});






/* Unity Cup live data and editor controls */
let unityCupData = { teams: { A: [], B: [] }, matches: [], standings: { A: [], B: [] } };
let unityCupDataLoading = false;

async function unityCupRequest(action, fields = {}) {
  const response = await fetch(UNITY_CUP_API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: unityCupToken, ...fields })
  });
  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("The server returned an unreadable response. Check the Apps Script deployment.");
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return result;
}

function cupEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function cupEditorControls(title, buttonText, buttonId) {
  return `<div class="editor-section-heading">
    <h2>${title}</h2>
    <div class="editor-actions">
      ${unityCupEditor ? `<button class="account-button" id="${buttonId}">${buttonText}</button>` : ""}
    </div>
  </div>`;
}


function renderUnityCupData() {
  const standings = document.querySelector("#standings .groups-grid");
  const teams = document.querySelector("#teams .teams-grid");
  const matches = document.querySelector("#matches .matches-list");
  if (!standings || !teams || !matches) return;

  // Render standings
  standings.innerHTML = ["A", "B"].map(group => {
    const rows = unityCupData.standings?.[group] || [];
    return `<div class="group-card group-${group.toLowerCase()}">
      <h2>Group ${group}</h2>
      <table>
        <thead>
          <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th class="pts">PTS</th></tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>
            <td>${cupEscape(row.team)}</td>
            <td>${cupEscape(row.mp)}</td>
            <td>${cupEscape(row.w)}</td>
            <td>${cupEscape(row.l)}</td>
            <td class="pts">${cupEscape(row.pts)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  }).join("");

  // Render team cards
  const teamCards = ["A", "B"].flatMap(group =>
    (unityCupData.teams?.[group] || []).map(name => ({ group, name }))
  );

  teams.innerHTML = teamCards.map(team => `
    <div class="team-card" data-group="${team.group}">
      <span class="group-tag">Group ${team.group}</span>
      <h3>${cupEscape(team.name)}</h3>
      ${unityCupEditor ? `
        <div class="editor-actions">
          <button class="account-button team-delete"
            data-team="${cupEscape(team.name)}"
            data-group="${team.group}">Delete</button>
        </div>` : ""}
    </div>
  `).join("");

  // Render match cards
  matches.innerHTML = (unityCupData.matches || []).map(match => `
    <div class="match-row">
      <span class="team team-1">${cupEscape(match.team1)}</span>
      <div class="sets">
        <span class="set">${cupEscape(
          match.score ||
          [match.date, match.time].filter(Boolean).join(" · ") ||
          "Not played"
        )}</span>
      </div>
      <span class="team team-2">${cupEscape(match.team2)}</span>
      ${unityCupEditor ? `
        <div class="match-editor-actions">
          <button class="account-button match-edit"
            data-id="${cupEscape(match.id)}">Edit</button>
          <button class="account-button match-delete"
            data-id="${cupEscape(match.id)}">Delete</button>
        </div>` : ""}
    </div>
  `).join("");

  // Remove old headings before inserting new ones
  document.getElementById("matchesEditorHeading")?.remove();
  document.getElementById("teamsEditorHeading")?.remove();

  // Add the Teams heading and Add Team button
  const teamHeading = document.createElement("div");
  teamHeading.id = "teamsEditorHeading";
  teamHeading.innerHTML = cupEditorControls(
    "Teams", "＋ Add team", "addTeamButton"
  );
  teams.parentElement.insertBefore(teamHeading, teams);

  // Add the Matches heading and Add Match button
  const matchHeading = document.createElement("div");
  matchHeading.id = "matchesEditorHeading";
  matchHeading.innerHTML = cupEditorControls(
    "Matches", "＋ Add match", "addMatchButton"
  );
  matches.parentElement.insertBefore(matchHeading, matches);

  // Only show Add buttons to signed-in editors
  document.getElementById("addTeamButton")
    ?.addEventListener("click", addUnityCupTeam);
  document.getElementById("addMatchButton")
    ?.addEventListener("click", addUnityCupMatch);

  // Team deletion
  document.querySelectorAll(".team-delete").forEach(button => {
    button.addEventListener("click", () =>
      deleteUnityCupTeam(button.dataset.team)
    );
  });

  // Match editing and deletion
  document.querySelectorAll(".match-edit").forEach(button => {
    button.addEventListener("click", () =>
      editUnityCupMatch(button.dataset.id)
    );
  });

  document.querySelectorAll(".match-delete").forEach(button => {
    button.addEventListener("click", () =>
      deleteUnityCupMatch(button.dataset.id)
    );
  });

  // Preserve existing card animations
  if (typeof playLanding === "function") playLanding();
  if (typeof playAssemble === "function") playAssemble();
}


async function loadUnityCupData() {
  if (unityCupDataLoading) return;
  unityCupDataLoading = true;
  try {
    const result = await unityCupRequest("getData");
    unityCupData = result;
    renderUnityCupData();
    await loadUnityCupActivity();
  } catch (error) {
    console.error("Could not load Unity Cup data:", error);
    showUnityCupMessage("Could not load live data: " + error.message);
  } finally {
    unityCupDataLoading = false;
  }
}

function showUnityCupMessage(message) {
  let status = document.getElementById("unityCupDataStatus");
  if (!status) {
    status = document.createElement("p");
    status.id = "unityCupDataStatus";
    status.className = "login-message";
    document.querySelector("main")?.prepend(status);
  }
  status.textContent = message;
}

async function refreshUnityCupData(message) {
  showUnityCupMessage(message || "Updating…");
  await loadUnityCupData();
  const status = document.getElementById("unityCupDataStatus");
  if (status) status.textContent = "Data updated.";
}

async function addUnityCupTeam() {
  const name = prompt("Enter the new team name:");
  if (!name?.trim()) return;
  const group = prompt("Which group? Enter A or B:", "A")?.trim().toUpperCase();
  if (!["A", "B"].includes(group)) {
    alert("Group must be A or B.");
    return;
  }
  try {
    await unityCupRequest("addTeam", { name: name.trim(), group });
    await refreshUnityCupData("Team added.");
  } catch (error) {
    alert("Could not add team: " + error.message);
  }
}

async function deleteUnityCupTeam(name) {
  if (!confirm(`Delete team "${name}"? This cannot be undone. Teams referenced by matches cannot be deleted.`)) return;
  try {
    await unityCupRequest("deleteTeam", { name });
    await refreshUnityCupData("Team deleted.");
  } catch (error) {
    alert("Could not delete team: " + error.message);
  }
}

async function addUnityCupMatch() {
  const teams = ["A", "B"].flatMap(group => unityCupData.teams[group] || []);
  if (teams.length < 2) {
    alert("Add at least two teams before creating a match.");
    return;
  }
  const team1 = prompt("Team 1:\n" + teams.join(", "));
  if (!team1) return;
  const team2 = prompt("Team 2:\n" + teams.join(", "));
  if (!team2) return;
  const date = prompt("Date (YYYY-MM-DD), or leave blank:");
  if (date === null) return;
  const time = prompt("Time (HH:MM), or leave blank:");
  if (time === null) return;
  const score = prompt("Set scores, e.g. 25-22, 26-24. Leave blank if not played:");
  if (score === null) return;
  try {
    await unityCupRequest("addMatch", {
      team1: team1.trim(), team2: team2.trim(),
      date: date.trim(), time: time.trim(), score: score.trim()
    });
    await refreshUnityCupData("Match added.");
  } catch (error) {
    alert("Could not add match: " + error.message);
  }
}

async function editUnityCupMatch(id) {
  const match = unityCupData.matches.find(item => String(item.id) === String(id));
  if (!match) return alert("Could not find that match. Refresh and try again.");
  const team1 = prompt("Team 1:", match.team1);
  if (team1 === null) return;
  const team2 = prompt("Team 2:", match.team2);
  if (team2 === null) return;
  const date = prompt("Date (YYYY-MM-DD):", match.date || "");
  if (date === null) return;
  const time = prompt("Time (HH:MM):", match.time || "");
  if (time === null) return;
  const score = prompt("Set scores (e.g. 25-22, 26-24):", match.score || "");
  if (score === null) return;
  try {
    await unityCupRequest("updateMatch", {
      id, team1: team1.trim(), team2: team2.trim(),
      date: date.trim(), time: time.trim(), score: score.trim()
    });
    await refreshUnityCupData("Match updated.");
  } catch (error) {
    alert("Could not update match: " + error.message);
  }
}

async function deleteUnityCupMatch(id) {
  if (!confirm("Delete this match? This cannot be undone.")) return;
  try {
    await unityCupRequest("deleteMatch", { id });
    await refreshUnityCupData("Match deleted.");
  } catch (error) {
    alert("Could not delete match: " + error.message);
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
        <p><strong>${cupEscape(item.name || item.email)}</strong>
        ${cupEscape(item.action)} ${cupEscape(item.target)}
        <small>${cupEscape(item.at)}</small></p>`).join("") || "<p>No activity recorded yet.</p>"}</div>`;
  } catch (error) {
    console.warn("Could not load editor activity:", error);
  }
}

/* Load public data when the page opens. */
document.addEventListener("DOMContentLoaded", loadUnityCupData);

