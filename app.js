(function() {
  'use strict';

  const META = {
    'Comercializacion de eventos': { icon:'🎯', cls:'events', btn:'btn-primary', fill:'blue' },
    'Estructura del mercado turístico': { icon:'🌍', cls:'estructura', btn:'btn-emerald', fill:'emerald' },
    'Gestión del departamento de pisos': { icon:'🛏️', cls:'pisos', btn:'btn-amber', fill:'amber' },
    'Itinerario personal para la empleabilidad I': { icon:'💼', cls:'empleabilidad', btn:'btn-violet', fill:'violet' }
  };
  const UL = {'U1':'Unidad 1','U2':'Unidad 2','U3':'Unidad 3','U4':'Unidad 4','U5':'Unidad 5','U6':'Unidad 6','U7':'Unidad 7','U8':'Unidad 8','U9':'Unidad 9','Semestral':'Semestral'};

  let Q=[], S={view:'intro',sub:null,unit:null,idx:0,ans:{},shuf:[],errMode:false,errQ:[]};
  const el=document.getElementById('app');
  let modalCallback=null;

  function showIntro(){el.innerHTML=`<div class="intro"><div class="intro-content"><div class="intro-icon">🎓</div><h1 class="gradient-text">Test Practica</h1><p>Practica los test de tu ciclo formativo</p><button class="intro-btn" onclick="App.startApp()">Comenzar</button></div></div>`}
  function startApp(){showLoader();loadData()}
  function showLoader(){el.innerHTML='<div class="loader"><div class="loader-inner"><div class="spinner"></div><p>Cargando preguntas...</p></div></div>'}
  function loadData(){fetch('questions.json').then(r=>r.json()).then(d=>{Q=d;S.view='home';render()}).catch(()=>{el.innerHTML='<div class="loader"><div class="loader-inner"><p style="color:#fda4af">Error cargando preguntas</p><button class="btn btn-primary" onclick="App.startApp()" style="margin-top:12px">Reintentar</button></div></div>'})}
  function showModal(icon,title,text,confirmText,cancelText,onConfirm){modalCallback=onConfirm;el.insertAdjacentHTML('beforeend',`<div class="modal-overlay" onclick="App.closeModal(event)"><div class="modal" onclick="event.stopPropagation()"><div class="modal-icon">${icon}</div><h3>${title}</h3><p>${text}</p><div class="modal-btns"><button class="btn btn-ghost" onclick="App.closeModal()">${cancelText}</button><button class="btn btn-danger" onclick="App.confirmModal()">${confirmText}</button></div></div></div>`)}
  function closeModal(e){if(e&&e.target!==e.currentTarget)return;const m=document.querySelector('.modal-overlay');if(m)m.remove();modalCallback=null}
  function confirmModal(){if(modalCallback)modalCallback();closeModal()}

  function subs(){const m={};Q.forEach(q=>{if(!m[q.subject])m[q.subject]=new Set();m[q.subject].add(q.unit)});return Object.entries(m).map(([n,u])=>({name:n,units:[...u].sort((a,b)=>(parseInt(a.replace('U',''))||(a==='Semestral'?99:0))-(parseInt(b.replace('U',''))||(b==='Semestral'?99:0)))}))}
  function qs(sub,u){const g=Q.find(q=>q.subject===sub&&q.unit===u);return g?g.questions:[]}
  function allQs(sub){return Q.filter(q=>q.subject===sub).flatMap(q=>q.questions)}
  function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
  function st(sub,u){const v=localStorage.getItem('ts_'+sub+'|'+u);return v?JSON.parse(v):{c:0,i:0,t:0,e:[]}}
  function sv(sub,u,s){localStorage.setItem('ts_'+sub+'|'+u,JSON.stringify(s))}
  function gst(){let c=0,i=0,t=0;subs().forEach(s=>s.units.forEach(u=>{const x=st(s.name,u);c+=x.c;i+=x.i;t+=x.t}));return{c,i,t}}
  function mt(sub){return META[sub]||{icon:'📚',cls:'events',btn:'btn-primary',fill:'blue'}}
  function esc(s){return s.replace(/'/g,"\\'")}

  function ring(sz,r,pct,col){
    const c=2*Math.PI*r;
    return `<div class="ring-wrap" style="width:${sz}px;height:${sz}px"><svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><circle class="ring-bg" cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke-width="${sz>100?8:6}"/><circle class="ring-fill" cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sz>100?8:6}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct/100)}" stroke-linecap="round"/></svg><div class="ring-pct" style="font-size:${sz>100?1.5:0.875}rem">${pct}%</div></div>`;
  }

  function render(){
    switch(S.view){
      case'home':rHome();break;case'subject':rSub();break;case'quiz':rQuiz();break;
      case'results':rRes();break;case'errors':rErr();break;case'stats':rStats();break;
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function rHome(){
    const ss=subs(),g=gst(),pct=g.t>0?Math.round(g.c/g.t*100):0;
    el.innerHTML=`<div class="fade-in"><div class="container">
      <div class="header"><h1 class="gradient-text">Test Practica</h1><p>Practica los test de tu ciclo formativo de Alojamiento</p></div>
      ${g.t>0?`<div class="glass global-bar">${ring(64,26,pct,'#3b82f6')}<div class="info"><h3>Progreso Global</h3><div class="counts"><span class="ok">${g.c} correctas</span><span class="err">${g.i} incorrectas</span><span class="tot">${g.t} respondidas</span></div></div><button class="btn btn-ghost" onclick="App.viewStats()">📊 Estadísticas</button></div>`:''}
      <div class="grid2">${ss.map(s=>{const m=mt(s.name),tq=s.units.reduce((a,u)=>a+qs(s.name,u).length,0),us=s.units.map(u=>st(s.name,u)),tc=us.reduce((a,b)=>a+b.c,0),ta=us.reduce((a,b)=>a+b.t,0),ti=us.reduce((a,b)=>a+b.i,0),up=ta>0?Math.round(tc/ta*100):0;
        return`<div class="card glass ${m.cls}" onclick="App.selectSubject('${esc(s.name)}')" style="cursor:pointer"><div class="card-inner"><span class="card-icon">${m.icon}</span><div><div class="card-title">${s.name}</div><div class="card-sub">${s.units.length} unidades · ${tq} preguntas</div>${ta>0?`<div class="progress-track"><div class="progress-fill ${m.fill}" style="width:${up}%"></div></div><div class="stat-row"><span class="ok">${tc} ✓</span><span class="err">${ti} ✗</span></div>`:''}</div></div></div>`}).join('')}</div>
    </div></div>`;
  }

  function rSub(){
    const sub=S.sub,m=mt(sub),sd=subs().find(s=>s.name===sub);
    if(!sd){S.view='home';render();return}
    const aq=allQs(sub),us=sd.units.map(u=>st(sub,u)),tc=us.reduce((a,b)=>a+b.c,0),ta=us.reduce((a,b)=>a+b.t,0),ti=us.reduce((a,b)=>a+b.i,0),te=us.reduce((a,b)=>a+b.e.length,0),pct=ta>0?Math.round(tc/ta*100):0;
    el.innerHTML=`<div class="fade-in"><div class="container">
      <button class="back" onclick="App.goHome()">← Volver</button>
      <div class="glass subject-header" style="display:flex;align-items:center;gap:16px;margin-bottom:20px"><span class="icon">${m.icon}</span><div><h1>${sub}</h1><div class="sub">${aq.length} preguntas en total</div></div></div>
      ${ta>0?`<div class="stat-cards"><div class="stat-card"><div class="val" style="color:#6ee7b7">${tc}</div><div class="lbl">Correctas</div></div><div class="stat-card"><div class="val" style="color:#fda4af">${ti}</div><div class="lbl">Incorrectas</div></div><div class="stat-card"><div class="val" style="color:#60a5fa">${pct}%</div><div class="lbl">Aciertos</div></div></div>`:''}
      <div class="btn-row"><button class="btn ${m.btn}" onclick="App.startAllUnits('${esc(sub)}')">🔀 Mezcla todas</button>${te>0?`<button class="btn btn-danger" onclick="App.reviewErrors('${esc(sub)}')">❗ Repasar errores (${te})</button>`:''}</div>
      <div class="section-title">Unidades</div>
      <div class="grid2">${sd.units.map(u=>{const q=qs(sub,u),s=st(sub,u),up=s.t>0?Math.round(s.c/s.t*100):0,bc=s.t>0?(up>=70?'badge-green':up>=40?'badge-yellow':'badge-red'):'badge-gray';
        return`<div class="glass2 unit-card" onclick="App.selectUnit('${esc(sub)}','${u}')"><div class="top"><span class="name">${UL[u]||u}</span><span class="badge ${bc}">${s.t>0?up+'%':'Sin hacer'}</span></div><div class="count">${q.length} preguntas</div>${s.t>0?`<div class="progress-track"><div class="progress-fill ${m.fill}" style="width:${up}%"></div></div><div class="stat-row"><span class="ok">${s.c} ✓</span><span class="err">${s.i} ✗</span></div>`:''}</div>`}).join('')}</div>
    </div></div>`;
  }

  function rQuiz(){
    const qa=S.errMode?S.errQ:S.shuf;
    if(!qa.length){S.view='home';render();return}
    const q=qa[S.idx],tot=qa.length,cur=S.idx+1,pct=Math.round(cur/tot*100),ans=S.ans[S.idx]!==undefined,sel=S.ans[S.idx],ok=ans&&sel===q.correctAnswer,m=mt(S.sub),ul=S.errMode?'Repaso de errores':(UL[S.unit]||S.unit);
    el.innerHTML=`<div class="fade-in" style="min-height:100vh;display:flex;flex-direction:column"><div class="container" style="flex:1;display:flex;flex-direction:column">
      <div class="quiz-header"><button class="exit-btn" onclick="App.exitQuiz()">✕ Salir</button><div class="meta">${S.sub} · ${ul}</div><span class="counter">${cur}/${tot}</span></div>
      <div class="quiz-progress"><div class="progress-fill ${m.fill}" style="width:${pct}%"></div></div>
      <div class="glass quiz-body" style="flex:1"><h2>${q.question}</h2>
        <div class="options">${q.options.map(opt=>{let c='option';if(ans){c+=' disabled';if(opt===q.correctAnswer)c+=' correct';else if(opt===sel&&opt!==q.correctAnswer)c+=' incorrect'}else if(sel===opt)c+=' selected';
          return`<div class="${c}" onclick="App.answer('${esc(opt)}')"><span class="letter">${opt.charAt(0)}</span><span class="text">${opt.substring(3)}</span></div>`}).join('')}</div>
        ${ans?`<div class="feedback ${ok?'ok':'err'}"><div class="fb-label">${ok?'✅ ¡Correcto!':'❌ Incorrecto'}</div>${!ok?`<div class="fb-correct">La respuesta correcta es: <span>${q.correctAnswer}</span></div>`:''}</div>`:''}</div>
      <div class="quiz-nav"><button class="btn btn-ghost" ${S.idx===0?'disabled style="opacity:0.3"':''} onclick="App.prevQuestion()">← Anterior</button>
        ${ans&&S.idx<tot-1?`<button class="btn ${m.btn}" onclick="App.nextQuestion()">Siguiente →</button>`:ans&&S.idx===tot-1?`<button class="btn ${m.btn} pulse-glow" onclick="App.finishQuiz()">Ver resultados 🏁</button>`:`<span class="hint">Selecciona una respuesta</span>`}</div>
    </div></div>`;
  }

  function rRes(){
    const qa=S.errMode?S.errQ:S.shuf,tot=qa.length;let c=0,i=0;const er=[];
    qa.forEach((q,idx)=>{if(S.ans[idx]===q.correctAnswer)c++;else{i++;er.push({question:q.question,yourAnswer:S.ans[idx],correctAnswer:q.correctAnswer,options:q.options})}});
    const pct=Math.round(c/tot*100),m=mt(S.sub),emoji=pct>=90?'🏆':pct>=70?'🎉':pct>=50?'💪':pct>=30?'📚':'🔄',msg=pct>=90?'¡Excelente!':pct>=70?'¡Muy bien!':pct>=50?'¡Buen intento!':pct>=30?'Sigue practicando':'Necesitas repasar',col=pct>=70?'#10b981':pct>=40?'#f59e0b':'#f43f5e';
    if(!S.errMode&&S.unit&&S.unit!=='all'){const s=st(S.sub,S.unit);s.c+=c;s.i+=i;s.t+=tot;er.forEach(e=>{if(!s.e.find(x=>x.question===e.question))s.e.push(e)});sv(S.sub,S.unit,s)}
    el.innerHTML=`<div class="fade-in"><div class="container">
      <div class="glass result-center"><div class="big-icon">${emoji}</div><h1 class="gradient-text">${msg}</h1><div class="sub">${S.sub} · ${S.errMode?'Repaso de errores':(UL[S.unit]||S.unit)}</div>${ring(110,46,pct,col)}
        <div class="result-stats"><div class="result-stat"><div class="val" style="color:#6ee7b7">${c}</div><div class="lbl">Correctas</div></div><div class="result-stat"><div class="val" style="color:#fda4af">${i}</div><div class="lbl">Incorrectas</div></div><div class="result-stat"><div class="val" style="color:#60a5fa">${tot}</div><div class="lbl">Total</div></div></div></div>
      ${er.length>0?`<div class="errors-section"><div class="errors-title">❗ Errores (${er.length})</div>${er.map((e,i)=>`<div class="glass error-item slide-up" style="animation-delay:${i*0.03}s"><div class="q">${e.question}</div>${e.yourAnswer?`<div class="yours">Tu respuesta: ${e.yourAnswer}</div>`:''}<div class="correct">Correcta: ${e.correctAnswer}</div></div>`).join('')}</div>`:`<div class="glass perfect"><div class="icon">🌟</div><p>¡Todas las respuestas correctas!</p></div>`}
      <div class="btn-row" style="justify-content:center"><button class="btn ${m.btn}" onclick="App.retryQuiz()">🔀 Reintentar</button>${er.length>0?`<button class="btn btn-danger" onclick="App.retryErrors()">❗ Repasar errores</button>`:''}<button class="btn btn-ghost" onclick="App.goSubject()">← Asignatura</button><button class="btn btn-ghost" onclick="App.goHome()">🏠 Inicio</button></div>
    </div></div>`;
  }

  function rErr(){
    const sub=S.sub,sd=subs().find(s=>s.name===sub);if(!sd){S.view='home';render();return}
    let ae=[];sd.units.forEach(u=>{const s=st(sub,u);s.e.forEach(e=>ae.push({...e,unit:u}))});const m=mt(sub);
    el.innerHTML=`<div class="fade-in"><div class="container">
      <button class="back" onclick="App.goSubject()">← Volver</button>
      <h1 style="font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:4px">❗ Errores acumulados</h1>
      <p style="color:var(--text2);font-size:0.8125rem;margin-bottom:20px">${sub} · ${ae.length} errores guardados</p>
      ${ae.length===0?`<div class="glass" style="padding:32px;text-align:center"><p style="font-size:2rem">✨</p><p style="color:#6ee7b7;font-weight:600;margin-top:8px">¡No tienes errores guardados!</p></div>`
      :`<button class="btn ${m.btn}" onclick="App.reviewErrors('${esc(sub)}')" style="margin-bottom:16px">🔀 Practicar estos errores</button><div style="display:flex;flex-direction:column;gap:8px">${ae.map(e=>`<div class="glass error-item"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px"><div class="q">${e.question}</div><span class="badge badge-gray">${UL[e.unit]||e.unit}</span></div>${e.yourAnswer?`<div class="yours">Tu respuesta: ${e.yourAnswer}</div>`:''}<div class="correct">Correcta: ${e.correctAnswer}</div></div>`).join('')}</div>`}
    </div></div>`;
  }

  function rStats(){
    const ss=subs(),g=gst(),pct=g.t>0?Math.round(g.c/g.t*100):0;
    el.innerHTML=`<div class="fade-in"><div class="container">
      <button class="back" onclick="App.goHome()">← Volver al inicio</button>
      <h1 class="gradient-text" style="font-size:1.5rem;font-weight:800;margin-bottom:20px">📊 Estadísticas</h1>
      <div class="glass" style="padding:20px;margin-bottom:20px"><h3 style="color:#fff;font-weight:600;margin-bottom:12px">Resumen Global</h3>
        <div class="stats-grid"><div class="stat-box"><div class="val" style="color:#60a5fa">${pct}%</div><div class="lbl">Aciertos</div></div><div class="stat-box"><div class="val" style="color:#6ee7b7">${g.c}</div><div class="lbl">Correctas</div></div><div class="stat-box"><div class="val" style="color:#fda4af">${g.i}</div><div class="lbl">Incorrectas</div></div><div class="stat-box"><div class="val" style="color:#e2e8f0">${g.t}</div><div class="lbl">Total</div></div></div></div>
      ${ss.map(s=>{const m=mt(s.name);return`<div class="glass subject-stats"><div class="s-header"><span class="s-icon">${m.icon}</span><span class="s-name">${s.name}</span></div>${s.units.map(u=>{const x=st(s.name,u),up=x.t>0?Math.round(x.c/x.t*100):0,pc=up>=70?'#6ee7b7':up>=40?'#fcd34d':'#fda4af';
        return`<div class="unit-stat-row"><span class="u-name">${UL[u]||u}</span><div class="u-track"><div class="u-fill" style="width:${up}%;background:linear-gradient(90deg,${m.fill==='blue'?'#3b82f6,#8b5cf6':m.fill==='emerald'?'#10b981,#06b6d4':m.fill==='amber'?'#f59e0b,#ef4444':'#8b5cf6,#ec4899'})"></div></div><span class="u-pct" style="color:${x.t>0?pc:'var(--text3)'}">${x.t>0?up+'%':'-'}</span><span class="u-count">${x.c}/${x.t}</span></div>`}).join('')}</div>`}).join('')}
      <button class="btn btn-danger" onclick="App.clearStats()" style="margin-top:16px">🗑️ Borrar estadísticas</button>
    </div></div>`;
  }

  function clearAll(){if(confirm('¿Borrar todas las estadísticas?')){const k=[];for(let i=0;i<localStorage.length;i++){const x=localStorage.key(i);if(x.startsWith('ts_'))k.push(x)}k.forEach(x=>localStorage.removeItem(x));render()}}

  window.App={
    goHome(){S.view='home';S.sub=null;S.unit=null;S.errMode=false;render()},
    selectSubject(sub){S.sub=sub;S.view='subject';render()},
    selectUnit(sub,unit){S.sub=sub;S.unit=unit;S.errMode=false;S.shuf=shuf(qs(sub,unit));S.idx=0;S.ans={};S.view='quiz';render()},
    startAllUnits(sub){S.sub=sub;S.unit='all';S.errMode=false;S.shuf=shuf(allQs(sub));S.idx=0;S.ans={};S.view='quiz';render()},
    reviewErrors(sub){const sd=subs().find(s=>s.name===sub);let ae=[];sd.units.forEach(u=>{const s=st(sub,u);s.e.forEach(e=>ae.push({question:e.question,options:e.options||[],correctAnswer:e.correctAnswer}))});
      if(!ae.length){S.view='errors';S.sub=sub;render();return}S.sub=sub;S.unit='errors';S.errMode=true;S.errQ=shuf(ae);S.idx=0;S.ans={};S.view='quiz';render()},
    answer(opt){if(S.ans[S.idx]!==undefined)return;S.ans[S.idx]=opt;render()},
    nextQuestion(){if(S.idx<(S.errMode?S.errQ:S.shuf).length-1){S.idx++;render()}},
    prevQuestion(){if(S.idx>0){S.idx--;render()}},
    finishQuiz(){S.view='results';render()},
    exitQuiz(){showModal('🚪','¿Salir del test?','Se perderá el progreso de esta sesión.','Salir','Continuar',()=>{S.view='subject';render()})},
    retryQuiz(){S.errMode=false;const q=S.unit==='all'?allQs(S.sub):qs(S.sub,S.unit);S.shuf=shuf(q);S.idx=0;S.ans={};S.view='quiz';render()},
    retryErrors(){const qa=S.errMode?S.errQ:S.shuf,er=[];qa.forEach((q,i)=>{if(S.ans[i]!==q.correctAnswer)er.push(q)});if(!er.length){S.view='subject';render();return}S.errMode=true;S.errQ=shuf(er);S.idx=0;S.ans={};S.view='quiz';render()},
    goSubject(){S.errMode=false;S.view='subject';render()},
    viewStats(){S.view='stats';render()},
    clearStats(){showModal('🗑️','¿Borrar estadísticas?','Se eliminarán todos tus progresos y errores guardados.','Borrar','Cancelar',clearAll)},
    startApp(){startApp()},
    closeModal(e){closeModal(e)},
    confirmModal(){confirmModal()}
  };

  showIntro();
})();
