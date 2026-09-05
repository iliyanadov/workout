/* Two In Reserve — training log.
   Prescription lives in PLAN/RULES/REST below; what happened lives in state.days.
   Those are the only two sources of truth. The Plan tab renders from the same
   constants the Day tab does, so the numbers cannot drift apart. */
(function () {
  "use strict";

  var BUILD = 9;
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
  var BLOCK = CFG.blockStart, BLOCK_MON = mondayOf(BLOCK);

  function weekNo(m){ return Math.round((parse(m)-parse(BLOCK_MON))/604800000)+1; }
  function inBlock(d){ return d >= BLOCK; }

  var today = todayISO();
  function effToday(){ return today < BLOCK ? BLOCK : today; }
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
  var state = { v:2, days:{}, pending:{} };
  var sb=null, user=null, inFlight=false, storageWarned=false;

  function loadLocal(){
    try{
      var raw = localStorage.getItem(LS);
      if(raw){ var p=JSON.parse(raw); if(p&&p.days){ state=p; state.pending=state.pending||{}; return; } }
      var old = localStorage.getItem(LS_OLD);
      if(old){ var q=JSON.parse(old); if(q&&q.days){ state={v:2,days:q.days,pending:{}};
        Object.keys(q.days).forEach(function(k){ state.pending[k]=1; }); saveLocal(); } }
    }catch(e){ state={v:2,days:{},pending:{}}; }
  }
  function saveLocal(){
    try{ localStorage.setItem(LS, JSON.stringify(state)); }
    catch(e){ if(!storageWarned){ storageWarned=true; setSync("off","Storage full — copy your week out"); } }
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

  function setSync(cls,msg){
    var e=document.getElementById("sync");
    e.className = "chip" + (cls?" "+cls:"");
    document.getElementById("syncmsg").textContent = msg + "  ·  b" + BUILD;
  }
  function syncIdle(){
    var n=pendingCount();
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
    return sb.from("days").select("day,payload,updated_at").gte("day", BLOCK).then(function(res){
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
    var ks = Object.keys(state.days).filter(function(k){ return k<d; }).sort().reverse();
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
  /* What the card should show as today's load, and why. Pure — writes nothing. */
  function planned(d,ex){
    var own = peekEx(d,ex.id);
    if(own && own.w!=null) return { w:own.w, from:null };
    var prev = lastDone(d,ex.id);
    if(!prev) return { w:ex.w, from:null };
    var base = prev.e.w!=null ? prev.e.w : ex.w;
    var earned = prev.got.length>=ex.s && prev.got[prev.got.length-1] >= ex.hi;
    if(earned && base!=null) return { w:Math.round((base+ex.step)*10)/10, from:base, on:prev.d };
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
    if(a.state==="suspended") a.resume();
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
  function startRest(ex,secs){
    ensureAudio();
    restTotal = secs || (ex.big ? REST.big : REST.other);
    restEnd = Date.now()+restTotal*1000;
    document.getElementById("restwhat").textContent = ex.n;
    document.getElementById("restsub").textContent = restTotal>=180 ? "3 minutes — big lift" : restTotal+" seconds";
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
      holdScreen(false);
    }
  }
  function stopRest(){
    document.getElementById("rest").classList.remove("on","done");
    if(restTick){ clearInterval(restTick); restTick=null; }
    holdScreen(false);
  }
  document.getElementById("restskip").addEventListener("click", stopRest);

  /* ---------------- rep pad ---------------- */
  var padCtx=null;

  /* The sheet has three faces. Which one opens is decided by the set, never
     by the user: a held-back big-lift set gets the three-button shortcut, a
     failure set gets the grid, and a big-lift set that has just been given a
     number gets the reserve question. */
  function openLog(ex,i){
    padCtx={ex:ex,i:i};
    var target=stopTarget(sel,ex,i);
    if(target!=null) padShort(ex,i,target);
    else padGrid(ex,i,null);
    document.getElementById("pad").classList.add("on");
  }

  function padHead(a,b){
    document.getElementById("padwhat").textContent=a;
    document.getElementById("padrange").textContent=b;
  }
  function padRows(list){
    var g=document.getElementById("padgrid");
    g.className="padstack"; g.innerHTML="";
    list.forEach(function(o){
      var b=el("button","bigopt"+(o.cls?" "+o.cls:""),o.t); b.type="button";
      b.addEventListener("click",o.fn); g.appendChild(b);
    });
    document.getElementById("padgrind").classList.add("hidden");
    document.getElementById("padclear").classList.remove("hidden");
  }

  function padShort(ex,i,target){
    padHead(ex.n+" · set "+(i+1), "target "+target);
    padRows([
      { t:target+" — and I had two left", cls:"go",
        fn:function(){ logSet(ex,i,target,2); } },
      { t:target+" — but that was everything", cls:"amber",
        fn:function(){ logSet(ex,i,target,0); } },
      { t:"A different number", cls:"ghost",
        fn:function(){ padGrid(ex,i,target); } }
    ]);
  }

  function padGrid(ex,i,target){
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
    document.getElementById("padclear").classList.remove("hidden");
  }

  /* Fires only on big lifts — 3 or 4 times a session, exactly where this
     lifter fails. All three answers are styled identically on purpose: the
     moment honesty is punished visually, the data dies. */
  function padQuestion(ex,i,v){
    padCtx={ex:ex,i:i};
    if(i===ex.s-1){
      padHead(ex.n+" · set "+(i+1), "you logged "+v);
      padRows([
        { t:"Yes, that was everything", cls:"go",  fn:function(){ logSet(ex,i,v,0); } },
        { t:"No, I racked it early",    cls:"ghost", fn:function(){ logSet(ex,i,v,2); } }
      ]);
      document.getElementById("padwhat").textContent="Was that true failure?";
      return;
    }
    padHead("Could you have done two more?", "you logged "+v);
    padRows([
      { t:"More than two left",       cls:"opt", fn:function(){ logSet(ex,i,v,3); } },
      { t:"About two — stopped on it",cls:"opt", fn:function(){ logSet(ex,i,v,2); } },
      { t:"Nothing left — that was failure", cls:"opt", fn:function(){ logSet(ex,i,v,0); } }
    ]);
  }

  function openPad(ex,i){
    padCtx={ex:ex,i:i};
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
    g.classList.remove("hidden");
    g.classList.toggle("on", !!(e&&e.g&&e.g[i]));
    g.style.visibility = toFail ? "hidden" : "visible";
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
  document.getElementById("padclear").addEventListener("click",function(){
    if(!padCtx){ closePad(); return; }
    var rec=entry(sel,padCtx.ex.id);
    if(rec.r) rec.r[padCtx.i]=null;
    touch(); closePad(); renderDay();
  });
  document.getElementById("padgrind").addEventListener("click",function(){
    if(!padCtx) return;
    var rec=entry(sel,padCtx.ex.id);
    rec.g=rec.g||[]; rec.g[padCtx.i]=!rec.g[padCtx.i];
    this.classList.toggle("on", !!rec.g[padCtx.i]);
    touch(); renderDay();
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
      if(prev && prev.e.nt!=null) return clamp(prev.e.nt, ex.lo, ex.hi+4);
      if(!prev) return ex.hi-1;
      var est=estFailure(prev.got[0], (prev.e.q||[])[0]);
      var t=est-2;
      var pw=planned(d,ex).w, ow=prev.e.w!=null?prev.e.w:ex.w;
      if(pw!=null && ow!=null && pw>ow) t-=1;
      t=clamp(t, ex.lo, ex.hi+4);
      return clamp(t, prev.got[0]-2, prev.got[0]+2);
    }
    var rec=peekEx(d,ex.id)||{};
    var r=(rec.r||[])[i-1], a=(rec.q||[])[i-1];
    if(r==null||r==="") return ex.hi-1;
    var t2 = a===3 ? r+2 : a===0 ? r-2 : r;
    return clamp(t2, ex.lo, ex.hi+4);
  }

  function rampFor(d){
    var order=sessionOrder(d); if(!order.length) return null;
    var ex=order[0]; if(!ex.big||ex.w==null) return null;
    var w=planned(d,ex).w; if(w==null) return null;
    function rnd(p){ var v=Math.round(w*p/ex.step)*ex.step; return Math.round(v*10)/10; }
    return { ex:ex, rows:[ {w:rnd(.5),reps:8,why:"half the working weight — should feel like nothing"},
                           {w:rnd(.75),reps:5,why:"the last rep should still be easy"} ], top:w };
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
    var short=false, need=restFor(ex)*0.75;
    for(var j=0;j<t.length;j++) if(t[j]!=null && t[j]<need) short=true;
    if(short) return { c:2, n:n,
      line:"You cut the rest between sets. That is cause two. Take the full "+(restFor(ex)/60===3?"three minutes":"ninety seconds")+" before you blame the weight." };
    return { c:3, n:n,
      line:"Effort held, rest timed, and still that much drop-off. Noted — one exercise is noise. If it repeats next time the weight comes down. Not before." };
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
    var rec=entry(sel,ex.id);
    if(rec.w==null) rec.w=planned(sel,ex).w;
    rec.r=rec.r||[]; rec.r[i]=v;
    if(q!=null){ rec.q=rec.q||[]; rec.q[i]=q; rec.g=rec.g||[]; rec.g[i]=(q===0); }
    touch();
    closePad();
    if(exDone(sel,ex)){
      var dc=dropCause(sel,ex);
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
      (!inBlock(sel) ? "Starts "+shortD(BLOCK) : "Week "+wn) + " · " + pretty(sel);

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
      list.appendChild(el("div","empty","The block starts "+pretty(BLOCK)+". Nothing to log before then."));
      document.getElementById("dayhint").textContent="";
      return;
    }

    if(sess){
      var strip=document.createElement("button");
      strip.className="rulestrip";
      strip.innerHTML = sess.ex.some(function(e){return e.big;})
        ? "Every set but the last stops with <b>two reps still in you</b>. The last set goes to failure."
        : "<b>Every set to failure today.</b> All accessories — low fatigue cost, so no reason to hold back.";
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
      document.getElementById("dayhint").innerHTML =
        "Tap a set to log it. Anything that turned into a grind when it should have stopped two short, mark it on the pad — that is the difference between the app telling you to hold the weight and telling you to drop it.";
    } else {
      if(listMode && sel===effToday()){
        var back=el("button","quietbtn","Back to the guided session");
        back.addEventListener("click",function(){ listMode=false; render(); });
        list.appendChild(back);
      }
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
      "Last "+pretty(prev.d)+" · "+(prev.e.w!=null?prev.e.w+" kg":"bodyweight")+" · "+prev.got.join(" / ")));

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
    minus.addEventListener("click",function(){
      var cur = parseFloat(wi.value); if(isNaN(cur)) cur = pl.w!=null?pl.w:0;
      setW(Math.max(0, cur-ex.step));
    });
    plus.addEventListener("click",function(){
      var cur = parseFloat(wi.value); if(isNaN(cur)) cur = pl.w!=null?pl.w:0;
      setW(cur+ex.step);
    });
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
      if(ex.big && got.length>=2)
        foot.appendChild(el("span","pill "+(drop<=3?"good":"bad"), drop<=3?"holding":"dropping off"));
      var last=got[got.length-1];
      if(got.length===ex.s && last>=ex.hi) foot.appendChild(el("span","pill up","goes up next time"));
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
    if(!local.started && cnt.done===0){ box.appendChild(startCard(sess,order,cnt)); return; }

    /* CAPTURES */
    if(local.capturing){ box.appendChild(capturesCard()); return; }

    /* run header */
    box.appendChild(runHeader(sess,cnt));

    /* warm-up */
    var ramp=rampFor(sel);
    if(ramp && !local.warmSkipped && (local.warmTicks||[]).filter(Boolean).length < 3)
      box.appendChild(warmCard(ramp));
    else if(ramp) box.appendChild(tickLine(local.warmSkipped?"– Warm-up skipped":"✓ Warm-up", ""));

    /* the column */
    order.forEach(function(ex,j){
      if(skipped(sel,ex)){ box.appendChild(tickLine("– "+ex.n,"skipped")); return; }
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
  }

  function runHeader(sess,cnt){
    var h=el("div","runhead");
    h.appendChild(el("div","runname",sess.name));
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
    c.appendChild(el("div","bigtitle",sess.name));
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
    if(!warn && wn<=3) warn="Weeks one to three are calibration. The weights are deliberately light. Do not fix that.";
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
    c.appendChild(quiet("Log it yourself instead",function(){ listMode=true; render(); }));
    return c;
  }

  function warmCard(ramp){
    var c=el("div","card warm");
    c.appendChild(el("div","kicker","Warm up · about 4 min"));
    c.appendChild(el("div","warnline","Without this, set 1 is the warm-up — and set 1 is the set you keep taking to failure."));
    var ticks=local.warmTicks||[];
    var rows=[{t:"2 minutes. Bike, walk, stairs.",w:null}]
      .concat(ramp.rows.map(function(r){ return {t:ramp.ex.n+" · "+r.w+" kg × "+r.reps, w:r.why}; }));
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
    head.appendChild(el("div","cardname",ex.n));
    head.appendChild(el("div","cardtag",ex.big?"BIG LIFT":"ACCESSORY"));
    c.appendChild(head);

    /* weight row */
    var wr=el("div","wrow2");
    if(ex.bw){ wr.appendChild(el("div","wbig","Bodyweight")); }
    else{
      var minus=el("button","wbtn","−"); minus.type="button"; minus.setAttribute("aria-label","Less weight");
      var val=el("div","wbig",(pl.w==null?"—":pl.w)+" kg");
      var plus=el("button","wbtn","+"); plus.type="button"; plus.setAttribute("aria-label","More weight");
      minus.addEventListener("click",function(){ var r=entry(sel,ex.id);
        r.w=Math.max(0,Math.round(((pl.w||0)-ex.step)*10)/10); touch(); render(); });
      plus.addEventListener("click",function(){ var r=entry(sel,ex.id);
        r.w=Math.round(((pl.w||0)+ex.step)*10)/10; touch(); render(); });
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
    if(pl.from!=null){
      var bump=el("div","bumped");
      bump.appendChild(el("span","","Earned it "+shortD(pl.on)+" · "+pl.from+" → "+pl.w+" kg"));
      var undo=el("button",null,"Keep "+pl.from);
      undo.addEventListener("click",function(){ var r=entry(sel,ex.id); r.w=pl.from; touch(); render(); });
      bump.appendChild(undo); c.appendChild(bump);
    }

    if(target!=null){
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
    if(prev && pl.from==null)
      c.appendChild(el("div","lastline","Last "+pretty(prev.d)+" · "+(prev.e.w!=null?prev.e.w+" kg":"bodyweight")+" · "+prev.got.join(" / ")));

    /* rest panel, or the log button */
    if(restShown() && local.restExId===ex.id) c.appendChild(restPanel(ex,i));
    else c.appendChild(bigBtn("Done — log set "+(i+1),"go",function(){ openLog(ex,i); }));

    var row=el("div","cardfoot");
    row.appendChild(quiet("Machine taken",function(){
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
    if(i===0 && !lastDone(sel,ex.id)) return "First time at this weight. "+target+" comes from the range, not from how you feel.";
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
      ? "Rest. "+(local.restSecs>=180?"Three minutes — big lift.":"Ninety seconds.")
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

  function dropCard(ex){
    var dc=dropCause(sel,ex); if(!dc){ local.dropFor=null; saveRun(); return el("div",""); }
    var got=reps(peekEx(sel,ex.id));
    var c=el("div","card drop");
    c.appendChild(el("div","dropnums",got.join(" · ")));
    c.appendChild(el("div","cardname",ex.n));
    if(got[0]-got[got.length-1]>3)
      c.appendChild(el("div","warnline","That is one working set and the rest that do not count."));
    c.appendChild(el("div","dropline",dc.line));
    c.appendChild(bigBtn("Next time I stop at "+dc.n,"amber",function(){
      var r=entry(sel,ex.id); r.nt=dc.n; touch();
      local.dropFor=null; saveRun();
      var nx=cursor(sel);
      if(nx) beginRest(ex,ex.s-1,restFor(ex));
      render();
    }));
    return c;
  }

  function finishCard(order,cnt){
    var c=el("div","card finish");
    var st=weekStats(mondayOf(sel));
    c.appendChild(el("div","bigtitle",sessionOf(sel).name+" — done"));
    var mins = (peek(sel)&&peek(sel).run&&peek(sel).run.st)
      ? Math.round((Date.now()-peek(sel).run.st)/60000) : null;
    c.appendChild(el("div","meta2",cnt.done+" of "+cnt.total+" sets"+(mins?" · "+mins+" minutes":"")));

    var held=0,tot=0,bad=[];
    order.forEach(function(ex){
      var rec=peekEx(sel,ex.id); if(!rec) return;
      var got=reps(rec); if(got.length<2||!ex.big) return;
      tot++; if(got[0]-got[got.length-1]<=3) held++; else bad.push(ex.n+" went "+got.join(" / "));
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
      if(got.length>=ex.s && got[got.length-1]>=ex.hi && (rec.q||[])[got.length-1]!==2)
        ups.push(ex.n+"  "+(rec.w!=null?rec.w+" → "+Math.round((rec.w+ex.step)*10)/10+" kg":"next notch up"));
    });
    if(ups.length){
      c.appendChild(el("h2","sec","Goes up next time"));
      ups.forEach(function(u){ c.appendChild(el("div","upline",u)); });
    }

    c.appendChild(el("h2","sec","One thing for next time"));
    c.appendChild(el("div","onething",oneThing(order)));
    c.appendChild(bigBtn("Nearly done — three questions","go",function(){
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
    if(rec.bw==null && wk.bws.length<3){
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

    if(rec.p==null){
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
      touch(); local.capturing=0; saveRun(); render(); window.scrollTo(0,0);
    }));
    return c;
  }

  function doneCard(order){
    var c=el("div","card donecard");
    var rec=peek(sel)||{};
    c.appendChild(el("div","bigtitle",sessionOf(sel).name+" · complete"));
    var mins=(rec.run&&rec.run.st&&rec.run.en)?Math.round((rec.run.en-rec.run.st)/60000):null;
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
    return c;
  }

  function nextSessionHint(){
    for(var i=1;i<=7;i++){
      var d=addDays(sel,i), s=sessionOf(d);
      if(!s) continue;
      var first=null; s.ex.forEach(function(e){ if(!first&&e.big) first=e; });
      if(!first) return "Next — "+s.name+", "+(i===1?"tomorrow":pretty(d))+".";
      var t=stopTarget(d,first,0), w=planned(d,first).w;
      return "Next — "+s.name+", "+(i===1?"tomorrow":pretty(d))+". "+first.n+" "+(w!=null?w+" kg":"")+
             (t!=null?", set 1 stops at "+t+".":".");
    }
    return null;
  }

  function doneLine(ex){
    var rec=peekEx(sel,ex.id)||{}, got=reps(rec);
    var drop=got.length>=2?got[0]-got[got.length-1]:0;
    var bad=ex.big&&got.length>=2&&drop>3;
    var l=el("button","line done"+(bad?" bad":""));
    l.type="button";
    l.appendChild(el("span","lmark",bad?"!":"✓"));
    l.appendChild(el("span","lname",ex.n));
    l.appendChild(el("span","lw",rec.w!=null?rec.w+" kg":""));
    l.appendChild(el("span","lreps",got.join(" / ")));
    var tag = rec.fin && got.length<ex.s ? got.length+" of "+ex.s+" sets"
            : (got.length>=ex.s && got[got.length-1]>=ex.hi) ? "goes up"
            : bad ? "dropping off" : (ex.big&&got.length>=2?"holding":"");
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
    l.appendChild(el("span","ltag",ex.s+" × "+ex.lo+"–"+ex.hi));
    l.addEventListener("click",function(){
      var r=day(sel), ord=sessionOrder(sel).map(function(e){return e.id;});
      ord.splice(ord.indexOf(ex.id),1); 
      var cur=cursor(sel);
      ord.splice(cur?ord.indexOf(cur.ex.id):0,0,ex.id);
      r.ord=ord; touch(); clearRest(false); render();
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
        if(ex.big && got.length>=2){ total++; if(drop<=3) held++; }
        if(got.length===ex.s && got[got.length-1]>=ex.hi)
          ups.push({n:ex.n,from:e.w,step:ex.step,last:got[got.length-1]});
        if(ex.big && got.length>=2 && drop>3)
          watch.push({n:ex.n,reps:got,grind:(e.g||[]).some(Boolean)});
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

    box.appendChild(el("h2","sec","Goes up next time"));
    if(st.ups.length){
      var u=el("div","stat");
      st.ups.forEach(function(x){
        var r=el("div","sessline");
        r.appendChild(el("span","sesslab", x.from!=null? x.from+" kg":"—"));
        r.appendChild(el("span","reps","→ "+(x.from!=null?(Math.round((x.from+x.step)*10)/10)+" kg":"next notch")));
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
        body.push("  "+ex.n+" "+(e.w!=null?e.w+"kg":"BW")+" — "+got.join(" "));
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
    if(box.dataset.built==="1") return;
    box.innerHTML="";
    document.getElementById("hctxt").textContent="The plan";
    document.getElementById("hctxs").textContent="4 days · upper/lower · leg priority";

    var intro=el("div","stat");
    intro.appendChild(el("div","statlab","The block"));
    intro.appendChild(el("div","statnote",
      "Four days a week, upper/lower, two leg days because legs are the priority. Monday Lower A, Tuesday Upper A, Thursday Lower B, Friday Upper B. Starts "+pretty(BLOCK)+"."));
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
    if(t<BLOCK) t=BLOCK;
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
    document.getElementById("wprev").disabled = (mondayOf(addDays(sel,-7)) < mondayOf(BLOCK));
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
    var wasToday=(sel===effToday());
    today=t;
    if(wasToday) sel = effToday();
    loadLocal2(); listMode=false;
    if(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    render();
  }
  setInterval(checkRollover,60000);
  window.addEventListener("focus",checkRollover);
  window.addEventListener("pageshow",checkRollover);
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"){ checkRollover(); pull(); }
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
          ? "No log found for that address. Check the spelling."
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
    showApp(); syncIdle();
  });

  /* ---------------- boot ---------------- */
  loadLocal();
  loadLocal2();
  render();
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
      if(known || !navigator.onLine){ showApp(); syncIdle(); return; }
      showGate("");
    }).catch(function(){ showApp(); syncIdle(); });
  }catch(e){
    showApp(); setSync("off","Offline — saving on this device only");
  }

  function forceUpdate(){
    var m=document.getElementById("syncmsg");
    if(!navigator.onLine){ m.textContent="Offline — cannot check for updates"; return; }
    m.textContent="Checking for updates…";
    fetch("./version.json?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        if(j && j.build === BUILD){
          m.textContent="Up to date · b"+BUILD;
          setTimeout(syncIdle,2200);
          return;
        }
        m.textContent="Updating…";
        return purgeAndReload();
      }).catch(function(){ m.textContent="Could not check — try again on signal"; setTimeout(syncIdle,2600); });
  }

  function purgeAndReload(){
    return (self.caches ? caches.keys().then(function(k){
        return Promise.all(k.map(function(n){ return caches.delete(n); })); }) : Promise.resolve())
      .then(function(){
        return (navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
          ? navigator.serviceWorker.getRegistrations().then(function(rs){
              return Promise.all(rs.map(function(r){ return r.unregister(); })); })
          : null;
      })
      .then(function(){ location.reload(); })
      .catch(function(){ location.reload(); });
  }

  function freshen(){
    if(!navigator.onLine) return;
    fetch("./version.json?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if(!j || j.build === BUILD) return;
        var once="workout.reloaded."+j.build;
        try{ if(sessionStorage.getItem(once)) return; sessionStorage.setItem(once,"1"); }catch(e){}
        purgeAndReload();
      }).catch(function(){});
  }

  if("serviceWorker" in navigator)
    window.addEventListener("load",function(){
      navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"})
        .then(function(reg){ if(reg && reg.update) reg.update(); })
        .catch(function(){});
      navigator.serviceWorker.addEventListener("controllerchange",function(){
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
