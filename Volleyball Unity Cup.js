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
