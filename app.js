(function() {
  'use strict';

  const SUBJECT_ICONS = {
    'Comercializacion de eventos': { icon: '🎯', class: 'events', gradient: 'from-blue-500 to-violet-500', color: 'blue' },
    'Estructura del mercado turístico': { icon: '🌍', class: 'estructura', gradient: 'from-emerald-500 to-cyan-500', color: 'emerald' },
    'Gestión del departamento de pisos': { icon: '🛏️', class: 'pisos', gradient: 'from-amber-500 to-red-500', color: 'amber' },
    'Itinerario personal para la empleabilidad I': { icon: '💼', class: 'empleabilidad', gradient: 'from-violet-500 to-pink-500', color: 'violet' }
  };

  const UNIT_LABELS = {
    'U1': 'Unidad 1', 'U2': 'Unidad 2', 'U3': 'Unidad 3',
    'U4': 'Unidad 4', 'U5': 'Unidad 5', 'U6': 'Unidad 6',
    'U7': 'Unidad 7', 'U8': 'Unidad 8', 'U9': 'Unidad 9',
    'Semestral': 'Semestral'
  };

  let questionsData = [];
  let state = {
    view: 'home',
    subject: null,
    unit: null,
    currentIndex: 0,
    answers: {},
    showResult: false,
    mode: 'quiz',
    shuffledQuestions: [],
    errorReviewMode: false,
    errorReviewQuestions: []
  };

  const app = document.getElementById('app');

  function loadQuestions() {
    fetch('questions.json')
      .then(r => r.json())
      .then(data => {
        questionsData = data;
        render();
      })
      .catch(err => {
        app.innerHTML = `<div class="flex items-center justify-center min-h-screen"><div class="glass rounded-2xl p-8 text-center"><p class="text-rose-400 text-lg">Error cargando preguntas: ${err.message}</p><p class="text-slate-400 mt-2">Asegúrate de que questions.json está en la misma carpeta</p></div></div>`;
      });
  }

  function getSubjects() {
    const map = {};
    questionsData.forEach(q => {
      if (!map[q.subject]) map[q.subject] = new Set();
      map[q.subject].add(q.unit);
    });
    return Object.entries(map).map(([name, units]) => ({
      name,
      units: [...units].sort((a, b) => {
        const na = parseInt(a.replace('U', '')) || (a === 'Semestral' ? 99 : 0);
        const nb = parseInt(b.replace('U', '')) || (b === 'Semestral' ? 99 : 0);
        return na - nb;
      })
    }));
  }

  function getQuestions(subject, unit) {
    const group = questionsData.find(q => q.subject === subject && q.unit === unit);
    return group ? group.questions : [];
  }

  function getAllQuestionsForSubject(subject) {
    return questionsData.filter(q => q.subject === subject).flatMap(q => q.questions);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getStats(subject, unit) {
    const key = `${subject}|||${unit}`;
    const saved = localStorage.getItem('testStats_' + key);
    return saved ? JSON.parse(saved) : { correct: 0, incorrect: 0, total: 0, errors: [] };
  }

  function saveStats(subject, unit, stats) {
    const key = `${subject}|||${unit}`;
    localStorage.setItem('testStats_' + key, JSON.stringify(stats));
  }

  function getGlobalStats() {
    let totalCorrect = 0, totalIncorrect = 0, totalQuestions = 0;
    const subjects = getSubjects();
    subjects.forEach(s => {
      s.units.forEach(u => {
        const st = getStats(s.name, u);
        totalCorrect += st.correct;
        totalIncorrect += st.incorrect;
        totalQuestions += st.total;
      });
    });
    return { correct: totalCorrect, incorrect: totalIncorrect, total: totalQuestions };
  }

  function render() {
    switch (state.view) {
      case 'home': renderHome(); break;
      case 'subject': renderSubject(); break;
      case 'unitSelect': renderUnitSelect(); break;
      case 'quiz': renderQuiz(); break;
      case 'results': renderResults(); break;
      case 'errors': renderErrors(); break;
      case 'stats': renderStats(); break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHome() {
    const subjects = getSubjects();
    const global = getGlobalStats();
    const pct = global.total > 0 ? Math.round((global.correct / global.total) * 100) : 0;

    app.innerHTML = `
      <div class="min-h-screen fade-in">
        <div class="max-w-5xl mx-auto px-4 py-6 sm:py-10">
          <header class="text-center mb-8 sm:mb-12">
            <h1 class="text-3xl sm:text-5xl font-800 gradient-text mb-2">Test Practica</h1>
            <p class="text-slate-400 text-sm sm:text-lg">Practica los test de tu ciclo formativo de Alojamiento</p>
          </header>

          ${global.total > 0 ? `
          <div class="glass rounded-2xl p-4 sm:p-6 mb-8 card-hover">
            <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div class="stat-ring flex-shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle class="ring-bg" cx="40" cy="40" r="34" fill="none" stroke-width="6"/>
                  <circle class="ring-fill" cx="40" cy="40" r="34" fill="none" stroke="#3b82f6" stroke-width="6"
                    stroke-dasharray="${2 * Math.PI * 34}"
                    stroke-dashoffset="${2 * Math.PI * 34 * (1 - pct / 100)}"
                    stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-700 text-white">${pct}%</span>
                </div>
              </div>
              <div class="flex-1 text-center sm:text-left">
                <h3 class="text-white font-600 text-lg mb-1">Progreso Global</h3>
                <div class="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                  <span class="text-emerald-400"><span class="font-600">${global.correct}</span> correctas</span>
                  <span class="text-rose-400"><span class="font-600">${global.incorrect}</span> incorrectas</span>
                  <span class="text-slate-400"><span class="font-600">${global.total}</span> respondidas</span>
                </div>
              </div>
              <button onclick="App.viewStats()" class="glass-light px-4 py-2 rounded-xl text-sm text-brand-300 hover:text-white transition-colors">
                📊 Ver estadísticas
              </button>
            </div>
          </div>` : ''}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            ${subjects.map(s => {
              const meta = SUBJECT_ICONS[s.name] || { icon: '📚', class: 'events', gradient: 'from-blue-500 to-violet-500' };
              const totalQ = s.units.reduce((sum, u) => sum + getQuestions(s.name, u).length, 0);
              let unitStats = s.units.map(u => getStats(s.name, u));
              let totalCorrect = unitStats.reduce((a, b) => a + b.correct, 0);
              let totalAnswered = unitStats.reduce((a, b) => a + b.total, 0);
              let unitPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
              let totalErrors = unitStats.reduce((a, b) => a + b.incorrect, 0);

              return `
              <div class="subject-card ${meta.class} glass rounded-2xl p-5 sm:p-6 card-hover cursor-pointer"
                   onclick="App.selectSubject('${s.name.replace(/'/g, "\\'")}')">
                <div class="flex items-start gap-4">
                  <div class="text-3xl sm:text-4xl flex-shrink-0">${meta.icon}</div>
                  <div class="flex-1 min-w-0">
                    <h2 class="text-white font-700 text-base sm:text-lg leading-tight mb-1">${s.name}</h2>
                    <p class="text-slate-400 text-xs sm:text-sm">${s.units.length} unidades · ${totalQ} preguntas</p>
                    ${totalAnswered > 0 ? `
                    <div class="mt-3">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div class="h-full bg-gradient-to-r ${meta.gradient} rounded-full progress-bar" style="width:${unitPct}%"></div>
                        </div>
                        <span class="text-xs font-600 text-slate-300">${unitPct}%</span>
                      </div>
                      <div class="flex gap-3 text-xs">
                        <span class="text-emerald-400">${totalCorrect} ✓</span>
                        <span class="text-rose-400">${totalErrors} ✗</span>
                      </div>
                    </div>` : ''}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderSubject() {
    const subject = state.subject;
    const meta = SUBJECT_ICONS[subject] || { icon: '📚', class: 'events', gradient: 'from-blue-500 to-violet-500', color: 'blue' };
    const subjects = getSubjects();
    const sData = subjects.find(s => s.name === subject);
    if (!sData) { state.view = 'home'; render(); return; }

    const allQ = getAllQuestionsForSubject(subject);
    const allStats = sData.units.map(u => getStats(subject, u));
    const totalCorrect = allStats.reduce((a, b) => a + b.correct, 0);
    const totalAnswered = allStats.reduce((a, b) => a + b.total, 0);
    const totalIncorrect = allStats.reduce((a, b) => a + b.incorrect, 0);
    const totalErrors = allStats.reduce((a, b) => a + b.errors.length, 0);
    const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    app.innerHTML = `
      <div class="min-h-screen fade-in">
        <div class="max-w-4xl mx-auto px-4 py-6 sm:py-10">
          <button onclick="App.goHome()" class="glass-light px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors mb-6 inline-flex items-center gap-2">
            ← Volver
          </button>

          <div class="glass rounded-2xl p-5 sm:p-8 mb-6">
            <div class="flex items-center gap-4 mb-4">
              <span class="text-4xl sm:text-5xl">${meta.icon}</span>
              <div>
                <h1 class="text-xl sm:text-2xl font-800 text-white">${subject}</h1>
                <p class="text-slate-400 text-sm">${allQ.length} preguntas en total</p>
              </div>
            </div>
            ${totalAnswered > 0 ? `
            <div class="flex flex-wrap gap-4 mt-4">
              <div class="glass-light rounded-xl px-4 py-2 text-center">
                <div class="text-emerald-400 font-700 text-lg">${totalCorrect}</div>
                <div class="text-slate-400 text-xs">Correctas</div>
              </div>
              <div class="glass-light rounded-xl px-4 py-2 text-center">
                <div class="text-rose-400 font-700 text-lg">${totalIncorrect}</div>
                <div class="text-slate-400 text-xs">Incorrectas</div>
              </div>
              <div class="glass-light rounded-xl px-4 py-2 text-center">
                <div class="text-brand-400 font-700 text-lg">${pct}%</div>
                <div class="text-slate-400 text-xs">Aciertos</div>
              </div>
            </div>` : ''}
          </div>

          <div class="flex flex-wrap gap-3 mb-6">
            <button onclick="App.startAllUnits('${subject.replace(/'/g, "\\'")}')"
              class="bg-gradient-to-r ${meta.gradient} text-white px-5 py-2.5 rounded-xl font-600 text-sm hover:opacity-90 transition-opacity">
              🔀 Mezcla todas las preguntas
            </button>
            ${totalErrors > 0 ? `
            <button onclick="App.reviewErrors('${subject.replace(/'/g, "\\'")}')"
              class="glass-light text-rose-300 px-5 py-2.5 rounded-xl font-600 text-sm hover:text-rose-200 transition-colors">
              ❗ Repasar errores (${totalErrors})
            </button>` : ''}
          </div>

          <h3 class="text-slate-300 font-600 text-sm mb-3 uppercase tracking-wider">Unidades</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${sData.units.map(u => {
              const qs = getQuestions(subject, u);
              const st = getStats(subject, u);
              const uPct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
              return `
              <div class="glass rounded-xl p-4 card-hover cursor-pointer" onclick="App.selectUnit('${subject.replace(/'/g, "\\'")}', '${u}')">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white font-600">${UNIT_LABELS[u] || u}</span>
                  <span class="badge ${st.total > 0 ? (uPct >= 70 ? 'bg-emerald-500/20 text-emerald-300' : uPct >= 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300') : 'bg-slate-500/20 text-slate-400'}">
                    ${st.total > 0 ? uPct + '%' : 'Sin hacer'}
                  </span>
                </div>
                <p class="text-slate-400 text-xs mb-2">${qs.length} preguntas</p>
                ${st.total > 0 ? `
                <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r ${meta.gradient} rounded-full progress-bar" style="width:${uPct}%"></div>
                </div>
                <div class="flex gap-3 text-xs mt-1.5">
                  <span class="text-emerald-400">${st.correct} ✓</span>
                  <span class="text-rose-400">${st.incorrect} ✗</span>
                </div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderQuiz() {
    const questions = state.errorReviewMode ? state.errorReviewQuestions : state.shuffledQuestions;
    if (!questions.length) { state.view = 'home'; render(); return; }

    const q = questions[state.currentIndex];
    const total = questions.length;
    const current = state.currentIndex + 1;
    const pct = Math.round((current / total) * 100);
    const answered = state.answers[state.currentIndex] !== undefined;
    const selectedAnswer = state.answers[state.currentIndex];
    const isCorrect = answered && selectedAnswer === q.correctAnswer;

    const meta = SUBJECT_ICONS[state.subject] || { gradient: 'from-blue-500 to-violet-500' };
    const unitLabel = state.errorReviewMode ? 'Repaso de errores' : (UNIT_LABELS[state.unit] || state.unit);

    app.innerHTML = `
      <div class="min-h-screen flex flex-col fade-in">
        <div class="max-w-3xl mx-auto px-4 py-4 sm:py-6 w-full flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <button onclick="App.exitQuiz()" class="glass-light px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors">
              ✕ Salir
            </button>
            <div class="text-center">
              <span class="text-slate-400 text-xs">${state.subject}</span>
              <span class="text-slate-500 text-xs mx-1">·</span>
              <span class="text-slate-400 text-xs">${unitLabel}</span>
            </div>
            <span class="text-slate-300 text-sm font-600">${current}/${total}</span>
          </div>

          <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-6">
            <div class="h-full bg-gradient-to-r ${meta.gradient} rounded-full progress-bar" style="width:${pct}%"></div>
          </div>

          <div class="glass rounded-2xl p-5 sm:p-8 mb-6 flex-1">
            <h2 class="text-white font-600 text-base sm:text-lg leading-relaxed mb-6">${q.question}</h2>
            <div class="space-y-3">
              ${q.options.map((opt, i) => {
                let cls = 'option-btn glass-light rounded-xl p-3 sm:p-4 cursor-pointer border-2 border-transparent';
                if (answered) {
                  cls += ' disabled';
                  if (opt === q.correctAnswer) cls += ' correct';
                  else if (opt === selectedAnswer && opt !== q.correctAnswer) cls += ' incorrect';
                } else if (selectedAnswer === opt) {
                  cls += ' selected';
                }
                const letter = opt.charAt(0);
                return `
                <div class="${cls}" onclick="App.answer('${opt.replace(/'/g, "\\'")}')">
                  <div class="flex items-start gap-3">
                    <span class="flex-shrink-0 w-7 h-7 rounded-lg ${answered && opt === q.correctAnswer ? 'bg-emerald-500/20 text-emerald-400' : answered && opt === selectedAnswer && opt !== q.correctAnswer ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'} flex items-center justify-center text-xs font-700">${letter}</span>
                    <span class="text-sm sm:text-base ${answered && opt === q.correctAnswer ? 'text-emerald-300' : answered && opt === selectedAnswer && opt !== q.correctAnswer ? 'text-rose-300' : 'text-slate-200'}">${opt.substring(3)}</span>
                  </div>
                </div>`;
              }).join('')}
            </div>

            ${answered ? `
            <div class="mt-5 p-3 rounded-xl ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}">
              <div class="flex items-center gap-2">
                <span class="text-lg">${isCorrect ? '✅' : '❌'}</span>
                <span class="font-600 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">${isCorrect ? '¡Correcto!' : 'Incorrecto'}</span>
              </div>
              ${!isCorrect ? `<p class="text-slate-300 text-sm mt-2">La respuesta correcta es: <span class="text-emerald-400 font-600">${q.correctAnswer}</span></p>` : ''}
            </div>` : ''}
          </div>

          <div class="flex items-center justify-between">
            <button onclick="App.prevQuestion()" class="glass-light px-4 py-2.5 rounded-xl text-sm ${state.currentIndex === 0 ? 'opacity-30 pointer-events-none' : 'text-slate-300 hover:text-white'} transition-colors">
              ← Anterior
            </button>
            ${answered && state.currentIndex < total - 1 ? `
            <button onclick="App.nextQuestion()" class="bg-gradient-to-r ${meta.gradient} text-white px-6 py-2.5 rounded-xl font-600 text-sm hover:opacity-90 transition-opacity">
              Siguiente →
            </button>` : answered && state.currentIndex === total - 1 ? `
            <button onclick="App.finishQuiz()" class="bg-gradient-to-r ${meta.gradient} text-white px-6 py-2.5 rounded-xl font-600 text-sm hover:opacity-90 transition-opacity pulse-glow">
              Ver resultados 🏁
            </button>` : `
            <span class="text-slate-500 text-xs">Selecciona una respuesta</span>`}
          </div>
        </div>
      </div>`;
  }

  function renderResults() {
    const questions = state.errorReviewMode ? state.errorReviewQuestions : state.shuffledQuestions;
    const total = questions.length;
    let correct = 0, incorrect = 0;
    const errors = [];

    questions.forEach((q, i) => {
      const ans = state.answers[i];
      if (ans === q.correctAnswer) correct++;
      else {
        incorrect++;
        errors.push({ question: q.question, yourAnswer: ans, correctAnswer: q.correctAnswer, options: q.options });
      }
    });

    const pct = Math.round((correct / total) * 100);
    const meta = SUBJECT_ICONS[state.subject] || { icon: '📚', gradient: 'from-blue-500 to-violet-500' };
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '💪' : pct >= 30 ? '📚' : '🔄';
    const msg = pct >= 90 ? '¡Excelente!' : pct >= 70 ? '¡Muy bien!' : pct >= 50 ? '¡Buen intento!' : pct >= 30 ? 'Sigue practicando' : 'Necesitas repasar';

    if (!state.errorReviewMode && state.unit) {
      const st = getStats(state.subject, state.unit);
      st.correct += correct;
      st.incorrect += incorrect;
      st.total += total;
      errors.forEach(e => {
        if (!st.errors.find(er => er.question === e.question)) {
          st.errors.push(e);
        }
      });
      saveStats(state.subject, state.unit, st);
    }

    app.innerHTML = `
      <div class="min-h-screen fade-in">
        <div class="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <div class="glass rounded-2xl p-6 sm:p-10 text-center mb-6">
            <div class="text-5xl sm:text-6xl mb-4">${emoji}</div>
            <h1 class="text-2xl sm:text-3xl font-800 gradient-text mb-2">${msg}</h1>
            <p class="text-slate-400 mb-6">${state.subject} · ${state.errorReviewMode ? 'Repaso de errores' : (UNIT_LABELS[state.unit] || state.unit)}</p>

            <div class="flex justify-center mb-6">
              <div class="stat-ring" style="width:120px;height:120px;">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle class="ring-bg" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
                  <circle class="ring-fill" cx="60" cy="60" r="52" fill="none" stroke="${pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#f43f5e'}" stroke-width="8"
                    stroke-dasharray="${2 * Math.PI * 52}"
                    stroke-dashoffset="${2 * Math.PI * 52 * (1 - pct / 100)}"
                    stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-2xl font-800 text-white">${pct}%</span>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-6">
              <div class="text-center">
                <div class="text-emerald-400 font-700 text-2xl">${correct}</div>
                <div class="text-slate-400 text-xs">Correctas</div>
              </div>
              <div class="text-center">
                <div class="text-rose-400 font-700 text-2xl">${incorrect}</div>
                <div class="text-slate-400 text-xs">Incorrectas</div>
              </div>
              <div class="text-center">
                <div class="text-brand-400 font-700 text-2xl">${total}</div>
                <div class="text-slate-400 text-xs">Total</div>
              </div>
            </div>
          </div>

          ${errors.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-rose-400 font-600 text-sm mb-3 uppercase tracking-wider">❗ Errores (${errors.length})</h3>
            <div class="space-y-3">
              ${errors.map((e, i) => `
              <div class="glass rounded-xl p-4 slide-up" style="animation-delay:${i * 0.05}s">
                <p class="text-white text-sm font-500 mb-2">${e.question}</p>
                ${e.yourAnswer ? `<p class="text-rose-400 text-xs mb-1">Tu respuesta: ${e.yourAnswer}</p>` : ''}
                <p class="text-emerald-400 text-xs">Correcta: ${e.correctAnswer}</p>
              </div>`).join('')}
            </div>
          </div>` : `
          <div class="glass rounded-2xl p-6 text-center mb-6">
            <span class="text-3xl">🌟</span>
            <p class="text-emerald-400 font-600 mt-2">¡Todas las respuestas correctas!</p>
          </div>`}

          <div class="flex flex-wrap gap-3 justify-center">
            <button onclick="App.retryQuiz()" class="bg-gradient-to-r ${meta.gradient} text-white px-6 py-3 rounded-xl font-600 text-sm hover:opacity-90 transition-opacity">
              🔀 Reintentar (mezclado)
            </button>
            ${errors.length > 0 ? `
            <button onclick="App.retryErrors()" class="glass-light text-rose-300 px-6 py-3 rounded-xl font-600 text-sm hover:text-rose-200 transition-colors">
              ❗ Repasar solo errores
            </button>` : ''}
            <button onclick="App.goSubject()" class="glass-light text-slate-300 px-6 py-3 rounded-xl font-600 text-sm hover:text-white transition-colors">
              ← Volver a la asignatura
            </button>
            <button onclick="App.goHome()" class="glass-light text-slate-300 px-6 py-3 rounded-xl font-600 text-sm hover:text-white transition-colors">
              🏠 Inicio
            </button>
          </div>
        </div>
      </div>`;
  }

  function renderErrors() {
    const subject = state.subject;
    const subjects = getSubjects();
    const sData = subjects.find(s => s.name === subject);
    if (!sData) { state.view = 'home'; render(); return; }

    let allErrors = [];
    sData.units.forEach(u => {
      const st = getStats(subject, u);
      st.errors.forEach(e => allErrors.push({ ...e, unit: u }));
    });

    const meta = SUBJECT_ICONS[subject] || { icon: '📚', gradient: 'from-blue-500 to-violet-500' };

    app.innerHTML = `
      <div class="min-h-screen fade-in">
        <div class="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <button onclick="App.goSubject()" class="glass-light px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors mb-6 inline-flex items-center gap-2">
            ← Volver
          </button>

          <h1 class="text-xl sm:text-2xl font-800 text-white mb-2">❗ Errores acumulados</h1>
          <p class="text-slate-400 text-sm mb-6">${subject} · ${allErrors.length} errores guardados</p>

          ${allErrors.length === 0 ? `
          <div class="glass rounded-2xl p-8 text-center">
            <span class="text-4xl">✨</span>
            <p class="text-emerald-400 font-600 mt-3">¡No tienes errores guardados!</p>
          </div>` : `
          <button onclick="App.reviewErrors('${subject.replace(/'/g, "\\'")}')"
            class="bg-gradient-to-r ${meta.gradient} text-white px-6 py-3 rounded-xl font-600 text-sm hover:opacity-90 transition-opacity mb-6 w-full sm:w-auto">
            🔀 Practicar estos errores
          </button>

          <div class="space-y-3">
            ${allErrors.map((e, i) => `
            <div class="glass rounded-xl p-4">
              <div class="flex items-start justify-between gap-2 mb-2">
                <p class="text-white text-sm font-500">${e.question}</p>
                <span class="badge bg-slate-600/50 text-slate-300 flex-shrink-0">${UNIT_LABELS[e.unit] || e.unit}</span>
              </div>
              ${e.yourAnswer ? `<p class="text-rose-400 text-xs mb-1">Tu respuesta: ${e.yourAnswer}</p>` : ''}
              <p class="text-emerald-400 text-xs">Correcta: ${e.correctAnswer}</p>
            </div>`).join('')}
          </div>`}
        </div>
      </div>`;
  }

  function renderStats() {
    const subjects = getSubjects();
    const global = getGlobalStats();
    const pct = global.total > 0 ? Math.round((global.correct / global.total) * 100) : 0;

    app.innerHTML = `
      <div class="min-h-screen fade-in">
        <div class="max-w-4xl mx-auto px-4 py-6 sm:py-10">
          <button onclick="App.goHome()" class="glass-light px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors mb-6 inline-flex items-center gap-2">
            ← Volver al inicio
          </button>

          <h1 class="text-2xl sm:text-3xl font-800 gradient-text mb-6">📊 Estadísticas</h1>

          <div class="glass rounded-2xl p-6 mb-6">
            <h3 class="text-white font-600 mb-4">Resumen Global</h3>
            <div class="flex flex-wrap gap-4">
              <div class="glass-light rounded-xl px-5 py-3 text-center">
                <div class="text-brand-400 font-700 text-2xl">${pct}%</div>
                <div class="text-slate-400 text-xs">Aciertos</div>
              </div>
              <div class="glass-light rounded-xl px-5 py-3 text-center">
                <div class="text-emerald-400 font-700 text-2xl">${global.correct}</div>
                <div class="text-slate-400 text-xs">Correctas</div>
              </div>
              <div class="glass-light rounded-xl px-5 py-3 text-center">
                <div class="text-rose-400 font-700 text-2xl">${global.incorrect}</div>
                <div class="text-slate-400 text-xs">Incorrectas</div>
              </div>
              <div class="glass-light rounded-xl px-5 py-3 text-center">
                <div class="text-slate-300 font-700 text-2xl">${global.total}</div>
                <div class="text-slate-400 text-xs">Total</div>
              </div>
            </div>
          </div>

          ${subjects.map(s => {
            const meta = SUBJECT_ICONS[s.name] || { icon: '📚', gradient: 'from-blue-500 to-violet-500' };
            return `
            <div class="glass rounded-2xl p-5 mb-4">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-2xl">${meta.icon}</span>
                <h3 class="text-white font-600">${s.name}</h3>
              </div>
              <div class="space-y-2">
                ${s.units.map(u => {
                  const st = getStats(s.name, u);
                  const uPct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
                  return `
                  <div class="flex items-center gap-3 glass-light rounded-lg p-3">
                    <span class="text-slate-300 text-sm font-500 w-24 flex-shrink-0">${UNIT_LABELS[u] || u}</span>
                    <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r ${meta.gradient} rounded-full progress-bar" style="width:${uPct}%"></div>
                    </div>
                    <span class="text-xs font-600 ${st.total > 0 ? (uPct >= 70 ? 'text-emerald-400' : uPct >= 40 ? 'text-amber-400' : 'text-rose-400') : 'text-slate-500'} w-12 text-right">${st.total > 0 ? uPct + '%' : '-'}</span>
                    <span class="text-xs text-slate-500 w-20 text-right">${st.correct}/${st.total}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}

          <button onclick="App.clearStats()" class="glass-light text-rose-400 px-5 py-2.5 rounded-xl text-sm hover:text-rose-300 transition-colors mt-4">
            🗑️ Borrar todas las estadísticas
          </button>
        </div>
      </div>`;
  }

  function clearStats() {
    if (confirm('¿Estás seguro de que quieres borrar todas las estadísticas?')) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('testStats_')) keys.push(key);
      }
      keys.forEach(k => localStorage.removeItem(k));
      render();
    }
  }

  window.App = {
    goHome() {
      state.view = 'home'; state.subject = null; state.unit = null;
      state.errorReviewMode = false; render();
    },
    selectSubject(subject) {
      state.subject = subject; state.view = 'subject'; render();
    },
    selectUnit(subject, unit) {
      state.subject = subject; state.unit = unit;
      state.errorReviewMode = false;
      const qs = getQuestions(subject, unit);
      state.shuffledQuestions = shuffle(qs);
      state.currentIndex = 0; state.answers = {};
      state.view = 'quiz'; render();
    },
    startAllUnits(subject) {
      state.subject = subject; state.unit = 'all';
      state.errorReviewMode = false;
      const qs = getAllQuestionsForSubject(subject);
      state.shuffledQuestions = shuffle(qs);
      state.currentIndex = 0; state.answers = {};
      state.view = 'quiz'; render();
    },
    reviewErrors(subject) {
      const subjects = getSubjects();
      const sData = subjects.find(s => s.name === subject);
      let allErrors = [];
      sData.units.forEach(u => {
        const st = getStats(subject, u);
        st.errors.forEach(e => allErrors.push({
          question: e.question,
          options: e.options || [],
          correctAnswer: e.correctAnswer
        }));
      });
      if (allErrors.length === 0) {
        state.view = 'errors'; state.subject = subject; render(); return;
      }
      state.subject = subject; state.unit = 'errors';
      state.errorReviewMode = true;
      state.errorReviewQuestions = shuffle(allErrors);
      state.currentIndex = 0; state.answers = {};
      state.view = 'quiz'; render();
    },
    answer(opt) {
      if (state.answers[state.currentIndex] !== undefined) return;
      state.answers[state.currentIndex] = opt;
      render();
    },
    nextQuestion() {
      const questions = state.errorReviewMode ? state.errorReviewQuestions : state.shuffledQuestions;
      if (state.currentIndex < questions.length - 1) {
        state.currentIndex++; render();
      }
    },
    prevQuestion() {
      if (state.currentIndex > 0) {
        state.currentIndex--; render();
      }
    },
    finishQuiz() {
      state.view = 'results'; render();
    },
    exitQuiz() {
      if (confirm('¿Seguro que quieres salir? Se perderá el progreso de esta sesión.')) {
        state.view = 'subject'; render();
      }
    },
    retryQuiz() {
      state.errorReviewMode = false;
      const qs = state.unit === 'all' ? getAllQuestionsForSubject(state.subject) : getQuestions(state.subject, state.unit);
      state.shuffledQuestions = shuffle(qs);
      state.currentIndex = 0; state.answers = {};
      state.view = 'quiz'; render();
    },
    retryErrors() {
      const questions = state.errorReviewMode ? state.errorReviewQuestions : state.shuffledQuestions;
      const errors = [];
      questions.forEach((q, i) => {
        if (state.answers[i] !== q.correctAnswer) {
          errors.push(q);
        }
      });
      if (errors.length === 0) { state.view = 'subject'; render(); return; }
      state.errorReviewMode = true;
      state.errorReviewQuestions = shuffle(errors);
      state.currentIndex = 0; state.answers = {};
      state.view = 'quiz'; render();
    },
    goSubject() {
      state.errorReviewMode = false; state.view = 'subject'; render();
    },
    viewStats() {
      state.view = 'stats'; render();
    },
    clearStats() {
      clearStats();
    }
  };

  loadQuestions();
})();
