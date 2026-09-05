/* Two In Reserve — training log.
   Prescription lives in PLAN/RULES/REST below; what happened lives in state.days.
   Those are the only two sources of truth. The Plan tab renders from the same
   constants the Day tab does, so the numbers cannot drift apart. */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var REST = { big: 180, other: 90 };

  var PLAN = {
    lowerA: { name: "Lower A", sub: "knee dominant", ex: [
      { id:"hacksquat", n:"Hack Squat",          s:4, lo:6,  hi:10, w:97.6,  step:2.5, big:1, reset:1 },
      { id:"legcurl",   n:"Seated Leg Curl",     s:3, lo:8,  hi:12, w:73,    step:2.5, reset:1 },
      { id:"legext",    n:"Leg Extension",       s:2, lo:12, hi:20, w:null,  step:2.5 },
      { id:"calf",      n:"Calf Press",          s:3, lo:8,  hi:15, w:100.4, step:2.5 },
      { id:"lats",      n:"Lateral Raises",      s:3, lo:10, hi:15, w:10,    step:1 } ] },
    upperA: { name: "Upper A", sub: "push bias", ex: [
      { id:"chestpress",n:"Machine Chest Press", s:4, lo:8,  hi:12, w:59,    step:2.5, big:1 },
      { id:"csrow",     n:"Chest Support Row",   s:3, lo:8,  hi:12, w:59,    step:2.5, big:1, reset:1 },
      { id:"incline",   n:"Incline DB Press",    s:3, lo:8,  hi:12, w:24,    step:2,   big:1 },
      { id:"pushdown",  n:"Triceps Pushdown",    s:3, lo:10, hi:15, w:null,  step:2.5 },
      { id:"reardelt",  n:"Rear Delt Flye",      s:3, lo:12, hi:20, w:null,  step:2.5 },
      { id:"hammer",    n:"Hammer Curl",         s:2, lo:8,  hi:12, w:12,    step:2 } ] },
    lowerB: { name: "Lower B", sub: "hip dominant", ex: [
      { id:"legpress",  n:"Leg Press",           s:4, lo:10, hi:15, w:145.7, step:5, big:1 },
      { id:"legcurl",   n:"Seated Leg Curl",     s:3, lo:8,  hi:12, w:73,    step:2.5, reset:1 },
      { id:"hipthrust", n:"Hip Thrust",          s:2, lo:8,  hi:12, w:62.7,  step:2.5 },
      { id:"adductor",  n:"Adductor",            s:2, lo:10, hi:15, w:66,    step:2.5 },
      { id:"calf",      n:"Calf Press",          s:3, lo:8,  hi:15, w:100.4, step:2.5 },
      { id:"lats",      n:"Lateral Raises",      s:3, lo:10, hi:15, w:10,    step:1 } ] },
    upperB: { name: "Upper B", sub: "pull bias", ex: [
      { id:"pulldown",  n:"Lat Pulldown",        s:3, lo:8,  hi:12, w:73,    step:2.5, big:1 },
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
  var sel = today < BLOCK ? BLOCK : today;

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
    document.getElementById("syncmsg").textContent = msg;
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
  function startRest(ex){
    ensureAudio();
    restTotal = ex.big ? REST.big : REST.other;
    restEnd = Date.now()+restTotal*1000;
    document.getElementById("restwhat").textContent = ex.n;
    document.getElementById("restsub").textContent = ex.big ? "3 minutes — big lift" : "90 seconds";
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
    g.classList.toggle("on", !!(e&&e.g&&e.g[i]));
    g.style.visibility = toFail ? "hidden" : "visible";
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
                  (ds===today?" today":"")+(inBlock(ds)?"":" out");
      if(ds===sel) b.setAttribute("aria-current","date");
      b.innerHTML='<span class="dow">'+DOW[dt.getDay()]+'</span><span class="dnum">'+dt.getDate()+
                  '</span><span class="dot"></span>';
      (function(v){ b.addEventListener("click",function(){ sel=v; stopRest(); closePad(); render(); }); })(ds);
      box.appendChild(b);
    }
  }

  function renderDay(){
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
      sess.ex.forEach(function(ex){ list.appendChild(exCard(ex)); });
      document.getElementById("dayhint").innerHTML =
        "Tap a set to log it. Anything that turned into a grind when it should have stopped two short, mark it on the pad — that is the difference between the app telling you to hold the weight and telling you to drop it.";
    } else {
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
    if(mondayOf(t)>mondayOf(today)) return;
    sel=t; stopRest(); closePad(); render();
  }
  document.getElementById("wprev").addEventListener("click",function(){ go(-7); });
  document.getElementById("wnext").addEventListener("click",function(){ go(7); });
  document.getElementById("wtoday").addEventListener("click",function(){
    sel = today<BLOCK ? BLOCK : today; stopRest(); closePad(); render(); });

  function renderNav(){
    var m=mondayOf(sel), wn=weekNo(m);
    var a=shortD(m), b=shortD(addDays(m,6));
    if(parse(m).getFullYear()!==parse(addDays(m,6)).getFullYear()){
      a+=" "+parse(m).getFullYear(); b+=" "+parse(addDays(m,6)).getFullYear();
    }
    var t=document.getElementById("wtoday");
    t.textContent=(wn<1?"Before the block":"Week "+wn)+" · "+a+" – "+b+(sel===today?" · today":"");
    t.disabled = (sel===today);
    document.getElementById("wprev").disabled = (mondayOf(addDays(sel,-7)) < mondayOf(BLOCK));
    document.getElementById("wnext").disabled = (mondayOf(addDays(sel,7)) > mondayOf(today));
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
    var wasToday=(sel===today);
    today=t;
    if(wasToday) sel = t<BLOCK ? BLOCK : t;
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

  if("serviceWorker" in navigator)
    window.addEventListener("load",function(){ navigator.serviceWorker.register("./sw.js").catch(function(){}); });
})();
