/* Two In Reserve — training log.
   Prescription lives in PLAN/RULES/REST below; what happened lives in state.days.
   Those are the only two sources of truth. The Plan tab renders from the same
   constants the Day tab does, so the numbers cannot drift apart. */
(function () {
  "use strict";

  var BUILD = 21;
  var CFG = window.CONFIG || {};
  var REST = { big: 180, other: 90 };

  var PLAN = {
    lowerA: { name: "Lower A", sub: "knee dominant", ex: [
      { id:"hacksquat", n:"Hack Squat",          s:4, lo:6,  hi:10, w:97.6,  step:2.5, big:1, reset:1, pat:"legs" },
      { id:"legcurl",   n:"Seated Leg Curl",     s:3, lo:8,  hi:12, w:73,    step:2.5, reset:1 },
      { id:"legext",    n:"Leg Extension",       s:2, lo:12, hi:20, w:null,  step:2.5 },
      { id:"calf",      n:"Calf Press",          s:3, lo:8,  hi:15, w:100.4, step:2.5 },
      { id:"lats",      n:"Lateral Raises",      s:3, lo:10, hi:15, w:10,    step:1 } ] },
    upperA: { name: "Upper A", sub: "push bias", ex: [
      { id:"chestpress",n:"Machine Chest Press", s:4, lo:8,  hi:12, w:59,    step:2.5, big:1, pat:"push" },
      { id:"csrow",     n:"Chest Support Row",   s:3, lo:8,  hi:12, w:59,    step:2.5, big:1, reset:1, pat:"pull" },
      { id:"incline",   n:"Incline DB Press",    s:3, lo:8,  hi:12, w:24,    step:2,   big:1 },
      { id:"pushdown",  n:"Triceps Pushdown",    s:3, lo:10, hi:15, w:null,  step:2.5 },
      { id:"reardelt",  n:"Rear Delt Flye",      s:3, lo:12, hi:20, w:null,  step:2.5 },
      { id:"hammer",    n:"Hammer Curl",         s:2, lo:8,  hi:12, w:12,    step:2 } ] },
    lowerB: { name: "Lower B", sub: "hip dominant", ex: [
      { id:"legpress",  n:"Leg Press",           s:4, lo:10, hi:15, w:145.7, step:5, big:1, pat:"legs" },
      { id:"legcurl",   n:"Seated Leg Curl",     s:3, lo:8,  hi:12, w:73,    step:2.5, reset:1 },
      { id:"hipthrust", n:"Hip Thrust",          s:2, lo:8,  hi:12, w:62.7,  step:2.5 },
      { id:"adductor",  n:"Adductor",            s:2, lo:10, hi:15, w:66,    step:2.5 },
      { id:"calf",      n:"Calf Press",          s:3, lo:8,  hi:15, w:100.4, step:2.5 },
      { id:"lats",      n:"Lateral Raises",      s:3, lo:10, hi:15, w:10,    step:1 } ] },
    upperB: { name: "Upper B", sub: "pull bias", ex: [
      { id:"pulldown",  n:"Lat Pulldown",        s:3, lo:8,  hi:12, w:73,    step:2.5, big:1, pat:"pull" },
      { id:"csrow",     n:"Chest Support Row",   s:3, lo:8,  hi:12, w:59,    step:2.5, big:1, reset:1 },
      { id:"dips",      n:"Dips",                s:3, lo:8,  hi:12, w:null,  step:2.5, bw:1, big:1 },
      { id:"bicep",     n:"Bench Bicep Curl",    s:3, lo:8,  hi:12, w:12,    step:2, reset:1 },
      { id:"reardelt",  n:"Rear Delt Flye",      s:3, lo:12, hi:20, w:null,  step:2.5 } ] }
  };
  var ORDER = ["lowerA","upperA","lowerB","upperB"];
  var BY_DOW = { 1:"lowerA", 2:"upperA", 4:"lowerB", 5:"upperB" };

  var RULES = {
    set: { t:"How to run a set", p:[
      "<b>Every set except the last one:</b> stop with two reps left in the tank. It should feel clearly easy at the end — if you are grinding, you are at zero reps in reserve, not two.",
      "<b>Last set only:</b> go to failure.",
      "That applies to the big lifts. <b>Everything else goes to failure on every set</b> — low fatigue cost, so no reason to hold back.",
      "<b>Rest:</b> three minutes on the big lifts, ninety seconds on everything else. The timer does this for you; it starts the moment you log a set." ] },
    range: { t:"The rep range is not a cap", p:[
      "If you could get 15 on a set with an 8–12 range, the weight is too light. Do the reps you can and add weight next session. The range describes where a correctly loaded set <i>lands</i>, not where you stop.",
      "A well-loaded 3-set exercise at 8–12 looks like <b>11, 10, 10</b> — two in reserve, two in reserve, failure.",
      "Not 15, 8, 6. Not 10, 5, 4." ] },
    prog: { t:"Progression", p:[
      "Hit the top of the rep range on your <b>last set</b> and the weight goes up by the smallest increment next session.",
      "Nothing else changes the weight. Not “set 1 felt easy.” Not “I have been on this weight a while.”",
      "The app applies this for you — when a lift has earned it, the new weight is already loaded when you open the card, and you can put it back with one tap." ] },
    drop: { t:"When the reps fall off", p:[
      "A drop of one to three reps across sets is normal. Bigger than that, work through these in order:" ],
      causes:[
        "<b>You went to failure on set 1 anyway.</b> Most likely cause. Recalibrate what two-in-reserve feels like.",
        "<b>Rest was too short.</b> Actually time it.",
        "<b>The weight is genuinely too heavy.</b> If you rested properly, held back properly and still went 10/6/4, drop it 5–10% next session." ],
      after:"One bad exercise in a session is noise, not a signal. Do not restructure around it." },
    nutrition: { t:"Nutrition", targets:{ kcalOver:300, protLo:130, protHi:160, gainLo:0.25, gainHi:0.5 }, p:[
      "At 6'4\" and 80kg this outranks everything above it.",
      "Small surplus: roughly <b>300 kcal over maintenance</b>. Protein <b>130–160 g per day</b>.",
      "Expect <b>0.25–0.5 kg per month</b>. Faster than that is mostly fat.",
      "Weigh yourself two or three mornings a week and track the weekly average, never a single day." ] },
    first3: { t:"Why some weights were reset", p:[
      "Hack squat, seated leg curl, chest support row and bench curl all started lower than where you were, because you were producing sets like 5/4/3 and 10/5/4 at the higher loads — one working set followed by two that do not count.",
      "The first three weeks are about calibrating effort and letting the resets feel controlled. Expect to add weight quickly once the rep quality is there.",
      "The number to watch: are your sets reading <b>10/9/8</b> instead of 10/5/4?" ] }
  };

  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* ---------------- dates ---------------- */
  function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function parse(s){ var p=String(s).split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
  function addDays(s,n){ var d=parse(s); d.setDate(d.getDate()+n); return iso(d); }
  function mondayOf(s){ var d=parse(s); d.setDate(d.getDate()-((d.getDay()+6)%7)); return iso(d); }
  function todayISO(){ return iso(new Date()); }
  function pretty(s){ var d=parse(s); return DOW[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()]; }
  function shortD(s){ var d=parse(s); return d.getDate()+" "+MON[d.getMonth()]; }

  if(!CFG.blockStart) CFG.blockStart = "2026-09-07";
  if(parse(CFG.blockStart).getDay() !== 1) CFG.blockStart = mondayOf(CFG.blockStart);
  /* Two jobs that were one constant. ORIGIN numbers the weeks and may move when a
     new block starts. HORIZON is the earliest date the app will ever read and is
     hardcoded, so editing config.js can never hide months of training. */
  var ORIGIN  = mondayOf(CFG.blockStart);
  var HORIZON = "2026-09-07";

  function weekNo(m){ return Math.round((parse(m)-parse(ORIGIN))/604800000)+1; }
  function inBlock(d){ return d >= HORIZON; }

  var today = todayISO();
  function effToday(){ return today < HORIZON ? HORIZON : today; }
  function daysAway(d){ return Math.round((parse(d)-parse(today))/86400000); }
  function whenLabel(d){
    var n=daysAway(d);
    if(n===0) return "Today · "+pretty(d);
    if(n===1) return "Tomorrow · "+pretty(d);
    if(n>1)   return "In "+n+" days · "+pretty(d);
    if(n===-1)return "Yesterday · "+pretty(d);
    return pretty(d);
  }
  var sel = effToday();

  /* ---------------- state ---------------- */
  var LS = "workout.v2", LS_OLD = "workout.v1", EMAIL_KEY = "workout.email";
  var SKIP_KEY = "workout.noaccount", EXPORT_KEY = "workout.lastexport";
  var state = { v:2, days:{}, pending:{} };
  var sb=null, user=null, inFlight=false;
  var fatal=null, corrupt=false;

  function quarantine(raw){
    corrupt = true;
    try{
      if(raw && !localStorage.getItem(LS+".unreadable"))
        localStorage.setItem(LS+".unreadable", raw);   // keep the FIRST bad copy only
    }catch(e){}
  }
  function loadLocal(){
    var raw=null;
    try{
      raw = localStorage.getItem(LS);
      if(raw){
        var p=JSON.parse(raw);
        if(p && p.days){ state=p; state.pending=state.pending||{}; return; }
        quarantine(raw);                                // parsed, but not a log
      }
    }catch(e){ quarantine(raw); }
    try{
      var old = localStorage.getItem(LS_OLD);
      if(old){ var q=JSON.parse(old); if(q&&q.days){ state={v:2,days:q.days,pending:{}};
        Object.keys(q.days).forEach(function(k){ state.pending[k]=1; }); saveLocal(); } }
    }catch(e){}
  }
  function saveLocal(){
    try{
      localStorage.setItem(LS, JSON.stringify(state));
      if(fatal){ fatal=null; syncIdle(); }
    }catch(e){
      fatal = "NOT SAVED on this device — export from the Week tab now";
      setSync("off", fatal); announce(fatal);
    }
  }
  function rememberedEmail(){ try{ return localStorage.getItem(EMAIL_KEY)||""; }catch(e){ return ""; } }

  /* Read-only view of a day. Never creates anything — rendering must not write. */
  function peek(d){ return state.days[d] || null; }
  function peekEx(d,id){ var r=peek(d); return (r && r.ex && r.ex[id]) || null; }
  /* Write path. Only called from real user actions. */
  function day(d){
    if(!state.days[d]) state.days[d]={ ex:{}, bw:null, p:null, note:"", k:null, updatedAt:0 };
    var r=state.days[d]; if(!r.ex) r.ex={};
    return r;
  }
  function entry(d,id){
    var dd=day(d);
    if(!dd.ex[id]) dd.ex[id]={ w:null, r:[], g:[] };
    return dd.ex[id];
  }

  var pushTimer=null;
  function touch(d){
    d = d || sel;
    day(d).updatedAt = Date.now();
    state.pending[d] = 1;
    saveLocal();
    if(pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 800);
  }

  function pendingCount(){ return Object.keys(state.pending||{}).length; }

  function announce(msg){
    var l=document.getElementById("live");
    if(l){ l.textContent=""; setTimeout(function(){ l.textContent=msg; },50); }
  }

  function setSync(cls,msg){
    if(fatal){ cls="off"; msg=fatal; }              // never let a green lie print over it
    var e=document.getElementById("sync");
    e.className = "chip" + (cls?" "+cls:"");
    document.getElementById("syncmsg").textContent = msg + "  ·  b" + BUILD;
  }
  function syncIdle(){
    if(fatal){ setSync("off",fatal); return; }
    if(corrupt){ setSync("off","Previous log unreadable — kept a copy, started fresh"); return; }
    var n=pendingCount();
    if(!navigator.onLine){
      setSync("off", n ? "Offline — "+n+" day"+(n>1?"s":"")+" waiting" : "Offline — saved on this phone");
      return;
    }
    if(!user) setSync("off", n? n+" day"+(n>1?"s":"")+" saved here, not synced" : "Logging on this device");
    else if(n)  setSync("off", n+" day"+(n>1?"s":"")+" waiting to sync");
    else        setSync("ok","Synced");
  }

  /* ---------------- sync ---------------- */
  function push(){
    if(!sb || !user || !navigator.onLine || inFlight) { syncIdle(); return; }
    var days = Object.keys(state.pending);
    if(!days.length){ syncIdle(); return; }
    var rows = days.map(function(d){
      return { user_id:user.id, day:d, payload:state.days[d],
               updated_at:new Date(state.days[d].updatedAt||Date.now()).toISOString() };
    });
    inFlight = true;
    setSync("", "Syncing " + days.length + "…");
    sb.from("days").upsert(rows,{onConflict:"user_id,day"}).then(function(res){
      inFlight = false;
      if(res.error){ setSync("off","Not synced — "+res.error.message); return; }
      /* Clear only what this request actually carried; anything edited meanwhile stays pending. */
      days.forEach(function(d){
        if(state.days[d] && state.days[d].updatedAt <= Date.parse(rows.filter(function(r){return r.day===d;})[0].updated_at))
          delete state.pending[d];
      });
      saveLocal(); syncIdle();
      if(pendingCount()) setTimeout(push, 500);
    }).catch(function(){ inFlight=false; setSync("off","Not synced — will retry"); });
  }

  function pull(){
    if(!sb || !user || !navigator.onLine) return Promise.resolve();
    return sb.from("days").select("day,payload,updated_at").gte("day", HORIZON).then(function(res){
      if(res.error || !res.data) return;
      var changed=false;
      res.data.forEach(function(row){
        if(state.pending[row.day]) return;           /* never clobber un-pushed local edits */
        var local = state.days[row.day];
        var remoteAt = (row.payload && row.payload.updatedAt) || Date.parse(row.updated_at) || 0;
        if(!local || remoteAt > (local.updatedAt||0)){
          var pay = row.payload || {};
          pay.ex = pay.ex || {}; pay.updatedAt = remoteAt;
          state.days[row.day] = pay; changed=true;
        }
      });
      if(changed){ saveLocal(); render(); }
      syncIdle();
    }).catch(function(){});
  }

  /* ---------------- session for a date ---------------- */
  function sessionKey(d){
    if(!inBlock(d)) return null;
    var r = peek(d);
    if(r && r.k) return r.k;
    return BY_DOW[parse(d).getDay()] || null;
  }
  function sessionOf(d){ var k=sessionKey(d); return k?PLAN[k]:null; }

  /* ---------------- progression ---------------- */
  /* Most recent day strictly before `d` on which this exercise has logged reps. */
  function lastDone(d,id){
    var ks = Object.keys(state.days).filter(function(k){ return k<d && k>=HORIZON; }).sort().reverse();
    for(var i=0;i<ks.length;i++){
      var e = state.days[ks[i]].ex && state.days[ks[i]].ex[id];
      if(!e) continue;
      var got = reps(e);
      if(got.length) return { d:ks[i], e:e, got:got };
    }
    return null;
  }
  function reps(e){
    return ((e && e.r) || []).filter(function(v){ return v!=null && v!==""; }).map(Number)
      .filter(function(v){ return !isNaN(v); });
  }
  /* One definition per judgement. These were duplicated across planned(),
     weekStats(), the finish card and the exercise card, with three different
     answers appearing on the same screen. */
  function heldBack(rec){ return !((rec && rec.g) || []).some(Boolean); }
  function counts(ex,rec){ return !!(ex && ex.big) && reps(rec).length>=2; }
  function calibOK(ex,rec){
    var got=reps(rec);
    return got.length>=2 && (got[0]-got[got.length-1])<=3 && heldBack(rec);
  }
  function earnsBump(ex,rec){
    if(!rec || ex.bw) return false;          // nothing to add to a bodyweight lift
    var got=reps(rec);
    return got.length>=ex.s && got[got.length-1]>=ex.hi && (rec.q||[])[got.length-1]!==2;
  }

  /* Most recent RECORDED load, so one weightless session cannot lose the weight. */
  function lastLoad(d,id,fallback){
    var ks=Object.keys(state.days).filter(function(k){ return k<d && k>=HORIZON; }).sort().reverse();
    for(var i=0;i<ks.length;i++){
      var e=state.days[ks[i]].ex && state.days[ks[i]].ex[id];
      if(e && e.w!=null) return e.w;
    }
    return fallback;
  }

  /* The real increment for a machine, learned the one time the user sets it.
     Stored as `st` on that day's exercise record, so it rides the existing sync
     with no schema change and reaches every device. */
  function stepFor(d,id){
    var ks=Object.keys(state.days).filter(function(k){ return k<=d && k>=HORIZON; }).sort().reverse();
    for(var i=0;i<ks.length;i++){
      var e=state.days[ks[i]].ex && state.days[ks[i]].ex[id];
      if(e && e.st!=null && e.st>0) return e.st;
    }
    return null;
  }
  /* The learned step if we have one, otherwise PLAN's guess. */
  function stepOf(d,ex){ var st=stepFor(d,ex.id); return st!=null ? st : ex.step; }

  /* Days since this exercise was last actually done. */
  function gapSince(d,id,prev){
    prev = prev || lastDone(d,id);
    return prev ? Math.round((parse(d)-parse(prev.d))/86400000) : null;
  }

  /* What the card should show as today's load, and why. Pure — writes nothing. */
  function planned(d,ex){
    var own = peekEx(d,ex.id);
    if(own && own.w!=null) return { w:own.w, from:null };
    var prev = lastDone(d,ex.id);
    if(!prev) return { w:ex.w, from:null };
    var base = prev.e.w!=null ? prev.e.w : lastLoad(d,ex.id,ex.w);
    /* Coming back from a layoff, the last session no longer describes this body.
       Ease the load rather than bumping it off three-week-old evidence. */
    var stp = stepOf(d,ex);
    var since = gapSince(d, ex.id, prev);
    if(ex.big && !ex.bw && base!=null && since>=16){
      var eased = Math.max(stp, Math.round(Math.floor(base*0.9/stp)*stp*10)/10);
      if(eased<base) return { w:eased, from:base, on:prev.d, ease:since };
    }
    var earned = earnsBump(ex, prev.e);
    if(earned && base!=null){
      if(stepFor(d,ex.id)!=null) return { w:Math.round((base+stp)*10)/10, from:base, on:prev.d };
      /* We have never been shown this machine's ladder. Ask, rather than invent
         a number like 100.1 that no pin stack can be set to. */
      return { w:base, from:base, on:prev.d, needNotch:true };
    }
    return { w:base, from:null };
  }

  /* ---------------- rest timer ---------------- */
  var restEnd=0, restTotal=0, restTick=null, wl=null, audio=null;
  function ensureAudio(){
    if(audio) return audio;
    try{ audio = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audio=null; }
    return audio;
  }
  function chime(){
    var a=ensureAudio(); if(!a) return;
    if(a.state==="suspended"||a.state==="interrupted"){ try{ a.resume(); }catch(e){} }
    [0,0.18,0.36].forEach(function(t,i){
      var o=a.createOscillator(), g=a.createGain();
      o.type="sine"; o.frequency.value=[660,880,1170][i];
      g.gain.setValueAtTime(0.0001,a.currentTime+t);
      g.gain.exponentialRampToValueAtTime(0.35,a.currentTime+t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+t+0.30);
      o.connect(g); g.connect(a.destination);
      o.start(a.currentTime+t); o.stop(a.currentTime+t+0.32);
    });
  }
  function holdScreen(on){
    if(!navigator.wakeLock) return;
    if(on && !wl) navigator.wakeLock.request("screen").then(function(s){ wl=s;
      s.addEventListener("release",function(){ wl=null; }); }).catch(function(){});
    if(!on && wl){ wl.release().catch(function(){}); wl=null; }
  }
  function startRest(ex,secs,endAt){
    ensureAudio();
    restTotal = secs || (ex.big ? REST.big : REST.other);
    restEnd = endAt || (Date.now()+restTotal*1000);
    document.getElementById("restwhat").textContent = ex.n;
    document.getElementById("restsub").textContent =
      restTotal>=120 ? (restTotal/60).toFixed(restTotal%60?1:0).replace(".0","")+" minutes"+(ex.big?" — big lift":"")
                     : restTotal+" seconds";
    var bar=document.getElementById("rest");
    bar.classList.add("on"); bar.classList.remove("done");
    holdScreen(true);
    if(restTick) clearInterval(restTick);
    restTick=setInterval(tickRest,200); tickRest();
  }
  function tickRest(){
    var left=Math.max(0,restEnd-Date.now()), s=Math.ceil(left/1000);
    document.getElementById("clock").textContent = Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
    document.getElementById("restbar").style.width = (100-(left/(restTotal*1000))*100)+"%";
    var ib=document.getElementById("restbig");
    if(ib) ib.textContent = s>0 ? (Math.floor(s/60)+":"+String(s%60).padStart(2,"0")) : "GO.";
    if(s===0){
      clearInterval(restTick); restTick=null;
      document.getElementById("rest").classList.add("done");
      document.getElementById("restsub").textContent = "Go.";
      chime(); if(navigator.vibrate) navigator.vibrate([200,90,200]);
      announce("Rest over. Next set.");
      clearRest(true); render();        // record the real rest, then redraw with a log button
      holdScreen(false);
    }
  }
  /* A rest is an absolute timestamp in device-local storage, so a relaunch or a
     locked phone must pick it back up rather than silently dropping it. */
  function resumeRest(){
    if(restTick || !restLive()) return;
    var d=effToday(), order=sessionOrder(d), ex=null;
    order.forEach(function(e){ if(e.id===local.restExId) ex=e; });
    if(!ex){ local.restEndAt=null; local.restExId=null; local.restStart=null; saveRun(); return; }
    startRest(ex, local.restSecs || restFor(ex), local.restEndAt);
  }

  function stopRest(){
    document.getElementById("rest").classList.remove("on","done");
    if(restTick){ clearInterval(restTick); restTick=null; }
    holdScreen(false);
  }
  document.getElementById("restskip").addEventListener("click", function(){
    if(restShown()){ clearRest(true); render(); } else stopRest();
  });

  /* ---------------- rep pad ---------------- */
  var padCtx=null;

  /* The sheet has three faces. Which one opens is decided by the set, never
     by the user: a held-back big-lift set gets the three-button shortcut, a
     failure set gets the grid, and a big-lift set that has just been given a
     number gets the reserve question. */
  function openLog(ex,i){
    padCtx={ex:ex,i:i,d:sel};
    var target=stopTarget(sel,ex,i);
    if(target!=null) padShort(ex,i,target);
    else padGrid(ex,i,null);
    document.getElementById("pad").classList.add("on");
  }

  function padHead(a,b){
    document.getElementById("padwhat").textContent=a;
    document.getElementById("padrange").textContent=b;
  }
  /* A `mustAnswer` face has no dismiss: every exit is an answer, because a
     silent Close would discard the integer the user already chose. */
  function padRows(list,mustAnswer){
    var g=document.getElementById("padgrid");
    g.className="padstack"; g.innerHTML="";
    document.getElementById("padclose").classList.toggle("hidden",!!mustAnswer);
    list.forEach(function(o){
      var b=el("button","bigopt"+(o.cls?" "+o.cls:""),o.t); b.type="button";
      b.addEventListener("click",o.fn); g.appendChild(b);
    });
    document.getElementById("padgrind").classList.add("hidden");
    document.getElementById("padclear").classList.add("hidden");
  }

  function padShort(ex,i,target){
    padHead(ex.n+" · set "+(i+1), "target "+target);
    padRows([
      { t:target+" — and I had two left", cls:"go",
        fn:function(){ logSet(ex,i,target,2); } },
      { t:target+" — but that was everything", cls:"go",
        fn:function(){ logSet(ex,i,target,0); } },
      { t:"A different number", cls:"ghost",
        fn:function(){ padGrid(ex,i,target); } }
    ]);
  }

  function padGrid(ex,i,target){
    if(!padCtx) return;
    padHead(ex.n+" · set "+(i+1),
      target!=null ? "stop 2 short · target "+target
                   : (!ex.big||i===ex.s-1 ? "to failure · "+ex.lo+"–"+ex.hi : "target "+ex.lo+"–"+ex.hi));
    var g=document.getElementById("padgrid");
    g.className="padgrid"; g.innerHTML="";
    var from=Math.max(1,ex.lo-4), to=ex.hi+5;
    for(var v=from;v<=to;v++){
      var b=el("button","padbtn"+(v>=ex.lo&&v<=ex.hi?" inrange":"")+(v===target?" target":""),String(v));
      b.type="button";
      (function(val){ b.addEventListener("click",function(){
        if(ex.big) padQuestion(ex,i,val); else logSet(ex,i,val,null);
      }); })(v);
      g.appendChild(b);
    }
    document.getElementById("padgrind").classList.add("hidden");
    document.getElementById("padclose").classList.remove("hidden");
    var hasVal=(function(){ var r=peekEx(sel,ex.id); return !!(r&&r.r&&r.r[i]!=null&&r.r[i]!==""); })();
    document.getElementById("padclear").classList.toggle("hidden",!hasVal);
  }

  /* Fires only on big lifts — 3 or 4 times a session, exactly where this
     lifter fails. All three answers are styled identically on purpose: the
     moment honesty is punished visually, the data dies. */
  function padQuestion(ex,i,v){
    if(!padCtx) return;
    padCtx={ex:ex,i:i,d:padCtx.d||sel};
    if(i===ex.s-1){
      padHead(ex.n+" · set "+(i+1), "you logged "+v);
      padRows([
        { t:"Yes, that was everything", cls:"opt", fn:function(){ logSet(ex,i,v,0); } },
        { t:"No, I racked it early",    cls:"opt", fn:function(){ logSet(ex,i,v,2); } }
      ], true);
      document.getElementById("padwhat").textContent="Was that true failure?";
      return;
    }
    padHead("Could you have done two more?", "you logged "+v);
    padRows([
      { t:"More than two left",       cls:"opt", fn:function(){ logSet(ex,i,v,3); } },
      { t:"About two — stopped on it",cls:"opt", fn:function(){ logSet(ex,i,v,2); } },
      { t:"Nothing left — that was failure", cls:"opt", fn:function(){ logSet(ex,i,v,0); } }
    ], true);
  }

  function openPad(ex,i){
    padCtx={ex:ex,i:i,d:sel};
    document.getElementById("padwhat").textContent = ex.n+" · set "+(i+1);
    var toFail = !ex.big || i===ex.s-1;
    document.getElementById("padrange").textContent =
      (toFail?"to failure":"stop 2 short")+" · target "+ex.lo+"–"+ex.hi;
    var grid=document.getElementById("padgrid"); grid.innerHTML="";
    var from=Math.max(1,ex.lo-4), to=ex.hi+5;
    for(var v=from; v<=to; v++){
      var b=document.createElement("button");
      b.className="padbtn"+(v>=ex.lo&&v<=ex.hi?" inrange":"");
      b.type="button"; b.textContent=v;
      (function(val){ b.addEventListener("click",function(){ setRep(val); }); })(v);
      grid.appendChild(b);
    }
    var e=peekEx(sel,ex.id);
    var g=document.getElementById("padgrind");
    g.classList.toggle("hidden",toFail);
    g.classList.toggle("on", !!(e&&e.g&&e.g[i]));
    document.getElementById("padclear").classList.remove("hidden");
    document.getElementById("padgrid").className="padgrid";
    document.getElementById("pad").classList.add("on");
    stopRest();
  }
  function closePad(){ document.getElementById("pad").classList.remove("on"); padCtx=null; }
  function setRep(v){
    if(!padCtx) return;
    var ex=padCtx.ex, i=padCtx.i;
    var rec=entry(sel,ex.id);
    if(rec.w==null) rec.w = planned(sel,ex).w;        /* commit the shown load on first log */
    rec.r=rec.r||[]; rec.r[i]=v;
    touch(); closePad(); renderDay(); startRest(ex);
  }
  document.getElementById("padclose").addEventListener("click",closePad);
  document.getElementById("padclear").addEventListener("click",function(){
    if(!padCtx){ closePad(); return; }
    var d=padCtx.d||sel;
    var rec=peekEx(d,padCtx.ex.id);
    if(rec){
      if(rec.r) rec.r[padCtx.i]=null;
      if(rec.q) rec.q[padCtx.i]=null;
      if(rec.g) rec.g[padCtx.i]=false;
      touch(d);
    }
    closePad(); render();
  });
  document.getElementById("padgrind").addEventListener("click",function(){
    if(!padCtx) return;
    var d=padCtx.d||sel;
    var rec=entry(d,padCtx.ex.id);
    rec.g=rec.g||[]; rec.g[padCtx.i]=!rec.g[padCtx.i];
    rec.q=rec.q||[]; rec.q[padCtx.i]=rec.g[padCtx.i]?0:null;   // one fact, one pair of fields
    this.classList.toggle("on", !!rec.g[padCtx.i]);
    touch(d); render();
  });


  /* ================= GUIDED SESSION =================
     The Day tab, for today, on a training day, is a single column: ticked
     lines above, exactly one open card, dim lines below. The open card prints
     ONE integer to stop at, because the user cannot judge two-in-reserve
     under load — that judgement is the documented problem. Position is always
     derived from the data (cursor), never stored, so a crash, a force-quit or
     an edit on another device all land in the same place. */

  var RUNK = "workout.run.v1";
  var local = { d:null };
  var listMode = false;

  function loadLocal2(){
    try{ var r=JSON.parse(localStorage.getItem(RUNK)||"null");
         local = (r && r.d===effToday()) ? r : { d:effToday() }; }
    catch(e){ local = { d:effToday() }; }
    local.warmTicks = local.warmTicks || [];
  }
  function saveRun(){ try{ localStorage.setItem(RUNK, JSON.stringify(local)); }catch(e){} }

  function sessionOrder(d){
    var s=sessionOf(d); if(!s) return [];
    var r=peek(d), ord=r&&r.ord;
    if(!ord) return s.ex.slice();
    var byId={}; s.ex.forEach(function(e){ byId[e.id]=e; });
    var out=[]; ord.forEach(function(id){ if(byId[id]){ out.push(byId[id]); delete byId[id]; } });
    s.ex.forEach(function(e){ if(byId[e.id]) out.push(e); });
    return out;
  }
  function exDone(d,ex){
    var r=peekEx(d,ex.id);
    if(r&&r.fin) return true;
    if(!r||!r.r) return false;
    for(var i=0;i<ex.s;i++) if(r.r[i]==null||r.r[i]==="") return false;
    return true;
  }
  function skipped(d,ex){ var r=peek(d); return !!(r&&r.skip&&r.skip[ex.id]); }

  function cursor(d){
    var order=sessionOrder(d);
    for(var j=0;j<order.length;j++){
      var ex=order[j];
      if(skipped(d,ex)||exDone(d,ex)) continue;
      var rec=peekEx(d,ex.id);
      for(var i=0;i<ex.s;i++)
        if(!rec||!rec.r||rec.r[i]==null||rec.r[i]==="") return {ex:ex,i:i,idx:j};
    }
    return null;
  }
  function isTargetSet(ex,i){ return !!ex.big && i < ex.s-1; }
  function restFor(ex,q0){ return ex.big ? (q0===0?210:REST.big) : REST.other; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function estFailure(r,q){ return q===3 ? r+3 : q===2 ? r+2 : q===0 ? r : r+1; }

  /* The number the user is told to stop at. null => this set goes to failure. */
  function stopTarget(d,ex,i){
    if(!isTargetSet(ex,i)) return null;
    var prev=lastDone(d,ex.id);
    if(i===0){
      if(!prev) return ex.hi-1;
      /* A correction made three weeks ago is a note on a session that no longer exists. */
      var gap = gapSince(d, ex.id, prev);
      if(gap!=null && gap>=16) return ex.hi-2;
      if(prev.e.nt!=null) return clamp(prev.e.nt, ex.lo, ex.hi+4);
      var q0=(prev.e.q||[])[0];
      var est=estFailure(prev.got[0], q0);
      var t=est-2;
      var pw=planned(d,ex).w, ow=prev.e.w!=null?prev.e.w:ex.w;
      if(pw!=null && ow!=null && pw>ow) t-=1;
      t=clamp(clamp(t, ex.lo, ex.hi+4), prev.got[0]-2, prev.got[0]+2);
      if(q0===0 || (prev.e.g||[])[0]) t=Math.max(1, Math.min(t, prev.got[0]-1));
      return t;
    }
    var rec=peekEx(d,ex.id)||{};
    var r=(rec.r||[])[i-1], a=(rec.q||[])[i-1];
    if(r==null||r==="") return ex.hi-1;
    var t2 = clamp(a===3 ? r+2 : a===0 ? r-2 : r, ex.lo, ex.hi+4);
    if(a===0) t2 = Math.max(1, Math.min(t2, r-1));   // it failed at r; aim below r
    return t2;
  }

  function rampFor(d){
    var order=sessionOrder(d); if(!order.length) return null;
    var ex=order[0]; if(!ex.big||ex.w==null) return null;
    var w=planned(d,ex).w; if(w==null) return null;
    var stp=stepOf(d,ex);
    function rnd(p){ var v=Math.round(w*p/stp)*stp; return Math.round(v*10)/10; }
    return { ex:ex, rows:[ {w:rnd(.5),reps:8,why:"half the working weight — should feel like nothing"},
                           {w:rnd(.75),reps:5,why:"the last rep should still be easy"} ], top:w, approx:1 };
  }

  function minsLeft(d){
    var order=sessionOrder(d), cur=cursor(d), mins=0;
    if(!cur) return 0;
    order.forEach(function(ex,j){
      if(skipped(d,ex)||exDone(d,ex)) return;
      var rec=peekEx(d,ex.id), from=0;
      if(j===cur.idx) from=cur.i;
      for(var i=from;i<ex.s;i++){
        if(rec&&rec.r&&rec.r[i]!=null&&rec.r[i]!=="") continue;
        mins += 45 + restFor(ex);
      }
    });
    return Math.max(1, Math.ceil((mins-restFor(order[order.length-1]||{}))/60));
  }
  function setCounts(d){
    var order=sessionOrder(d), total=0, done=0;
    order.forEach(function(ex){
      if(skipped(d,ex)) return;
      total+=ex.s;
      done += reps(peekEx(d,ex.id)).length;
    });
    return {done:done,total:total};
  }

  /* Which of the plan's three causes explains a bad exercise. Order is the
     plan's own: effort, then rest, then load. Cause 3 never cuts the weight. */
  function dropCause(d,ex){
    if(!ex.big) return null;
    var rec=peekEx(d,ex.id); if(!rec) return null;
    var got=reps(rec); if(got.length<2) return null;
    var q=rec.q||[], t=rec.t||[];
    var failedEarly=false;
    for(var i=0;i<ex.s-1;i++) if(q[i]===0) failedEarly=true;
    var drop=got[0]-got[got.length-1];
    if(drop<=3 && !failedEarly) return null;
    var n=Math.max(ex.lo, got[0]-2);
    if(failedEarly) return { c:1, n:n,
      line:"You marked a set as everything you had, on a set that should have stopped two short. That is cause one, not the weight. Same load next time." };
    var short=false, worst=null, anyRest=false, need=restFor(ex)*0.75;
    for(var j=0;j<got.length-1;j++){
      var tv=t[j];
      if(tv==null) continue;
      anyRest=true;
      if(tv<need){ short=true; if(worst==null||tv<worst) worst=tv; }
    }
    if(short) return { c:2, n:n, secs:worst, any:anyRest,
      line:"You cut the rest between sets. That is cause two. Take the full "+(restFor(ex)/60===3?"three minutes":"ninety seconds")+" before you blame the weight." };
    return { c:3, n:n };
  }


  /* ---------- history + deleting a session ---------- */
  function allSessions(){
    return Object.keys(state.days).filter(function(d){
      var r=state.days[d];
      return r && r.ex && Object.keys(r.ex).some(function(k){ return reps(r.ex[k]).length; });
    }).sort().reverse();
  }

  function sessionSummary(d){
    var sess=sessionOf(d), r=peek(d);
    if(!sess||!r) return null;
    var sets=0, held=0, tot=0;
    sess.ex.forEach(function(ex){
      var e=r.ex&&r.ex[ex.id]; if(!e) return;
      var got=reps(e); if(!got.length) return;
      sets+=got.length;
      if(counts(ex,e)){ tot++; if(calibOK(ex,e)) held++; }
    });
    return { name:sess.name, sets:sets, held:held, tot:tot };
  }

  var pendingDel=null, delTimer=null, armedAt=0;
  function trashOf(d){
    var r=peek(d); if(!r||!r.trash) return null;
    if(Date.now()-(r.trash.at||0) > 86400000) return null;      // one day to change your mind
    if(hasReps(d)) return null;                                  // superseded by new work
    return r.trash;
  }
  function hasReps(d){
    var r=peek(d);
    return !!(r && r.ex && Object.keys(r.ex).some(function(k){ return reps(r.ex[k]).length; }));
  }
  function trashSets(t){
    if(!t||!t.ex) return 0;
    return Object.keys(t.ex).reduce(function(n,k){ return n+reps(t.ex[k]).length; },0);
  }
  function undoDelete(d){
    var r=state.days[d], t=r&&r.trash; if(!t) return;
    r.ex=t.ex||{}; r.k=t.k||null;
    if(t.run) r.run=t.run; if(t.warm!=null) r.warm=t.warm;
    if(t.ord) r.ord=t.ord; if(t.skip) r.skip=t.skip;
    delete r.trash;
    touch(d); pendingDel=null; render();
  }
  function deleteSession(d){
    var r=state.days[d]; if(!r) return;
    r.trash={ ex:r.ex, k:r.k, run:r.run, warm:r.warm, ord:r.ord, skip:r.skip, at:Date.now() };
    r.ex={};                     // keep r.k, or a rest-day session vanishes with its undo
    delete r.run; delete r.warm; delete r.ord; delete r.skip;
    touch(d);
    if(d===effToday()){
      local.started=null; local.ended=0; local.capturing=0;
      local.warmTicks=[]; local.warmSkipped=0; local.dropFor=null;
      clearRest(false); saveRun();
    }
    pendingDel=null; render();
  }

  function deleteControl(d){
    var wrap=el("div","endrow");
    var t=trashOf(d);
    if(t){
      var u=el("button","quietbtn","Undo delete — restore "+trashSets(t)+" sets");
      u.type="button";
      u.addEventListener("click",function(){ undoDelete(d); });
      wrap.appendChild(u);
      return wrap;
    }
    if(!hasReps(d)) return wrap;
    var sum=sessionSummary(d);
    if(pendingDel===d){
      /* Two buttons, and the destructive one is NOT where the arming tap landed. */
      var keep=el("button","quietbtn","Keep it"); keep.type="button";
      keep.addEventListener("click",function(){ pendingDel=null; render(); });
      var del=el("button","quietbtn danger",
        "Delete "+(sum?sum.sets:"")+" sets — undoable today"); del.type="button";
      del.addEventListener("click",function(){
        if(Date.now()-armedAt < 700) return;      // ignore a double-tap arriving as one gesture
        deleteSession(d);
      });
      wrap.appendChild(keep); wrap.appendChild(del);
      return wrap;
    }
    var b=el("button","quietbtn","Delete this session"); b.type="button";
    b.addEventListener("click",function(){
      pendingDel=d; armedAt=Date.now(); render();
      if(delTimer) clearTimeout(delTimer);
      delTimer=setTimeout(function(){ if(pendingDel===d){ pendingDel=null; render(); } },6000);
    });
    wrap.appendChild(b);
    return wrap;
  }

  function renderHistory(box){
    var all=allSessions();
    box.appendChild(el("h2","sec","History"));
    if(!all.length){ box.appendChild(el("div","empty","Nothing logged yet. Sessions appear here as you do them.")); return; }
    var card=el("div","stat");
    all.slice(0,40).forEach(function(d){
      var s=sessionSummary(d); if(!s) return;
      var row=el("button","sessline hist"); row.type="button";
      row.appendChild(el("span","sesslab",shortD(d)));
      row.appendChild(el("span","exlab",s.name+" · "+s.sets+" sets"));
      if(s.tot) row.appendChild(el("span","ltag"+(s.held<s.tot?" bad":""),s.held+"/"+s.tot));
      row.addEventListener("click",function(){
        sel=d; listMode=(d!==effToday()); stopRest(); closePad(); setTab("day");
      });
      card.appendChild(row);
    });
    box.appendChild(card);
    if(all.length>40) box.appendChild(el("div","empty","Showing the most recent 40 of "+all.length+" sessions."));
  }

  /* ---------- rest clock (device-local, absolute timestamp) ---------- */
  function beginRest(ex,i,secs){
    local.restEndAt = Date.now()+secs*1000;
    local.restExId  = ex.id; local.restSetIdx=i; local.restSecs=secs;
    local.restStart = Date.now();
    saveRun(); startRest(ex,secs);
  }
  function restLive(){ return local.restEndAt && Date.now() < local.restEndAt; }
  function restShown(){ return !!local.restEndAt; }
  function clearRest(record){
    if(record && local.restExId!=null && local.restStart){
      var secs=Math.round((Date.now()-local.restStart)/1000);
      var rec=peekEx(sel,local.restExId);
      if(rec){ rec.t=rec.t||[]; rec.t[local.restSetIdx]=secs; touch(); }
    }
    local.restEndAt=null; local.restExId=null; local.restStart=null;
    saveRun(); stopRest();
  }

  /* ---------- writing a set ---------- */
  function logSet(ex,i,v,q){
    if(!padCtx) return;
    var d=padCtx.d||sel;
    if(d!==sel){ closePad(); return; }        // the day moved under the sheet
    var rec=entry(d,ex.id);
    if(rec.w==null) rec.w=planned(d,ex).w;
    rec.r=rec.r||[]; rec.r[i]=v;
    if(q!=null){ rec.q=rec.q||[]; rec.q[i]=q;
      rec.g=rec.g||[]; rec.g[i]=(q===0 && isTargetSet(ex,i)); }
    touch(d);
    closePad();
    if(exDone(d,ex)){
      var dc=dropCause(d,ex);
      if(dc){ local.dropFor=ex.id; saveRun(); render(); return; }
    }
    beginRest(ex,i,restFor(ex,q));
    render();
  }

  /* ---------------- day view ---------------- */
  function dayMark(d){
    var r=peek(d); if(!r) return "";
    var hasReps = r.ex && Object.keys(r.ex).some(function(k){ return reps(r.ex[k]).length; });
    if(hasReps) return "has";
    if((r.bw!=null&&r.bw!=="")||(r.p!=null&&r.p!=="")||(r.note||"").trim()) return "part";
    return "";
  }

  function renderStrip(){
    var m=mondayOf(sel), box=document.getElementById("daystrip");
    box.innerHTML="";
    for(var i=0;i<7;i++){
      var ds=addDays(m,i), dt=parse(ds);
      var b=document.createElement("button");
      b.className="day "+(sessionKey(ds)?"train":"rest")+" "+dayMark(ds)+
                  (ds===effToday()?" today":"")+(inBlock(ds)?"":" out");
      if(ds===sel) b.setAttribute("aria-current","date");
      b.innerHTML='<span class="dow">'+DOW[dt.getDay()]+'</span><span class="dnum">'+dt.getDate()+
                  '</span><span class="dot"></span>';
      (function(v){ b.addEventListener("click",function(){ sel=v; stopRest(); closePad(); render(); }); })(ds);
      box.appendChild(b);
    }
  }

  function renderDay(){
    if(runActive()){ renderRun(); return; }
    chrome(true);
    renderStrip();
    var wn=weekNo(mondayOf(sel));
    var sess=sessionOf(sel), key=sessionKey(sel);
    var overridden = !!(peek(sel) && peek(sel).k);

    document.getElementById("sesstitle").textContent =
      !inBlock(sel) ? "Before the block" : (sess ? sess.name : "Rest day");
    document.getElementById("sessdate").textContent =
      (!inBlock(sel) ? "Starts "+shortD(ORIGIN) : "Week "+wn) + " · " + pretty(sel);

    /* header context */
    var done=0, total=0;
    if(sess) sess.ex.forEach(function(ex){
      total+=ex.s; var e=peekEx(sel,ex.id); done+=reps(e).length;
    });
    document.getElementById("hctxt").textContent = sess ? sess.name : (inBlock(sel)?"Rest day":"Workout");
    document.getElementById("hctxs").textContent = sess
      ? (done>=total ? "Session complete · "+total+" sets" : done+" / "+total+" sets · "+pretty(sel))
      : pretty(sel);

    var pick=document.getElementById("sesspick"); pick.innerHTML="";
    var list=document.getElementById("exlist"); list.innerHTML="";

    if(!inBlock(sel)){
      list.appendChild(el("div","empty","The block starts "+pretty(ORIGIN)+". Nothing to log before then."));
      document.getElementById("dayhint").textContent="";
      return;
    }

    if(sess){
      var strip=document.createElement("button");
      strip.className="rulestrip";
      var anyBig=sess.ex.some(function(e){return e.big;});
      var anyAcc=sess.ex.some(function(e){return !e.big;});
      strip.innerHTML = !anyBig
        ? "<b>Every set to failure today.</b> All accessories — low fatigue cost, so no reason to hold back."
        : anyAcc
          ? "Big lifts: every set but the last stops with <b>two reps still in you</b>, last set to failure.<br>Everything else: <b>every set to failure</b>."
          : "Every set but the last stops with <b>two reps still in you</b>. The last set goes to failure.";
      strip.addEventListener("click",function(){ setTab("plan"); });
      pick.appendChild(strip);

      if(overridden){
        var mp=document.createElement("div"); mp.className="movedpill";
        mp.appendChild(el("span","", sess.name+" moved to "+DOW[parse(sel).getDay()]));
        var clr=document.createElement("button"); clr.textContent="Undo";
        clr.addEventListener("click",function(){ day(sel).k=null; touch(); renderDay(); });
        mp.appendChild(clr); pick.appendChild(mp);
      }
      if(listMode && sel===effToday()){
        var back2=el("button","quietbtn","Back to the guided session");
        back2.addEventListener("click",function(){ listMode=false; render(); });
        list.appendChild(back2);
      }
      sess.ex.forEach(function(ex){ list.appendChild(exCard(ex)); });
      if(sessionSummary(sel) || trashOf(sel)) list.appendChild(deleteControl(sel));
      document.getElementById("dayhint").innerHTML =
        "Tap a set to log it. Anything that turned into a grind when it should have stopped two short, mark it on the pad — that is the difference between the app telling you to hold the weight and telling you to drop it.";
    } else {
      if(listMode && sel===effToday()){
        var back=el("button","quietbtn","Back to the guided session");
        back.addEventListener("click",function(){ listMode=false; render(); });
        list.appendChild(back);
      }
      if(trashOf(sel)) list.appendChild(deleteControl(sel));
      list.appendChild(el("div","empty","No session scheduled. Did you train today anyway? Pick what you did and log it here."));
      var row=document.createElement("div"); row.className="pickrow";
      ORDER.forEach(function(k){
        var b=document.createElement("button"); b.className="pick"; b.textContent=PLAN[k].name;
        b.addEventListener("click",function(){ day(sel).k=k; touch(); renderDay(); });
        row.appendChild(b);
      });
      pick.appendChild(row);
      document.getElementById("dayhint").textContent="";
    }

    var dd=peek(sel)||{};
    document.getElementById("bw").value   = dd.bw==null?"":dd.bw;
    document.getElementById("prot").value = dd.p==null?"":dd.p;
    document.getElementById("note").value = dd.note||"";
  }

  function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }

  function exCard(ex){
    var card=el("div","ex");
    var pl=planned(sel,ex);
    var rec=peekEx(sel,ex.id);

    var head=el("div","exhead");
    head.appendChild(el("span","exname",ex.n));
    head.appendChild(el("span","prescr",ex.s+" × "+ex.lo+"–"+ex.hi+" · "+(ex.big?"3 min":"90s")));
    card.appendChild(head);

    var prev=lastDone(sel,ex.id);
    if(prev) card.appendChild(el("div","lastline",
      "Last "+pretty(prev.d)+" · "+(prev.e.w!=null?prev.e.w+" kg":(ex.bw?"bodyweight":"weight not recorded"))+
      " · "+prev.got.join(" / ")));

    if(pl.from!=null){
      var bump=el("div","bumped");
      bump.appendChild(el("span","", "Earned it "+shortD(pl.on)+" · "+pl.from+" → "+pl.w+" kg"));
      var undo=el("button",null,"Keep "+pl.from);
      undo.addEventListener("click",function(){ var r=entry(sel,ex.id); r.w=pl.from; touch(); renderDay(); });
      bump.appendChild(undo); card.appendChild(bump);
    }

    var wrow=el("div","wrow");
    wrow.appendChild(el("span","wlab", ex.bw?"Load":"Weight"));
    var wg=el("div","wgt");
    var minus=el("button","wbtn","−"); minus.type="button"; minus.setAttribute("aria-label","Less weight");
    var box=el("div","wbox");
    var wi=document.createElement("input");
    wi.className="winput"; wi.type="number"; wi.inputMode="decimal"; wi.step="any";
    wi.placeholder = ex.bw?"BW":"—";
    wi.value = pl.w==null?"":pl.w;
    wi.setAttribute("aria-label", ex.n+" weight in kg");
    box.appendChild(wi); box.appendChild(el("span","wunit","kg"));
    var plus=el("button","wbtn","+"); plus.type="button"; plus.setAttribute("aria-label","More weight");

    function setW(v){
      var n = (v===""||v==null||isNaN(v)) ? null : Math.round(v*10)/10;
      if(n!=null && n<0) n=0;                                  /* never store a negative load */
      var r=entry(sel,ex.id); r.w=n;
      wi.value = n==null?"":n;
      touch(); renderDay();
    }
    var stepL=stepOf(sel,ex);
    minus.addEventListener("click",function(){ if(pl.w!=null) setW(Math.max(0,pl.w-stepL)); });
    plus.addEventListener("click",function(){ setW((pl.w==null?10:pl.w)+(pl.w==null?0:stepL)); });
    /* commit on input, not blur — iOS never fires change on a digits-only keypad */
    wi.addEventListener("input",function(){
      var n=parseFloat(wi.value);
      if(wi.value==="") { var r=entry(sel,ex.id); r.w=null; touch(); return; }
      if(!isNaN(n)&&n>=0){ var r2=entry(sel,ex.id); r2.w=Math.round(n*10)/10; touch(); }
    });
    wg.appendChild(minus); wg.appendChild(box); wg.appendChild(plus);
    wrow.appendChild(wg); card.appendChild(wrow);

    var srow=el("div","setrow");
    srow.appendChild(el("span","setlab","Reps"));
    var sets=el("div","sets");
    for(var i=0;i<ex.s;i++) sets.appendChild(slot(i));
    srow.appendChild(sets); card.appendChild(srow);

    var got=reps(rec);
    if(got.length){
      var foot=el("div","exfoot");
      var drop=got[0]-got[got.length-1];
      foot.appendChild(el("span","drop","drop "+(drop>0?drop:0)));
      if(counts(ex,rec))
        foot.appendChild(el("span","pill "+(calibOK(ex,rec)?"good":"bad"), calibOK(ex,rec)?"holding":"dropping off"));
      var last=got[got.length-1];
      if(earnsBump(ex,rec)) foot.appendChild(el("span","pill up","goes up next time"));
      else if(got.length===ex.s && last<ex.lo) foot.appendChild(el("span","pill warn","below range"));
      card.appendChild(foot);

      var cue=null;
      if(got[0] >= ex.hi+3) cue = got[0]+" on a "+ex.lo+"–"+ex.hi+" set — the weight is too light. Finish the sets; it goes up next session.";
      else if(ex.big && got.length>=2 && drop>3){
        var grind=(rec.g||[]).some(Boolean);
        cue = grind
          ? "Set 1 went to failure when it should have stopped two short. That is cause 1 — not the weight. Same load next time."
          : "More than 3 reps of drop-off. In order: did set 1 go to failure anyway, was rest actually 3 minutes, and only then is it the weight.";
      }
      if(cue) card.appendChild(el("div","cue",cue));
    }
    return card;

    function slot(i){
      var s=el("div","slot"+((rec&&rec.g&&rec.g[i])?" grind":""));
      var v = rec && rec.r ? rec.r[i] : null;
      var b=el("button","slotbtn"+(v==null||v===""?" empty":""), (v==null||v==="")?"–":String(v));
      b.type="button";
      if(rec && rec.w==null && !ex.bw && (v==null||v==="")) b.disabled=true;
      b.setAttribute("aria-label", ex.n+" set "+(i+1)+(v==null?", not logged":", "+v+" reps"));
      b.addEventListener("click",function(){ openPad(ex,i); });
      var toFail = !ex.big || i===ex.s-1;
      s.appendChild(b);
      s.appendChild(el("div","slotfoot"+(toFail?" f":""), toFail?"FAIL":"2 LEFT"));
      return s;
    }
  }


  /* ---------------- guided column: rendering ---------------- */
  function runActive(){
    return !listMode && sel===effToday() && inBlock(sel) && !!sessionOf(sel);
  }
  function chrome(show){
    document.getElementById("exlist").classList.toggle("runcol",!show);
    ["weeknav","daystrip"].forEach(function(id){
      var e=document.getElementById(id); if(e) e.classList.toggle("hidden",!show);
    });
    document.querySelector(".sesshead").classList.toggle("hidden",!show);
    document.getElementById("sesspick").classList.toggle("hidden",!show);
    document.querySelector(".meta").classList.toggle("hidden",!show);
    document.getElementById("dayhint").classList.toggle("hidden",!show);
  }

  function bigBtn(label,cls,fn){
    var b=el("button","runbtn"+(cls?" "+cls:""),label); b.type="button";
    b.addEventListener("click",fn); return b;
  }
  function quiet(label,fn){
    var b=el("button","quietbtn",label); b.type="button";
    b.addEventListener("click",fn); return b;
  }

  function renderRun(){
    chrome(false);
    var box=document.getElementById("exlist"); box.innerHTML="";
    var sess=sessionOf(sel), order=sessionOrder(sel), rec=peek(sel)||{};
    var cur=cursor(sel), cnt=setCounts(sel);

    document.getElementById("hctxt").textContent=sess.name;
    document.getElementById("hctxs").textContent =
      rec.run&&rec.run.en ? "Complete · "+cnt.done+" sets"
      : cur ? cnt.done+" / "+cnt.total+" sets · "+pretty(sel)
            : "All sets logged";

    /* DONE for the rest of the day */
    if(rec.run && rec.run.en){ box.appendChild(doneCard(order)); return; }

    /* IDLE — nothing started */
    if(!local.started && cnt.done===0){
      box.appendChild(startCard(sess,order,cnt));
      if(trashOf(sel)) box.appendChild(deleteControl(sel));
      return;
    }

    /* CAPTURES */
    if(local.capturing){ box.appendChild(capturesCard()); return; }

    /* run header */
    box.appendChild(runHeader(sess,cnt));

    /* warm-up */
    var ramp=rampFor(sel);
    if(ramp && !local.warmSkipped && (local.warmTicks||[]).filter(Boolean).length < 3)
      box.appendChild(warmCard(ramp));
    else if(ramp) box.appendChild(tickLine(local.warmSkipped?"– Warm-up skipped":"✓ Warm-up", ""));

    if(local.ended){
      order.forEach(function(ex){
        if(skipped(sel,ex)){ box.appendChild(tickLine("– "+ex.n,"skipped")); return; }
        if(reps(peekEx(sel,ex.id)).length) box.appendChild(doneLine(ex));
      });
      box.appendChild(finishCard(order,cnt));
      var back=quiet("Back to the session",function(){ local.ended=0; saveRun(); render(); });
      box.appendChild(back);
      return;
    }

    /* the column */
    order.forEach(function(ex,j){
      if(skipped(sel,ex)){ box.appendChild(skippedLine(ex)); return; }
      if(exDone(sel,ex)){ box.appendChild(doneLine(ex)); return; }
      if(cur && ex.id===cur.ex.id){
        if(local.dropFor===ex.id){ box.appendChild(dropCard(ex)); return; }
        box.appendChild(openCard(ex,cur.i));
        return;
      }
      box.appendChild(pendingLine(ex));
    });

    /* the drop-off card can belong to a finished exercise */
    if(local.dropFor && (!cur || cur.ex.id!==local.dropFor)){
      var dex=null; order.forEach(function(e){ if(e.id===local.dropFor) dex=e; });
      if(dex) box.insertBefore(dropCard(dex), box.children[cur?2:1]||null);
    }

    if(!cur) box.appendChild(finishCard(order,cnt));

    if(cur){
      var endRow=el("div","endrow");
      if(cnt.done===0){
        endRow.appendChild(quiet("Cancel — I'm not training",function(){
          local.started=null; local.ended=0; local.warmTicks=[]; local.warmSkipped=0;
          clearRest(false); saveRun();
          var r=day(sel); if(r.run) delete r.run.st; touch(); render();
        }));
      } else {
        endRow.appendChild(quiet("End session here",function(){
          local.ended=1; clearRest(false); saveRun(); render(); window.scrollTo(0,0);
        }));
      }
      box.appendChild(endRow);
    }
  }

  function runHeader(sess,cnt){
    var h=el("div","runhead");
    h.appendChild(el("h2","runname",sess.name));
    var segs=el("div","segs");
    for(var i=0;i<cnt.total;i++) segs.appendChild(el("span","seg"+(i<cnt.done?" on":"")));
    h.appendChild(segs);
    var left=minsLeft(sel);
    h.appendChild(el("div","runsub", cnt.done>=cnt.total
      ? "All "+cnt.total+" sets logged"
      : "Set "+(cnt.done+1)+" of "+cnt.total+" · about "+left+" min left"));
    return h;
  }

  function startCard(sess,order,cnt){
    var c=el("div","card start");
    c.appendChild(el("div","kicker",whenLabel(sel).toUpperCase()));
    c.appendChild(el("h2","bigtitle",sess.name));
    c.appendChild(el("div","sub",sess.sub));
    var sets=0; order.forEach(function(e){ sets+=e.s; });
    c.appendChild(el("div","meta2",order.length+" exercises · "+sets+" sets · about "+minsLeft(sel)+" min"));
    c.appendChild(el("div","exnames",order.map(function(e){return e.n;}).join(" · ")));

    var wn=weekNo(mondayOf(sel));
    var warn=null;
    var firstBig=null; order.forEach(function(e){ if(!firstBig&&e.big) firstBig=e; });
    if(firstBig){
      var prev=lastDone(sel,firstBig.id);
      if(prev && (prev.e.q||[])[0]===0)
        warn="Last time set 1 of "+firstBig.n.toLowerCase()+" went to failure. Today's one job is not doing that.";
    }
    if(!warn && sel < addDays(HORIZON,21)) warn="Weeks one to three are calibration. The weights are deliberately light. Do not fix that.";
    if(warn) c.appendChild(el("div","warnline",warn));

    c.appendChild(el("div","rule","Every set but the last stops with two reps still in you. The last set goes to failure. The app tells you the number."));

    if(sel!==today){
      var n=daysAway(sel);
      c.appendChild(el("div","warnline",
        n>0 ? "Your block starts "+pretty(sel)+". Today is "+pretty(today)+
              ". Start it now and it is logged against "+shortD(sel)+", not today."
            : "You are looking at "+pretty(sel)+", not today."));
    }
    var label = cnt.done>0 ? "Pick up where you left off"
              : (sel!==today ? "Start "+sess.name+" early" : "Start "+sess.name);
    c.appendChild(bigBtn(label,"go",function(){
      local.started=Date.now(); saveRun();
      var r=day(sel); r.run=r.run||{}; r.run.st=Date.now(); touch(); render();
    }));
    var foot=el("div","cardfoot");
    foot.appendChild(quiet("Log it yourself instead",function(){ listMode=true; render(); }));
    foot.appendChild(quiet(local.picking?"Never mind":"Doing a different session?",function(){
      local.picking=!local.picking; saveRun(); render();
    }));
    c.appendChild(foot);
    if(local.picking){
      var prow=el("div","pickrow");
      ORDER.forEach(function(k){
        if(k===sessionKey(sel)) return;
        var pb=el("button","pick",PLAN[k].name);
        pb.addEventListener("click",function(){
          day(sel).k=k; local.picking=0; saveRun(); touch(); render();
        });
        prow.appendChild(pb);
      });
      c.appendChild(prow);
    }
    return c;
  }

  function warmCard(ramp){
    var c=el("div","card warm");
    c.appendChild(el("div","kicker","Warm up · about 4 min"));
    c.appendChild(el("div","warnline","Without this, set 1 is the warm-up — and set 1 is the set you keep taking to failure."));
    var ticks=local.warmTicks||[];
    var rows=[{t:"2 minutes. Bike, walk, stairs.",w:null}]
      .concat(ramp.rows.map(function(r){ return {t:ramp.ex.n+" · about "+r.w+" kg × "+r.reps, w:r.why}; }));
    rows.forEach(function(row,i){
      var r=el("div","warmrow"+(ticks[i]?" on":""));
      var left=el("div","warmtxt");
      left.appendChild(el("div","warmmain",(ticks[i]?"✓ ":"○ ")+row.t));
      if(row.w) left.appendChild(el("div","warmwhy",row.w));
      r.appendChild(left);
      if(!ticks[i]) r.appendChild(bigBtn("Done","sm",function(){
        local.warmTicks=local.warmTicks||[]; local.warmTicks[i]=1; saveRun(); render();
      }));
      c.appendChild(r);
    });
    c.appendChild(el("div","warmthen","Then: "+ramp.ex.n+", "+ramp.top+" kg."));
    c.appendChild(quiet("Skip warm-up",function(){ local.warmSkipped=1; saveRun(); render(); }));
    return c;
  }

  function openCard(ex,i){
    var c=el("div","card open");
    var rec=peekEx(sel,ex.id)||{};
    var pl=planned(sel,ex);
    var target=stopTarget(sel,ex,i);

    var head=el("div","cardhead");
    head.appendChild(el("h2","cardname",ex.n));
    head.appendChild(el("div","cardtag",ex.big?"BIG LIFT":"ACCESSORY"));
    c.appendChild(head);

    /* weight row */
    var wr=el("div","wrow2");
    if(ex.bw){ wr.appendChild(el("div","wbig","Bodyweight")); }
    else if(pl.w==null){
      /* Nothing to step from. A 6'4" leg extension is twenty taps away from 10kg,
         and the pin stack in front of him is showing the real number. Type it. */
      var box2=el("div","wbox");
      var wi2=document.createElement("input");
      wi2.className="winput"; wi2.type="number"; wi2.inputMode="decimal"; wi2.step="any";
      wi2.placeholder="—"; wi2.setAttribute("aria-label",ex.n+" weight in kg");
      wi2.addEventListener("input",function(){
        var n=parseFloat(wi2.value), r=entry(sel,ex.id);
        if(wi2.value===""){ r.w=null; }
        else if(!isNaN(n)&&n>=0){ r.w=Math.round(n*10)/10; }
        touch();
        var lb=document.getElementById("logbtn");
        if(lb){
          lb.disabled=(r.w==null);
          lb.className="runbtn"+(r.w==null?"":" go");
          lb.textContent=r.w==null?"Set a weight first":"Done — log set "+(i+1);
        }
        var hv=document.getElementById("cardhero"), hs=document.getElementById("cardherosub");
        if(hv && hs){
          var tgt=stopTarget(sel,ex,i);
          if(r.w==null){
            hv.textContent="FIND A WEIGHT"; hv.className="hero fail";
            hs.textContent="Type what the pin is on. You only do this once — after today it carries forward.";
          } else if(tgt!=null){
            hv.textContent="STOP AT "+tgt; hv.className="hero";
            hs.textContent=subFor(ex,i,peekEx(sel,ex.id)||{},tgt,planned(sel,ex));
          } else {
            hv.textContent="TO FAILURE"; hv.className="hero fail";
            hs.textContent="Every set on this one. Cheap fatigue, no reason to hold back. "+ex.lo+"–"+ex.hi+" is where it should land.";
          }
        }
      });
      box2.appendChild(wi2); box2.appendChild(el("span","wunit","kg"));
      wr.appendChild(box2);
    }
    else{
      var minus=el("button","wbtn","−"); minus.type="button"; minus.setAttribute("aria-label","Less weight");
      var val=el("div","wbig",(pl.w==null?"—":pl.w)+" kg");
      var plus=el("button","wbtn","+"); plus.type="button"; plus.setAttribute("aria-label","More weight");
      // From nothing, land on a usable plate rather than crawling up in 2.5s.
      var stepG=stepOf(sel,ex);
      minus.addEventListener("click",function(){
        if(pl.w==null) return;
        var r=entry(sel,ex.id); r.w=Math.max(0,Math.round((pl.w-stepG)*10)/10); touch(); render(); });
      plus.addEventListener("click",function(){
        var r=entry(sel,ex.id);
        r.w = pl.w==null ? 10 : Math.round((pl.w+stepG)*10)/10;
        touch(); render(); });
      wr.appendChild(minus); wr.appendChild(val); wr.appendChild(plus);
    }
    wr.appendChild(el("div","setof","set "+(i+1)+" of "+ex.s));
    c.appendChild(wr);

    /* slots so far */
    var sl=el("div","slots2");
    for(var k=0;k<ex.s;k++){
      var v=(rec.r||[])[k];
      var b=el("span","s2"+(v==null||v===""?" e":"")+((rec.q||[])[k]===0?" g":""),
               (v==null||v==="")?"–":String(v));
      sl.appendChild(b);
    }
    c.appendChild(sl);

    /* the instruction — the whole product */
    if(pl.needNotch){
      var ask=el("div","bumped");
      ask.appendChild(el("span","","Goes up today — you earned it "+shortD(pl.on)+
        ". What is the next weight up from "+pl.from+" kg on this machine?"));
      c.appendChild(ask);
      var nrow=el("div","wrow");
      nrow.appendChild(el("span","wlab","Next notch"));
      var nbox=el("div","wbox");
      var ni=document.createElement("input");
      ni.className="winput"; ni.type="number"; ni.inputMode="decimal"; ni.step="any";
      ni.placeholder=String(pl.from);
      ni.setAttribute("aria-label","Next weight up on this machine, in kg");
      ni.addEventListener("input",function(){
        var v=parseFloat(ni.value);
        if(isNaN(v) || v<=pl.from || v>pl.from*1.5) return;   // must be up, and plausibly so
        var r=entry(sel,ex.id);
        r.w=Math.round(v*10)/10;
        r.st=Math.round((r.w-pl.from)*10)/10;                 // learned once, used forever
        touch();
      });
      nbox.appendChild(ni); nbox.appendChild(el("span","wunit","kg"));
      nrow.appendChild(nbox);
      var keep=el("button","wbtn"); keep.style.width="auto"; keep.style.padding="0 12px";
      keep.textContent="Same"; keep.setAttribute("aria-label","Keep the same weight");
      keep.addEventListener("click",function(){ var r=entry(sel,ex.id); r.w=pl.from; touch(); render(); });
      nrow.appendChild(keep);
      c.appendChild(nrow);
    } else if(pl.from!=null){
      var bump=el("div","bumped");
      bump.appendChild(el("span","","Earned it "+shortD(pl.on)+" · "+pl.from+" → "+pl.w+" kg"));
      var undo=el("button",null,"Keep "+pl.from);
      undo.addEventListener("click",function(){ var r=entry(sel,ex.id); r.w=pl.from; touch(); render(); });
      bump.appendChild(undo); c.appendChild(bump);
    }

    var needsWeight = (pl.w==null && !ex.bw);
    if(needsWeight){
      var h0=el("div","hero fail","FIND A WEIGHT"); h0.id="cardhero"; c.appendChild(h0);
      var h1=el("div","herosub",
        "Type what the pin is on. You only do this once — after today it carries forward.");
      h1.id="cardherosub"; c.appendChild(h1);
    } else if(target!=null){
      c.appendChild(el("div","hero","STOP AT "+target));
      c.appendChild(el("div","herosub", subFor(ex,i,rec,target,pl)));
    } else if(ex.big){
      c.appendChild(el("div","hero fail","GO TO FAILURE"));
      c.appendChild(el("div","herosub","No holding back. The set ends when a rep stops moving. "+ex.hi+" or more and the weight goes up next session."));
    } else {
      c.appendChild(el("div","hero fail","TO FAILURE"));
      c.appendChild(el("div","herosub","Every set on this one. Cheap fatigue, no reason to hold back. "+ex.lo+"–"+ex.hi+" is where it should land."));
    }

    var prev=lastDone(sel,ex.id);
    if(prev)
      c.appendChild(el("div","lastline","Last "+pretty(prev.d)+" · "+(prev.e.w!=null?prev.e.w+" kg":"bodyweight")+" · "+prev.got.join(" / ")));

    /* rest panel, or the log button */
    if(restShown() && local.restExId===ex.id) c.appendChild(restPanel(ex,i));
    else {
      var lb=bigBtn(needsWeight?"Set a weight first":"Done — log set "+(i+1),
                    needsWeight?"":"go",
                    function(){ if(!needsWeight || (peekEx(sel,ex.id)||{}).w!=null) openLog(ex,i); });
      lb.id="logbtn"; lb.disabled=needsWeight;
      c.appendChild(lb);
    }

    var row=el("div","cardfoot");
    if(!reps(peekEx(sel,ex.id)).length) row.appendChild(quiet("Machine taken",function(){
      var r=day(sel); r.skip=r.skip||{}; r.skip[ex.id]=1;
      if(!r.note) r.note="Machine taken"; touch(); render();
    }));
    row.appendChild(quiet("End this exercise",function(){
      var r=entry(sel,ex.id); r.fin=1; touch(); clearRest(false); render();
    }));
    c.appendChild(row);
    return c;
  }

  function subFor(ex,i,rec,target,pl){
    if(i===0 && !lastDone(sel,ex.id))
      return (ex.bw ? "First time doing these here. " : "First time at this weight. ")+
             target+" comes from the range, not from how you feel.";
    if(pl.from!=null) return "New weight. One off the top.";
    var q=(rec.q||[])[i-1];
    if(q===0) return "Earlier than felt right last set. That is the point.";
    if(q===3) return "More than two left last set. Go further this time.";
    return "Not when it gets hard. At "+target+".";
  }

  function restPanel(ex,i){
    var p=el("div","restpanel");
    var rec=peekEx(sel,ex.id)||{};
    var v=(rec.r||[])[local.restSetIdx], q=(rec.q||[])[local.restSetIdx];
    p.appendChild(el("div","restlogged","Set "+(local.restSetIdx+1)+" logged: "+v+
      (q===0?" · nothing left":q===2?" · two left ✓":q===3?" · more than two left":"")));
    var left=Math.max(0,Math.round((local.restEndAt-Date.now())/1000));
    var big=el("div","restbig",left>0?(Math.floor(left/60)+":"+String(left%60).padStart(2,"0")):"GO.");
    big.id="restbig"; p.appendChild(big);
    p.appendChild(el("div","restwhy",left>0
      ? "Rest. "+(local.restSecs>=120
          ? (local.restSecs/60).toFixed(local.restSecs%60?1:0).replace(".0","")+" minutes."
          : local.restSecs+" seconds.")
      : "Next: set "+(i+1)+"."));
    var line=coachLine(ex,local.restSetIdx,rec);
    if(line) p.appendChild(el("div","coach",line));
    var r=el("div","cardfoot");
    r.appendChild(quiet(left>0?"Skip rest — I'm ready":"Clear",function(){ clearRest(true); render(); }));
    r.appendChild(quiet("Someone's waiting",function(){
      local.restEndAt=Date.now()+60000; local.restSecs=60; saveRun(); startRest(ex,60); render();
    }));
    p.appendChild(r);
    return p;
  }

  function coachLine(ex,i,rec){
    var v=(rec.r||[])[i], q=(rec.q||[])[i];
    if(v==null) return null;
    if(!ex.big) return null;
    var target=stopTarget(sel,ex,i);
    if(q===0 && i===0) return "Set 1 went to failure. That is the thing this whole plan exists to fix.";
    if(q===0) return "Failure again. You are spending the last set to buy this one. Next set, count it out and rack it.";
    if(target!=null && v>=target+3 && q!==0) return v+" when the number was "+target+", and still had something left. The load is light — it goes up next session.";
    if(target!=null && v<=target-2) return v+" against a target of "+target+". In order: did set 1 go to failure anyway, was the rest actually full, and only then is it the weight.";
    if(q===3) return "More than two left at "+v+"? Then that was not the set. Next one, go further and stop there.";
    if(q===2) return v+" with two left. Exactly the set the plan is built on. Do that again.";
    return null;
  }

  function mmss(s){ return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }

  function dropCard(ex){
    var dc=dropCause(sel,ex); if(!dc){ local.dropFor=null; saveRun(); return el("div",""); }
    var got=reps(peekEx(sel,ex.id));
    var c=el("div","card drop");
    c.appendChild(el("div","dropnums",got.join(" · ")));
    c.appendChild(el("h2","cardname",ex.n));
    if(got[0]-got[got.length-1]>3)
      c.appendChild(el("div","warnline","That is one working set and the rest that do not count."));
    /* Only cause 1 is fixed by a lower target. Offering that button on causes 2
       and 3 turned a rest error into a permanently easier set 1. */
    var dismiss=function(){ local.dropFor=null; saveRun(); render(); };
    if(dc.c===1){
      c.appendChild(el("div","dropline",dc.line));
      c.appendChild(bigBtn("Next time I stop at "+dc.n,"amber",function(){
        var r=entry(sel,ex.id); r.nt=dc.n; touch(); dismiss();
      }));
    } else if(dc.c===2){
      c.appendChild(el("div","dropline", dc.secs!=null
        ? "You rested "+mmss(dc.secs)+" between sets. That is cause two, and it is not the weight."
        : "I never saw a full rest between those sets. Cause two comes before cause three — the weight is the last thing to blame."));
      c.appendChild(bigBtn("Understood — the full rest next time","",dismiss));
    } else {
      c.appendChild(el("div","dropline",
        "Effort held, rest timed, and it still fell off. One exercise is noise. Run it again exactly like this."));
      c.appendChild(bigBtn("Understood — same weight next time","",dismiss));
    }
    return c;
  }

  /* Start can be tapped days before training, so an unbounded now-minus-start
     prints nonsense. Only report a plausible session length. */
  function sessionMinutes(rec){
    if(!rec||!rec.run||!rec.run.st) return null;
    var m = Math.round(((rec.run.en || Date.now())-rec.run.st)/60000);
    return (m<1 || m>240) ? null : m;
  }

  function finishCard(order,cnt){
    var c=el("div","card finish");
    var st=weekStats(mondayOf(sel));
    c.appendChild(el("div","bigtitle",sessionOf(sel).name+" — done"));
    var mins = sessionMinutes(peek(sel));
    c.appendChild(el("div","meta2",cnt.done+" of "+cnt.total+" sets"+(mins?" · "+mins+" minutes":"")));

    var held=0,tot=0,bad=[];
    order.forEach(function(ex){
      var rec=peekEx(sel,ex.id); if(!counts(ex,rec)) return;
      var got=reps(rec);
      tot++;
      if(calibOK(ex,rec)) held++;
      else bad.push(ex.n+" went "+got.join(" / ")+(heldBack(rec)?"":", with a set taken to failure"));
    });
    c.appendChild(el("div","statlab","Calibration"));
    c.appendChild(el("div","bignum")).textContent=held+" / "+tot;
    c.appendChild(el("div","statnote", tot===0 ? "No big lifts logged today."
      : (held===tot && bad.length===0)
        ? "Big lifts that held within three reps of set 1. That is the shape."
        : bad.length ? held+" / "+tot+" — but "+bad[0]+". Next time, stop set 1 earlier than feels right."
        : "Big lifts that held within three reps of set 1."));

    var ups=[];
    order.forEach(function(ex){
      var rec=peekEx(sel,ex.id); if(!rec) return;
      var got=reps(rec);
      if(earnsBump(ex,rec)){
        var stw=stepFor(sel,ex.id);
        ups.push(ex.n+"  "+(rec.w!=null && stw!=null
          ? rec.w+" → "+Math.round((rec.w+stw)*10)/10+" kg"
          : "up one notch — the app will ask what that is"));
      }
    });
    if(ups.length){
      c.appendChild(el("h2","sec","Goes up next time"));
      ups.forEach(function(u){ c.appendChild(el("div","upline",u)); });
    }

    c.appendChild(el("h2","sec","One thing for next time"));
    c.appendChild(el("div","onething",oneThing(order)));
    var qn=0, rr=peek(sel)||{}, wkq=weekStats(mondayOf(sel));
    if(rr.bw==null && wkq.bws.length<3 && !local.noBw) qn++;
    if(rr.p==null && !local.noP) qn++;
    qn++;
    var nag=backupNag();
    if(nag){
      var nb=el("div","cue",nag+" Back it up from the Week tab.");
      c.appendChild(nb);
    }
    c.appendChild(bigBtn(qn===1?"Nearly done — one question":qn===2?"Nearly done — two questions":"Nearly done — three questions","go",function(){
      local.capturing=1; saveRun(); render(); window.scrollTo(0,0);
    }));
    return c;
  }

  function oneThing(order){
    for(var j=0;j<order.length;j++){
      var ex=order[j], rec=peekEx(sel,ex.id); if(!rec||!ex.big) continue;
      if((rec.q||[])[0]===0) return ex.n+" set 1: stop at "+Math.max(ex.lo,(rec.r||[])[0]-2)+", whatever it feels like.";
    }
    for(var k=0;k<order.length;k++){
      var e2=order[k], r2=peekEx(sel,e2.id); if(!r2||!e2.big) continue;
      var g=reps(r2); if(g.length>=2 && g[0]-g[g.length-1]>3)
        return e2.n+" fell off more than three reps. Same weight next time; hold set 1 back.";
    }
    if(local.warmSkipped) return "Do the warm-up next time. Set 1 is not the place to find out what today feels like.";
    return "Nothing. Repeat this session exactly.";
  }

  function capturesCard(){
    var c=el("div","card captures");
    c.appendChild(el("div","kicker","Before you go"));
    var rec=peek(sel)||{};

    var wk=weekStats(mondayOf(sel));
    if(rec.bw==null && wk.bws.length<3 && !local.noBw){
      c.appendChild(el("div","qlab","Bodyweight this morning"));
      var lastBw=null, ks=Object.keys(state.days).filter(function(x){return x<sel;}).sort().reverse();
      for(var i=0;i<ks.length;i++){ var b=state.days[ks[i]].bw; if(b!=null&&b!==""){ lastBw=+b; break; } }
      var base=lastBw!=null?lastBw:80;
      var row=el("div","chips");
      [base-0.2,base,base+0.2].forEach(function(v){
        var n=Math.round(v*10)/10;
        row.appendChild(bigBtn(String(n),"chip2",function(){ day(sel).bw=n; touch(); render(); }));
      });
      row.appendChild(quiet("Didn't weigh",function(){ day(sel).bw=null; local.noBw=1; saveRun(); render(); }));
      c.appendChild(row);
    }

    if(rec.p==null && !local.noP){
      c.appendChild(el("div","qlab","Protein today, best guess"));
      var pr=el("div","chips");
      [120,140,160].forEach(function(v){
        pr.appendChild(bigBtn(String(v),"chip2",function(){ day(sel).p=v; touch(); render(); }));
      });
      pr.appendChild(quiet("Didn't track",function(){ local.noP=1; saveRun(); render(); }));
      c.appendChild(pr);
    }

    c.appendChild(el("div","qlab","Anything worth saying?"));
    var tags=el("div","chips");
    ["Slept badly","Rushed","Pain","Felt strong","Machine taken"].forEach(function(t){
      var on=(rec.note||"").indexOf(t)>=0;
      tags.appendChild(bigBtn(t,"chip2"+(on?" on":""),function(){
        var r=day(sel), n=r.note||"";
        r.note = n.indexOf(t)>=0 ? n.replace(t,"").replace(/\s*·\s*·\s*/g," · ").trim().replace(/^·\s*|\s*·$/g,"")
                                 : (n?n+" · "+t:t);
        touch(); render();
      }));
    });
    c.appendChild(tags);
    var ta=document.createElement("textarea");
    ta.placeholder="Anything else."; ta.value=rec.note||"";
    ta.addEventListener("input",function(){ day(sel).note=this.value; touch(); });
    c.appendChild(ta);

    c.appendChild(bigBtn("Finish","go",function(){
      var r=day(sel); r.run=r.run||{}; r.run.en=Date.now();
      r.warm = local.warmSkipped?0:1;
      touch(); local.capturing=0; local.ended=0; saveRun(); render(); window.scrollTo(0,0);
    }));
    return c;
  }

  function doneCard(order){
    var c=el("div","card donecard");
    var rec=peek(sel)||{};
    c.appendChild(el("div","bigtitle",sessionOf(sel).name+" · complete"));
    var mins=sessionMinutes(rec);
    c.appendChild(el("div","meta2",setCounts(sel).done+" sets"+(mins?" · "+mins+" minutes":"")));
    order.forEach(function(ex){
      var r=peekEx(sel,ex.id); if(!r) return;
      var got=reps(r); if(!got.length) return;
      c.appendChild(doneLine(ex));
    });
    var nx=nextSessionHint();
    if(nx) c.appendChild(el("div","nextline",nx));
    var row=el("div","cardfoot");
    row.appendChild(quiet("See the week",function(){ setTab("week"); }));
    row.appendChild(quiet("Change something",function(){ listMode=true; render(); }));
    c.appendChild(row);
    c.appendChild(deleteControl(sel));
    return c;
  }

  function nextSessionHint(){
    for(var i=1;i<=7;i++){
      var d=addDays(sel,i), s=sessionOf(d);
      var rel=daysAway(d);
      if(!s) continue;
      var first=null; s.ex.forEach(function(e){ if(!first&&e.big) first=e; });
      if(!first) return "Next — "+s.name+", "+(rel===1?"tomorrow":pretty(d))+".";
      var t=stopTarget(d,first,0), w=planned(d,first).w;
      return "Next — "+s.name+", "+(rel===1?"tomorrow":pretty(d))+". "+first.n+" "+(w!=null?w+" kg":"")+
             (t!=null?", set 1 stops at "+t+".":".");
    }
    return null;
  }

  function doneLine(ex){
    var rec=peekEx(sel,ex.id)||{}, got=reps(rec);
    var bad=counts(ex,rec)&&!calibOK(ex,rec);
    var l=el("button","line done"+(bad?" bad":""));
    l.type="button";
    l.appendChild(el("span","lmark",bad?"!":"✓"));
    l.appendChild(el("span","lname",ex.n));
    l.appendChild(el("span","lw",rec.w!=null?rec.w+" kg":(ex.bw?"bodyweight":"")));
    l.appendChild(el("span","lreps",got.join(" / ")));
    var tag = rec.fin && got.length<ex.s ? got.length+" of "+ex.s+" sets"
            : earnsBump(ex,rec) ? "goes up"
            : bad ? "dropping off" : (counts(ex,rec)?"holding":"");
    if(tag) l.appendChild(el("span","ltag"+(bad?" bad":""),tag));
    l.addEventListener("click",function(){ listMode=true; render(); });
    return l;
  }
  function pendingLine(ex){
    var pl=planned(sel,ex);
    var l=el("button","line pend"); l.type="button";
    l.appendChild(el("span","lmark",""));
    l.appendChild(el("span","lname",ex.n));
    l.appendChild(el("span","lw",ex.bw?"bodyweight":(pl.w!=null?pl.w+" kg":"set it")));
    var gotP=reps(peekEx(sel,ex.id));
    l.appendChild(el("span","ltag", gotP.length ? gotP.join(" / ")+" · "+gotP.length+" of "+ex.s
                                                : ex.s+" × "+ex.lo+"–"+ex.hi));
    l.addEventListener("click",function(){
      var r=day(sel), ord=sessionOrder(sel).map(function(e){return e.id;});
      ord.splice(ord.indexOf(ex.id),1); 
      var cur=cursor(sel);
      ord.splice(cur?ord.indexOf(cur.ex.id):0,0,ex.id);
      r.ord=ord; touch(); clearRest(false); render();
    });
    return l;
  }
  function skippedLine(ex){
    var l=el("button","line pend"); l.type="button";
    l.appendChild(el("span","lmark",""));
    l.appendChild(el("span","lname",ex.n));
    l.appendChild(el("span","ltag","skipped · tap to put back"));
    l.addEventListener("click",function(){
      var r=day(sel); if(r.skip) delete r.skip[ex.id];
      touch(); render();
    });
    return l;
  }
  function tickLine(txt,tag){
    var l=el("div","line done");
    l.appendChild(el("span","lmark",""));
    l.appendChild(el("span","lname",txt));
    if(tag) l.appendChild(el("span","ltag",tag));
    return l;
  }

  /* ---------------- week view ---------------- */
  function weekStats(m){
    var held=0,total=0,ups=[],watch=[],bws=[],prots=[],done=0,lines=[];
    for(var i=0;i<7;i++){
      var ds=addDays(m,i), rec=peek(ds); if(!rec) continue;
      if(rec.bw!=null&&rec.bw!=="") bws.push(+rec.bw);
      if(rec.p!=null&&rec.p!=="")   prots.push(+rec.p);
      var sess=sessionOf(ds); if(!sess) continue;
      var any=false;
      sess.ex.forEach(function(ex){
        var e=rec.ex&&rec.ex[ex.id]; if(!e) return;
        var got=reps(e); if(!got.length) return;
        any=true;
        var drop=got[0]-got[got.length-1];
        if(counts(ex,e)){ total++; if(calibOK(ex,e)) held++; }
        if(earnsBump(ex,e))
          ups.push({n:ex.n,id:ex.id,from:e.w,step:ex.step,last:got[got.length-1]});
        if(counts(ex,e) && !calibOK(ex,e))
          watch.push({n:ex.n,reps:got,grind:!heldBack(e)});
        lines.push({d:ds,n:ex.n,w:e.w,reps:got,g:e.g||[]});
      });
      if(any) done++;
    }
    return {held:held,total:total,ups:ups,watch:watch,bws:bws,prots:prots,done:done,lines:lines};
  }

  function renderWeek(){
    var m=mondayOf(sel), st=weekStats(m), box=document.getElementById("weekbody");
    var wn=weekNo(m);
    box.innerHTML="";
    document.getElementById("hctxt").textContent = wn<1?"Before the block":"Week "+wn;
    document.getElementById("hctxs").textContent = shortD(m)+" – "+shortD(addDays(m,6));

    var s1=el("div","stat");
    s1.appendChild(el("div","statlab","Calibration · big lifts holding within 3 reps"));
    s1.appendChild(el("div","bignum")).innerHTML = st.held+'<small> / '+st.total+'</small>';
    s1.appendChild(el("div","statnote", st.total
      ? "This is the plan's own question: are your sets reading 10/9/8 rather than 10/5/4. Accessories are excluded — they go to failure on every set by design, so a big drop there is correct execution."
      : "Log two or more sets of a big lift and this fills in. Only hack squat, leg press, chest press, pulldown, row, dips and incline press count."));
    box.appendChild(s1);

    var avg = st.bws.length ? st.bws.reduce(function(a,b){return a+b;},0)/st.bws.length : null;
    var s2=el("div","stat");
    s2.appendChild(el("div","statlab",(wn<1?"Before the block":"Week "+wn)+" · "+pretty(m)+" – "+pretty(addDays(m,6))));
    s2.appendChild(el("div","bignum")).innerHTML = st.done+'<small> / 4 sessions</small>';
    s2.appendChild(el("div","statnote",
      (avg!=null ? "Bodyweight "+avg.toFixed(2)+" kg over "+st.bws.length+" reading"+(st.bws.length>1?"s":"")+
        (st.bws.length<2?" — too thin to read a trend yet." : ". Weekly average only, never a single day.")
       : "No weigh-ins yet this week.") +
      (st.prots.length ? " Protein "+Math.round(st.prots.reduce(function(a,b){return a+b;},0)/st.prots.length)+
        " g over "+st.prots.length+" day"+(st.prots.length>1?"s":"")+" (target "+RULES.nutrition.targets.protLo+"–"+RULES.nutrition.targets.protHi+")." : "")));
    box.appendChild(s2);

    var roll=monthRollup();
    if(roll.length>=2){
      var mc=el("div","stat");
      mc.appendChild(el("div","statlab","Month by month"));
      roll.forEach(function(m){
        var r=el("div","sessline");
        r.appendChild(el("span","sesslab",m.label));
        r.appendChild(el("span","reps",m.held+" / "+m.total));
        r.appendChild(el("span","exlab",m.pct+"%"));
        mc.appendChild(r);
      });
      var first=roll[0], last=roll[roll.length-1];
      var note=first.label+" "+first.pct+"% → "+last.label+" "+last.pct+
        "%. Are your sets reading 10/9/8 instead of 10/5/4 — that is the number the plan is about.";
      var bwF=roll.filter(function(m){ return m.bw!=null; });
      if(bwF.length>=2)
        note += " Bodyweight "+bwF[0].bw.toFixed(1)+" kg in "+bwF[0].label+
                ", "+bwF[bwF.length-1].bw.toFixed(1)+" in "+bwF[bwF.length-1].label+".";
      mc.appendChild(el("div","statnote",note));
      box.appendChild(mc);
    }

    box.appendChild(el("h2","sec","Goes up next time"));
    if(st.ups.length){
      var u=el("div","stat");
      st.ups.forEach(function(x){
        var r=el("div","sessline");
        r.appendChild(el("span","sesslab", x.from!=null? x.from+" kg":"—"));
        var stU=stepFor(sel,x.id);
        r.appendChild(el("span","reps","→ "+((x.from!=null && stU!=null)
          ? (Math.round((x.from+stU)*10)/10)+" kg" : "the next notch up")));
        r.appendChild(el("span","exlab", x.n+" · last set "+x.last));
        u.appendChild(r);
      });
      box.appendChild(u);
    } else box.appendChild(el("div","empty","Nothing has earned it yet. A weight moves only when the last set reaches the top of its range — nothing else."));

    box.appendChild(el("h2","sec","Watch"));
    if(st.watch.length){
      var w=el("div","stat");
      st.watch.slice(0,2).forEach(function(x){
        var r=el("div","sessline");
        r.appendChild(el("span","reps", x.reps.join(" ")));
        r.appendChild(el("span","exlab", x.n+" — "+(x.grind
          ? "you marked set 1 a grind. That is cause 1, not the weight."
          : "check rest first, then whether set 1 went to failure.")));
        w.appendChild(r);
      });
      if(st.watch.length>2){
        var mo=el("div","statnote",(st.watch.length-2)+" more, not shown. One bad exercise is noise — do not restructure around it.");
        mo.style.paddingTop="8px"; w.appendChild(mo);
      }
      box.appendChild(w);
    } else box.appendChild(el("div","empty","Nothing dropping off more than 3 reps. That is the whole target."));

    box.appendChild(el("h2","sec","Sessions"));
    var sv=el("div","stat");
    if(!st.lines.length) sv.appendChild(el("div","empty","Nothing logged this week yet."));
    st.lines.forEach(function(x){
      var r=el("div","sessline");
      r.appendChild(el("span","sesslab", DOW[parse(x.d).getDay()]+" "+parse(x.d).getDate()));
      var rp=el("span","reps");
      x.reps.forEach(function(v,i){
        var sp=document.createElement(x.g[i]?"em":"span");
        sp.textContent = v+(x.g[i]?"!":"");
        rp.appendChild(sp);
        if(i<x.reps.length-1) rp.appendChild(document.createTextNode(" "));
      });
      r.appendChild(rp);
      r.appendChild(el("span","exlab", x.n+(x.w!=null?" · "+x.w+" kg":"")));
      sv.appendChild(r);
    });
    box.appendChild(sv);

    renderHistory(box);

    box.appendChild(el("h2","sec","Backup"));
    var bx=el("div","stat");
    var nag0=backupNag();
    if(nag0) bx.appendChild(el("div","warnline",nag0));
    bx.appendChild(el("div","statnote",
      "Everything you have logged, as one file. The only copy that survives a cleared browser, "+
      "a lost phone or a Supabase outage. Worth doing after any session you would hate to lose."));
    var so=el("button","copybtn","Sign in as someone else");
    so.addEventListener("click",function(){
      try{ localStorage.removeItem(EMAIL_KEY); }catch(e){}
      if(sb && sb.auth && sb.auth.signOut) sb.auth.signOut().catch(function(){});
      user=null; showGate(""); syncIdle();
    });
    var eb=el("button","copybtn","Export everything");
    eb.addEventListener("click",function(){ exportAll(eb); });
    bx.appendChild(eb);
    var ib=el("button","copybtn","Restore from a file");
    ib.addEventListener("click",function(){ importPick(ib); });
    bx.appendChild(ib);
    bx.appendChild(so);
    box.appendChild(bx);

    var cb=el("button","copybtn","Copy week for review");
    cb.addEventListener("click",function(){
      var t=weekText(m,st);
      if(navigator.clipboard&&navigator.clipboard.writeText)
        navigator.clipboard.writeText(t).then(function(){
          cb.textContent="Copied — paste it to Claude";
          setTimeout(function(){ cb.textContent="Copy week for review"; },2200);
        }).catch(function(){ cb.textContent="Could not copy"; });
    });
    box.appendChild(cb);
  }

  function lastExportAt(){
    try{ return +(localStorage.getItem(EXPORT_KEY)||0); }catch(e){ return 0; }
  }
  /* Sessions logged since the last export — the only number that says how much
     is riding on one phone. */
  function sessionsSinceExport(){
    var at=lastExportAt();
    return allSessions().filter(function(d){
      var r=state.days[d];
      return !at || (r && (r.updatedAt||0) > at);
    }).length;
  }
  function markExported(){
    try{ localStorage.setItem(EXPORT_KEY, String(Date.now())); }catch(e){}
  }
  function backupNag(){
    var n=sessionsSinceExport();
    if(n<6) return null;
    return lastExportAt()
      ? n+" sessions since your last backup. It lives on this phone and one server."
      : n+" sessions logged and never backed up. It lives on this phone and one server.";
  }

  function exportAll(btn){
    var payload={ v:2, build:BUILD, exported:new Date().toISOString(), days:state.days };
    var text=JSON.stringify(payload,null,1);
    var name="workout-"+todayISO()+".json";
    var file=null;
    try{ file=new File([text],name,{type:"application/json"}); }catch(e){}
    if(file && navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      navigator.share({files:[file],title:"Workout log"})
        .then(function(){ markExported(); btn.textContent="Exported";
          setTimeout(function(){ btn.textContent="Export everything"; render(); },2200); })
        .catch(function(){ downloadFallback(text,name,btn); });
      return;
    }
    downloadFallback(text,name,btn);
  }
  function downloadFallback(text,name,btn){
    try{
      var url=URL.createObjectURL(new Blob([text],{type:"application/json"}));
      var a=document.createElement("a"); a.href=url; a.download=name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); },4000);
      markExported();
      btn.textContent="Exported";
      setTimeout(function(){ btn.textContent="Export everything"; render(); },2200);
    }catch(e){ btn.textContent="Could not export"; }
  }

  var pendingImport=null;
  function importPick(btn){
    if(pendingImport){ applyImport(pendingImport,btn); return; }
    var inp=document.createElement("input");
    inp.type="file"; inp.accept="application/json,.json";
    inp.addEventListener("change",function(){
      var f=inp.files && inp.files[0]; if(!f) return;
      var fr=new FileReader();
      fr.onload=function(){
        var p=null;
        try{ p=JSON.parse(String(fr.result)); }catch(e){}
        if(!p || !p.days){ btn.textContent="That file is not a workout log"; return; }
        var n=Object.keys(p.days).length;
        pendingImport=p;
        btn.textContent="Tap again to merge "+n+" day"+(n===1?"":"s");
        setTimeout(function(){
          if(pendingImport===p){ pendingImport=null; btn.textContent="Restore from a file"; }
        },8000);
      };
      fr.readAsText(f);
    });
    inp.click();
  }
  function applyImport(p,btn){
    var added=0,updated=0,same=0;
    Object.keys(p.days).forEach(function(d){
      var incoming=p.days[d], local=state.days[d];
      if(!local){ state.days[d]=incoming; state.pending[d]=1; added++; return; }
      if((incoming.updatedAt||0) > (local.updatedAt||0)){
        state.days[d]=incoming; state.pending[d]=1; updated++;
      } else same++;
    });
    saveLocal(); push();
    pendingImport=null;
    btn.textContent=added+" added · "+updated+" updated · "+same+" already current";
    announce("Restore complete. "+added+" added, "+updated+" updated.");
    setTimeout(function(){ btn.textContent="Restore from a file"; render(); },3500);
  }

  /* Calibration by month, using counts() and calibOK() verbatim — the same
     definitions the card above prints, so the two can never disagree. */
  function monthRollup(){
    var byId={};
    ORDER.forEach(function(k){ PLAN[k].ex.forEach(function(e){ byId[e.id]=e; }); });
    var months={};
    Object.keys(state.days).forEach(function(d){
      if(d<HORIZON) return;
      var r=state.days[d]; if(!r) return;
      var key=d.slice(0,7);
      var m=months[key] || (months[key]={held:0,total:0,bw:[]});
      if(r.bw!=null && r.bw!=="" && !isNaN(+r.bw)) m.bw.push(+r.bw);
      if(!r.ex) return;
      Object.keys(r.ex).forEach(function(id){
        var ex=byId[id]; if(!ex) return;
        var rec=r.ex[id];
        if(counts(ex,rec)){ m.total++; if(calibOK(ex,rec)) m.held++; }
      });
    });
    return Object.keys(months).sort().filter(function(k){ return months[k].total>=8; })
      .map(function(k){
        var m=months[k], p=parse(k+"-01");
        return { label:MON[p.getMonth()], held:m.held, total:m.total,
                 pct:Math.round(m.held/m.total*100),
                 bw:m.bw.length ? m.bw.reduce(function(a,b){return a+b;},0)/m.bw.length : null };
      });
  }

  function weekText(m,st){
    var wn=weekNo(m);
    var out=[(wn<1?"Before the block":"Week "+wn)+" · "+pretty(m)+" – "+pretty(addDays(m,6)),""];
    for(var i=0;i<7;i++){
      var ds=addDays(m,i), rec=peek(ds); if(!rec) continue;
      var sess=sessionOf(ds);
      var extra=[];
      if(rec.bw!=null&&rec.bw!=="") extra.push("bw "+rec.bw);
      if(rec.p!=null&&rec.p!=="")   extra.push("p "+rec.p);
      var body=[];
      if(sess) sess.ex.forEach(function(ex){
        var e=rec.ex&&rec.ex[ex.id]; if(!e) return;
        var got=((e.r)||[]).map(function(v,i2){ return (v==null||v==="")?null:v+((e.g||[])[i2]?"!":""); }).filter(Boolean);
        if(!got.length) return;
        body.push("  "+ex.n+" "+(e.w!=null?e.w+"kg":(ex.bw?"BW":"weight not recorded"))+" — "+got.join(" "));
      });
      if(!body.length && !extra.length && !(rec.note||"").trim()) continue;
      out.push(pretty(ds)+(sess?" — "+sess.name:" — rest")+(extra.length?"  "+extra.join("  "):""));
      out=out.concat(body);
      if((rec.note||"").trim()) out.push("  note: "+rec.note.trim());
      out.push("");
    }
    out.push("Calibration "+st.held+"/"+st.total+" big lifts within 3 reps of set 1. "+st.done+"/4 sessions.");
    return out.join("\n");
  }

  /* ---------------- plan view ---------------- */
  function renderPlan(){
    var box=document.getElementById("planbody");
    document.getElementById("hctxt").textContent="The plan";
    document.getElementById("hctxs").textContent="4 days · upper/lower · leg priority";
    if(box.dataset.built==="1") return;
    box.innerHTML="";

    var intro=el("div","stat");
    intro.appendChild(el("div","statlab","The block"));
    intro.appendChild(el("div","statnote",
      "Four days a week, upper/lower, two leg days because legs are the priority. Monday Lower A, Tuesday Upper A, Thursday Lower B, Friday Upper B. Starts "+pretty(ORIGIN)+"."));
    box.appendChild(intro);

    ORDER.forEach(function(k){
      var s=PLAN[k], d=Object.keys(BY_DOW).filter(function(x){return BY_DOW[x]===k;})[0];
      box.appendChild(el("h2","sec", DOW[d]+" — "+s.name+" · "+s.sub));
      var wrap=el("div","stat");
      var t=document.createElement("table"); t.className="ptable";
      t.innerHTML="<tr><th>Exercise</th><th>Sets</th><th>Reps</th></tr>";
      s.ex.forEach(function(ex){
        var tr=document.createElement("tr"); if(ex.big) tr.className="big";
        tr.appendChild(el("td",null,ex.n+(ex.reset?" ·":"")));
        tr.appendChild(el("td",null,String(ex.s)));
        tr.appendChild(el("td",null,ex.lo+"–"+ex.hi));
        t.appendChild(tr);
      });
      wrap.appendChild(t);
      wrap.appendChild(el("div","statnote","Orange = big lift: two in reserve until the last set, "+
        (REST.big/60)+" min rest. Everything else to failure every set, "+REST.other+"s rest."+
        (s.ex.some(function(e){return e.reset;})?" · marks a load deliberately reset downward.":"")));
      box.appendChild(wrap);
    });

    ["set","range","prog","drop","nutrition","first3"].forEach(function(k){
      var r=RULES[k];
      box.appendChild(el("h2","sec",r.t));
      var c=el("div","stat"), t=el("div","ptext");
      r.p.forEach(function(par){ var p=document.createElement("p"); p.innerHTML=par; t.appendChild(p); });
      if(r.causes){
        var ol=document.createElement("ol");
        r.causes.forEach(function(x){ var li=document.createElement("li"); li.innerHTML=x; ol.appendChild(li); });
        t.appendChild(ol);
        if(r.after){ var ap=document.createElement("p"); ap.style.marginTop="11px"; ap.innerHTML=r.after; t.appendChild(ap); }
      }
      c.appendChild(t); box.appendChild(c);
    });
    box.dataset.built="1";
  }

  /* ---------------- tabs, nav, rollover ---------------- */
  var TABS=["day","week","plan"];
  function setTab(name){
    closePad();
    TABS.forEach(function(t){
      document.getElementById("tab-"+t).setAttribute("aria-selected", t===name?"true":"false");
      document.getElementById("view-"+t).classList.toggle("hidden", t!==name);
    });
    document.getElementById("weeknav").classList.toggle("hidden", name==="plan");
    render();
    window.scrollTo(0,0);
  }
  TABS.forEach(function(t){
    document.getElementById("tab-"+t).addEventListener("click",function(){ setTab(t); });
  });

  function currentTab(){
    for(var i=0;i<TABS.length;i++)
      if(document.getElementById("tab-"+TABS[i]).getAttribute("aria-selected")==="true") return TABS[i];
    return "day";
  }

  function go(n){
    var t=addDays(sel,n);
    if(t<HORIZON) t=HORIZON;
    if(mondayOf(t)>mondayOf(effToday())) return;
    sel=t; stopRest(); closePad(); render();
  }
  document.getElementById("wprev").addEventListener("click",function(){ go(-7); });
  document.getElementById("wnext").addEventListener("click",function(){ go(7); });
  document.getElementById("wtoday").addEventListener("click",function(){
    sel = effToday(); stopRest(); closePad(); render(); });

  function renderNav(){
    var m=mondayOf(sel), wn=weekNo(m);
    var a=shortD(m), b=shortD(addDays(m,6));
    if(parse(m).getFullYear()!==parse(addDays(m,6)).getFullYear()){
      a+=" "+parse(m).getFullYear(); b+=" "+parse(addDays(m,6)).getFullYear();
    }
    var t=document.getElementById("wtoday");
    t.textContent=(wn<1?"Before the block":"Week "+wn)+" · "+a+" – "+b+(sel===effToday()?" · today":"");
    t.disabled = (sel===effToday());
    document.getElementById("wprev").disabled = (mondayOf(addDays(sel,-7)) < mondayOf(HORIZON));
    document.getElementById("wnext").disabled = (mondayOf(addDays(sel,7)) > mondayOf(effToday()));
  }

  function render(){
    renderNav();
    var t=currentTab();
    if(t==="day") renderDay();
    else if(t==="week") renderWeek();
    else renderPlan();
  }

  function checkRollover(){
    var t=todayISO();
    if(t===today) return;
    if(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    var wasToday=(sel===effToday());
    today=t;
    if(wasToday) sel = effToday();
    loadLocal2(); listMode=false;
    render();
  }
  setInterval(checkRollover,60000);
  window.addEventListener("focus",function(){ checkRollover(); resumeRest(); });
  window.addEventListener("pageshow",function(){ checkRollover(); resumeRest(); });
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"){
      checkRollover();
      resumeRest();
      if(restLive()) holdScreen(true);
      pull(); push();
    }
  });
  window.addEventListener("online",function(){ checkRollover(); push(); pull(); });
  window.addEventListener("offline",function(){ setSync("off","Offline — saving on this device"); });

  document.getElementById("bw").addEventListener("input",function(){
    var v=this.value===""?null:parseFloat(this.value);
    day(sel).bw = (v==null||isNaN(v))?null:v; touch(); renderStrip();
  });
  document.getElementById("prot").addEventListener("input",function(){
    var v=this.value===""?null:parseInt(this.value,10);
    day(sel).p = (v==null||isNaN(v))?null:v; touch();
  });
  document.getElementById("note").addEventListener("input",function(){
    day(sel).note=this.value; touch();
  });

  /* ---------------- auth ---------------- */
  function showApp(){ document.getElementById("gate").classList.add("hidden"); }
  function showGate(msg){
    document.getElementById("gate").classList.remove("hidden");
    if(msg!=null) document.getElementById("gerr").textContent=msg;
  }
  function derive(email){
    var data=new TextEncoder().encode(email+(CFG.salt||""));
    return crypto.subtle.digest("SHA-256",data).then(function(buf){
      var out="",v=new Uint8Array(buf);
      for(var i=0;i<v.length;i++) out+=v[i].toString(16).padStart(2,"0");
      return out;
    });
  }
  function signIn(email){
    email=String(email||"").trim().toLowerCase();
    return derive(email).then(function(key){
      return sb.auth.signInWithPassword({email:email,password:key});
    });
  }
  function onSignedIn(u,email){
    user=u;
    try{ localStorage.setItem(EMAIL_KEY,email); }catch(e){}
    showApp(); syncIdle(); pull(); push();
  }
  document.getElementById("gsubmit").addEventListener("click",function(){
    var btn=this, em=document.getElementById("gmail").value.trim().toLowerCase();
    var err=document.getElementById("gerr");
    if(!em||em.indexOf("@")<0){ err.textContent="That does not look like an email address."; return; }
    if(!navigator.onLine){ err.textContent="No connection. Tap ‘Log without signing in’ — it syncs later."; return; }
    if(!sb){ err.textContent="Cannot reach the server. Log without signing in."; return; }
    btn.disabled=true; btn.textContent="One moment…"; err.textContent="";
    signIn(em).then(function(r){
      btn.disabled=false; btn.textContent="Continue";
      if(r.error){
        err.textContent = /Invalid login/i.test(r.error.message)
          ? "That address has no log yet on this server. Check the spelling, or tap ‘Log without signing in’ — it still records everything on this phone."
          : r.error.message;
        return;
      }
      onSignedIn(r.data.user,em);
    }).catch(function(){
      btn.disabled=false; btn.textContent="Continue";
      err.textContent="Could not reach the server. You can log without signing in.";
    });
  });
  document.getElementById("gmail").addEventListener("keydown",function(e){
    if(e.key==="Enter") document.getElementById("gsubmit").click();
  });
  document.getElementById("gskip").addEventListener("click",function(){
    try{ localStorage.setItem(SKIP_KEY,"1"); }catch(e){}
    showApp(); syncIdle();
  });

  /* ---------------- boot ---------------- */
  loadLocal();
  loadLocal2();
  render();
  resumeRest();
  syncIdle();

  var known = rememberedEmail();
  try{
    sb = window.supabase.createClient(CFG.url, CFG.anonKey, {auth:{persistSession:true,autoRefreshToken:true}});
    sb.auth.getSession().then(function(r){
      var s = r.data && r.data.session;
      if(s && s.user){ user=s.user; showApp(); syncIdle(); pull(); push(); return; }
      if(known && navigator.onLine){
        showApp(); setSync("","Reconnecting…");
        signIn(known).then(function(res){
          if(res.error){ syncIdle(); return; }
          onSignedIn(res.data.user,known);
        }).catch(function(){ syncIdle(); });
        return;
      }
      var skipped=false; try{ skipped=!!localStorage.getItem(SKIP_KEY); }catch(e){}
      if(known || skipped || !navigator.onLine){ showApp(); syncIdle(); return; }
      showGate("");
    }).catch(function(){ showApp(); syncIdle(); });
  }catch(e){
    showApp(); setSync("off","Sync unavailable — saving on this device only");
  }

  function forceUpdate(){
    if(fatal){ announce(fatal); setTab("week"); return; }   // the message says export — go there
    var m=document.getElementById("syncmsg");
    if(!navigator.onLine){
      m.textContent="Offline — cannot check for updates";
      setTimeout(syncIdle,2600); return;
    }
    m.textContent="Checking for updates…";
    fetch("./version.json?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        if(!j || typeof j.build !== "number"){
          m.textContent="Could not check — try again on signal";
          setTimeout(syncIdle,2600); return;
        }
        if(j.build === BUILD){
          m.textContent="Up to date · b"+BUILD;
          setTimeout(syncIdle,2200);
          return;
        }
        m.textContent="Updating…";
        return purgeAndReload();
      }).catch(function(){ m.textContent="Could not check — try again on signal"; setTimeout(syncIdle,2600); });
  }

  /* Verify the replacement is actually fetchable BEFORE destroying the copy we
     have. Otherwise a flaky connection turns an update into a bricked app. */
  function purgeAndReload(){
    var CODE=["./","./index.html","./app.js","./config.js"];
    return Promise.all(CODE.map(function(u){
      return fetch(u,{cache:"no-store"}).then(function(r){
        if(!r.ok) throw new Error("bad status");
        return r.text().then(function(t){ if(!t) throw new Error("empty"); });
      });
    })).then(function(){
      return (self.caches ? caches.keys().then(function(k){
        return Promise.all(k.map(function(n){ return caches.delete(n); })); }) : Promise.resolve());
    }).then(function(){
      return (navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
        ? navigator.serviceWorker.getRegistrations().then(function(rs){
            return Promise.all(rs.map(function(r){ return r.unregister(); })); })
        : null;
    }).then(function(){ location.reload(); });
  }

  var lastProbe=0;
  function freshen(){
    if(!navigator.onLine) return;
    if(fatal) return;                                 // never reload over an unsaved session
    if(Date.now()-lastProbe < 60000) return;          // one probe a minute, not one a wake
    var rr=(peek(effToday())||{}).run;
    if(local.started && !(rr && rr.en)) return;        // never reload mid-session
    lastProbe=Date.now();
    fetch("./version.json?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if(!j || typeof j.build !== "number" || j.build <= BUILD) return;
        var once="workout.reloaded."+j.build;
        try{ if(sessionStorage.getItem(once)) return; }catch(e){}
        purgeAndReload().then(function(){
          try{ sessionStorage.setItem(once,"1"); }catch(e){}
        }).catch(function(){});
      }).catch(function(){});
  }

  if("serviceWorker" in navigator)
    window.addEventListener("load",function(){
      navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"})
        .then(function(reg){ if(reg && reg.update) reg.update(); })
        .catch(function(){});
      navigator.serviceWorker.addEventListener("controllerchange",function(){
        if(fatal) return;                                  // never reload over an unsaved session
        var rr=(peek(effToday())||{}).run;
        if(local.started && !(rr && rr.en)) return;         // never reload mid-session
        try{ if(!sessionStorage.getItem("workout.swreload")){
          sessionStorage.setItem("workout.swreload","1"); location.reload(); } }catch(e){}
      });
    });
  document.getElementById("sync").addEventListener("click",forceUpdate);
  freshen();
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible") freshen();
  });
})();
