/* ============================================================
   UPGRADE.JS v2 — Reflexión Personal + Guardado de Progreso
   Para los cuestionarios de los libros del Pastor Milton Valle:
   • En Autoridad y Bajo Autoridad
   • LiderazGO
   • Restaurando Matrimonios
   • Visión 20/20

   v2: Soporte para formato de pregunta-única (LiderazGO)
   ============================================================ */

(function () {
  'use strict';

  // ────────────────────────────────────────────────────
  // 1. DETECCIÓN AUTOMÁTICA DEL CONTEXTO
  // ────────────────────────────────────────────────────
  const PATH = window.location.pathname;
  const HOST = window.location.hostname;
  const FILENAME = (PATH.split('/').pop() || 'index.html').toLowerCase();

  let BOOK_ID = 'general';
  let BOOK_NAME = 'Cuestionarios';
  if (PATH.includes('/autoridad') || document.title.toLowerCase().includes('autoridad')) {
    BOOK_ID = 'autoridad';
    BOOK_NAME = 'En Autoridad y Bajo Autoridad';
  } else if (PATH.toLowerCase().includes('liderazgo') || document.title.toLowerCase().includes('liderazgo')) {
    BOOK_ID = 'liderazgo';
    BOOK_NAME = 'LiderazGO';
  } else if (PATH.includes('matrimonios') || document.title.toLowerCase().includes('matrimonios') || document.title.toLowerCase().includes('matrimonio')) {
    BOOK_ID = 'matrimonios';
    BOOK_NAME = 'Restaurando Matrimonios';
  } else if (PATH.includes('vision') || document.title.toLowerCase().includes('visión 20')) {
    BOOK_ID = 'vision';
    BOOK_NAME = 'Visión 20/20';
  }

  const SECTION_ID = FILENAME.replace('.html', '').replace(/[^a-z0-9_-]/g, '');

  // Detectar formato del cuestionario
  // Formato A (Autoridad/Visión): .question-card (todas visibles)
  // Formato B (LiderazGO): .pregunta-wrap (una a la vez)
  const formatAcards = document.querySelectorAll('.question-card');
  const formatBcards = document.querySelectorAll('.pregunta-wrap');

  let QUIZ_FORMAT = 'none';
  let QUESTION_CARDS = [];

  if (formatAcards.length > 0) {
    QUIZ_FORMAT = 'A';
    QUESTION_CARDS = formatAcards;
  } else if (formatBcards.length > 0) {
    QUIZ_FORMAT = 'B';
    QUESTION_CARDS = formatBcards;
  }

  const IS_INDEX = (
    SECTION_ID === 'index' ||
    SECTION_ID === '' ||
    SECTION_ID.includes('index') ||
    QUIZ_FORMAT === 'none'
  );

  const IS_DIAGNOSTIC = (BOOK_ID === 'matrimonios' && !IS_INDEX);

  // ────────────────────────────────────────────────────
  // 2. ALMACENAMIENTO LOCAL
  // ────────────────────────────────────────────────────
  const STORAGE_PREFIX = 'milton_valle_v1_';
  const STORAGE_KEY = STORAGE_PREFIX + BOOK_ID;

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveProgress(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('No se pudo guardar el progreso', e); }
  }

  function getSection(sectionId) {
    const all = loadProgress();
    return all[sectionId] || { reflections: {}, completed: false, finalReflection: {}, updatedAt: null };
  }

  function setSection(sectionId, data) {
    const all = loadProgress();
    all[sectionId] = Object.assign({}, all[sectionId] || {}, data, { updatedAt: new Date().toISOString() });
    saveProgress(all);
  }

  // ────────────────────────────────────────────────────
  // 3. ESTILOS CSS
  // ────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('mv-upgrade-styles')) return;
    const style = document.createElement('style');
    style.id = 'mv-upgrade-styles';
    style.textContent = `
      .mv-reflection-area {
        margin-top: 22px;
        padding-top: 20px;
        border-top: 1px dashed rgba(150,120,80,0.35);
      }
      .mv-reflection-label {
        font-family: 'Cinzel', 'Montserrat', 'DM Sans', 'Segoe UI', sans-serif;
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
        color: #B8965A;
        opacity: 0.95;
      }
      .mv-reflection-hint {
        font-size: 12px;
        color: #888;
        font-style: italic;
        margin-bottom: 10px;
        font-family: 'Cormorant Garamond', 'Lora', Georgia, serif;
        line-height: 1.5;
      }
      .mv-dark-theme .mv-reflection-area {
        border-top-color: rgba(45,191,114,0.25);
      }
      .mv-dark-theme .mv-reflection-label { color: #2DBF72; }
      .mv-dark-theme .mv-reflection-hint { color: #7BBFDC; }
      .mv-reflection-textarea {
        width: 100%;
        min-height: 80px;
        padding: 12px 14px;
        border: 1px solid rgba(150,120,80,0.3);
        background: rgba(255,253,248,0.6);
        font-family: 'Cormorant Garamond', 'Lora', Georgia, serif;
        font-size: 16px;
        color: #2C2416;
        resize: vertical;
        font-style: italic;
        transition: border-color 0.25s, background 0.25s;
        border-radius: 4px;
        line-height: 1.55;
        box-sizing: border-box;
      }
      .mv-reflection-textarea:focus {
        outline: none;
        border-color: #B8965A;
        background: #FFFDF8;
      }
      .mv-reflection-textarea::placeholder {
        color: #B8965A;
        opacity: 0.5;
        font-style: italic;
      }
      .mv-dark-theme .mv-reflection-textarea {
        background: rgba(13,34,64,0.5);
        border-color: rgba(45,191,114,0.3);
        color: #e8e8e8;
      }
      .mv-dark-theme .mv-reflection-textarea:focus {
        border-color: #2DBF72;
        background: #0E1E30;
      }
      .mv-dark-theme .mv-reflection-textarea::placeholder {
        color: #7BBFDC;
        opacity: 0.5;
      }
      .mv-reflection-saved {
        font-family: 'Cinzel', 'Montserrat', sans-serif;
        font-size: 9px;
        letter-spacing: 0.15em;
        color: #2D5A27;
        opacity: 0;
        transition: opacity 0.4s;
        margin-top: 6px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .mv-dark-theme .mv-reflection-saved { color: #2DBF72; }
      .mv-reflection-saved.show { opacity: 0.9; }

      .mv-final-reflection {
        max-width: 720px;
        margin: 28px auto 32px;
        padding: 28px 32px;
        background: rgba(255,253,248,0.92);
        border: 1px solid rgba(184,150,90,0.3);
        border-left: 4px solid #B8965A;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      }
      .mv-final-reflection h3 {
        font-family: 'Cormorant Garamond', 'Lora', Georgia, serif;
        font-size: 24px;
        color: #6B0D0D;
        margin: 0 0 8px;
        font-weight: 600;
        line-height: 1.2;
      }
      .mv-final-reflection .mv-fr-subtitle {
        font-size: 13px;
        color: #666;
        margin-bottom: 18px;
        line-height: 1.5;
      }
      .mv-final-reflection .mv-fr-question {
        font-family: 'Cormorant Garamond', 'Lora', Georgia, serif;
        font-size: 16px;
        color: #1a1a2e;
        margin: 16px 0 6px;
        font-weight: 600;
      }
      .mv-final-reflection textarea {
        width: 100%;
        min-height: 70px;
        padding: 12px 14px;
        border: 1px solid rgba(150,120,80,0.3);
        background: #fff;
        font-family: 'Cormorant Garamond', 'Lora', Georgia, serif;
        font-size: 16px;
        color: #2C2416;
        resize: vertical;
        font-style: italic;
        border-radius: 4px;
        line-height: 1.5;
        box-sizing: border-box;
        margin-bottom: 4px;
      }
      .mv-final-reflection textarea:focus {
        outline: none;
        border-color: #B8965A;
        background: #FFFDF8;
      }

      .mv-status-badge {
        display: inline-block;
        font-family: 'Cinzel', 'Montserrat', 'DM Sans', sans-serif;
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 99px;
        margin-left: 8px;
        vertical-align: middle;
        white-space: nowrap;
      }
      .mv-status-badge.completed { background: #2D5A27; color: #fff; }
      .mv-status-badge.in-progress { background: #B8965A; color: #fff; }
      .mv-status-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 5;
      }

      .mv-progress-pill {
        position: fixed;
        bottom: 16px;
        right: 16px;
        background: rgba(26,21,16,0.94);
        color: #D4B483;
        font-family: 'Cinzel', 'Montserrat', sans-serif;
        font-size: 10px;
        letter-spacing: 0.14em;
        padding: 10px 18px;
        border-radius: 99px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        z-index: 9999;
        cursor: pointer;
        font-weight: 600;
        transition: transform 0.2s;
        opacity: 0.95;
        pointer-events: auto;
      }
      .mv-progress-pill:hover { transform: translateY(-2px); }

      .mv-index-banner {
        max-width: 820px;
        margin: 16px auto 24px;
        padding: 14px 22px;
        background: linear-gradient(135deg, rgba(184,150,90,0.12), rgba(184,150,90,0.04));
        border: 1px solid rgba(184,150,90,0.4);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        font-family: 'Lato', 'DM Sans', 'Segoe UI', sans-serif;
      }
      .mv-index-banner-text {
        font-size: 13px;
        color: #5C4A2E;
        line-height: 1.5;
      }
      .mv-index-banner-text strong { color: #6B0D0D; font-weight: 700; }
      .mv-index-banner button {
        font-family: 'Cinzel', 'Montserrat', sans-serif;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 7px 16px;
        background: transparent;
        border: 1px solid #B8965A;
        color: #8A6D3B;
        cursor: pointer;
        border-radius: 4px;
        font-weight: 600;
        transition: background 0.2s, color 0.2s;
      }
      .mv-index-banner button:hover { background: #B8965A; color: #fff; }

      .mv-dark-banner {
        background: linear-gradient(135deg, rgba(45,191,114,0.15), rgba(184,150,90,0.05));
        border-color: rgba(45,191,114,0.4);
      }
      .mv-dark-banner .mv-index-banner-text { color: #d4d4d4; }
      .mv-dark-banner .mv-index-banner-text strong { color: #2DBF72; }
      .mv-dark-banner button {
        border-color: #2DBF72;
        color: #2DBF72;
      }
      .mv-dark-banner button:hover { background: #2DBF72; color: #fff; }

      @media (max-width: 600px) {
        .mv-index-banner { padding: 12px 16px; margin: 12px; }
        .mv-progress-pill { font-size: 9px; padding: 8px 14px; }
        .mv-final-reflection { padding: 22px 20px; margin: 20px 14px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ────────────────────────────────────────────────────
  // 4. UTILIDADES
  // ────────────────────────────────────────────────────
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function isDarkBackground() {
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      return luminance < 100;
    }
    return BOOK_ID === 'liderazgo';
  }

  // ────────────────────────────────────────────────────
  // 5. UPGRADE PARA CUESTIONARIOS REFLEXIVOS
  // ────────────────────────────────────────────────────
  function upgradeReflectiveQuiz() {
    if (QUESTION_CARDS.length === 0) return;

    const isDark = isDarkBackground();
    if (isDark) document.body.classList.add('mv-dark-theme');

    const sectionData = getSection(SECTION_ID);
    const reflections = sectionData.reflections || {};

    QUESTION_CARDS.forEach((card, idx) => {
      const qId = card.id || ('q' + (idx + 1));
      if (card.querySelector('.mv-reflection-area')) return;

      const area = document.createElement('div');
      area.className = 'mv-reflection-area';
      area.innerHTML = `
        <span class="mv-reflection-label">✦ Mi reflexión personal · opcional</span>
        <p class="mv-reflection-hint">Escribe lo que el Espíritu Santo te está mostrando con esta pregunta. Tus reflexiones se guardan en este dispositivo.</p>
        <textarea class="mv-reflection-textarea" data-qid="${qId}" placeholder="Mi reflexión..."></textarea>
        <div class="mv-reflection-saved">✓ Guardado</div>
      `;

      if (QUIZ_FORMAT === 'A') {
        const navButtons = card.querySelector('.nav-buttons');
        if (navButtons) card.insertBefore(area, navButtons);
        else card.appendChild(area);
      } else if (QUIZ_FORMAT === 'B') {
        const preguntaCard = card.querySelector('.pregunta-card');
        if (preguntaCard) {
          preguntaCard.appendChild(area);
        } else {
          const fb = card.querySelector('.feedback-wrap');
          if (fb) card.insertBefore(area, fb);
          else card.appendChild(area);
        }
      }

      const ta = area.querySelector('textarea');
      if (reflections[qId]) ta.value = reflections[qId];

      const savedIndicator = area.querySelector('.mv-reflection-saved');
      ta.addEventListener('input', debounce(function () {
        const data = getSection(SECTION_ID);
        data.reflections = data.reflections || {};
        data.reflections[qId] = ta.value;
        setSection(SECTION_ID, data);
        savedIndicator.classList.add('show');
        setTimeout(() => savedIndicator.classList.remove('show'), 1500);
        notifyProgress();
      }, 500));
    });

    addProgressPill();
    hookShareFunction();
    hookResultsDisplay();
  }

  // ────────────────────────────────────────────────────
  // 6. UPGRADE DIAGNÓSTICOS (Matrimonios)
  // ────────────────────────────────────────────────────
  function upgradeDiagnosticQuiz() {
    let targetParent = null;
    let insertBefore = null;

    const resultsCard = document.querySelector('.results-card, #results, .resultados, .results-screen, .final-results, [id*="result"], [id*="Result"]');
    if (resultsCard) {
      targetParent = resultsCard.parentElement;
      insertBefore = resultsCard;
    } else {
      const quizContainer = document.querySelector('.quiz-container, .container, main, body');
      if (quizContainer) targetParent = quizContainer;
    }
    if (!targetParent) return;
    if (document.querySelector('.mv-final-reflection')) return;

    const sectionData = getSection(SECTION_ID);
    const finalRef = sectionData.finalReflection || {};

    const ref = document.createElement('div');
    ref.className = 'mv-final-reflection';
    ref.innerHTML = `
      <h3>✦ Reflexión Final</h3>
      <p class="mv-fr-subtitle">Después de evaluar esta área de tu matrimonio, toma un momento para responder con honestidad. Tus respuestas se guardan en este dispositivo.</p>

      <div class="mv-fr-question">¿Qué área específica salió más fuerte de lo que esperabas?</div>
      <textarea data-key="strength" placeholder="Escribe aquí..."></textarea>

      <div class="mv-fr-question">¿Qué área necesita más atención y cuidado en las próximas semanas?</div>
      <textarea data-key="weakness" placeholder="Escribe aquí..."></textarea>

      <div class="mv-fr-question">¿Qué compromiso concreto asumes con tu cónyuge a partir de este resultado?</div>
      <textarea data-key="commitment" placeholder="Escribe aquí..."></textarea>

      <div class="mv-fr-question">¿Qué conversación pendiente necesitas tener con tu pareja esta semana?</div>
      <textarea data-key="conversation" placeholder="Escribe aquí..."></textarea>

      <div class="mv-reflection-saved" style="margin-top:14px;">✓ Guardado</div>
    `;

    if (insertBefore) targetParent.insertBefore(ref, insertBefore);
    else targetParent.appendChild(ref);

    const textareas = ref.querySelectorAll('textarea');
    textareas.forEach(ta => {
      const key = ta.getAttribute('data-key');
      if (finalRef && finalRef[key]) ta.value = finalRef[key];
      const savedIndicator = ref.querySelector('.mv-reflection-saved');
      ta.addEventListener('input', debounce(function () {
        const data = getSection(SECTION_ID);
        data.finalReflection = data.finalReflection || {};
        data.finalReflection[key] = ta.value;
        setSection(SECTION_ID, data);
        savedIndicator.classList.add('show');
        setTimeout(() => savedIndicator.classList.remove('show'), 1500);
        notifyProgress();
      }, 500));
    });

    addProgressPill();
    hookShareFunction();
    hookResultsDisplay();
  }

  // ────────────────────────────────────────────────────
  // 7. PILL FLOTANTE
  // ────────────────────────────────────────────────────
  let progressPill = null;
  function addProgressPill() {
    if (progressPill) return;
    progressPill = document.createElement('div');
    progressPill.className = 'mv-progress-pill';
    progressPill.title = 'Tu progreso se guarda automáticamente';
    document.body.appendChild(progressPill);
    updateProgressPill();
  }

  function updateProgressPill() {
    if (!progressPill) return;
    const data = getSection(SECTION_ID);
    let count = 0;
    if (IS_DIAGNOSTIC) {
      count = Object.values(data.finalReflection || {}).filter(v => v && v.trim()).length;
      progressPill.innerHTML = '✏️ ' + count + ' de 4 reflexiones';
    } else {
      count = Object.values(data.reflections || {}).filter(v => v && v.trim()).length;
      const total = QUESTION_CARDS.length || 12;
      progressPill.innerHTML = '✏️ ' + count + ' / ' + total + ' reflexiones';
    }
  }

  function notifyProgress() { updateProgressPill(); }

  // ────────────────────────────────────────────────────
  // 8. MARCAR COMPLETADO
  // ────────────────────────────────────────────────────
  function hookResultsDisplay() {
    const observer = new MutationObserver(() => {
      const candidates = document.querySelectorAll('.results-card, #results, #resultado, .resultado, .resultados, .results-screen, .final-results');
      candidates.forEach(el => {
        const isVisible = el.classList.contains('show') || el.classList.contains('active') ||
                         el.classList.contains('visible') ||
                         (el.style.display && el.style.display !== 'none' && getComputedStyle(el).display !== 'none');
        if (isVisible) {
          const data = getSection(SECTION_ID);
          if (!data.completed) {
            data.completed = true;
            setSection(SECTION_ID, data);
          }
        }
      });
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  }

  // ────────────────────────────────────────────────────
  // 9. HOOK A FUNCIÓN DE COMPARTIR
  // ────────────────────────────────────────────────────
  function hookShareFunction() {
    if (typeof window.buildSummary === 'function') {
      const originalBuild = window.buildSummary;
      window.buildSummary = function (...args) {
        let summary = originalBuild.apply(this, args);
        return appendReflections(summary);
      };
    }
    if (typeof window.buildResumen === 'function') {
      const originalBuild = window.buildResumen;
      window.buildResumen = function (...args) {
        let summary = originalBuild.apply(this, args);
        return appendReflections(summary);
      };
    }
  }

  function appendReflections(summary) {
    const data = getSection(SECTION_ID);
    const refs = data.reflections || {};
    const finalRef = data.finalReflection || {};
    const hasReflections = Object.values(refs).some(v => v && v.trim()) ||
                          Object.values(finalRef).some(v => v && v.trim());
    if (!hasReflections) return summary;

    summary += '\n\n═════════════════════════════\n';
    summary += '✦ MIS REFLEXIONES PERSONALES\n';
    summary += '═════════════════════════════\n\n';

    if (IS_DIAGNOSTIC && Object.keys(finalRef).length > 0) {
      const labels = {
        strength: '➤ Lo que salió más fuerte de lo esperado',
        weakness: '➤ Áreas que necesitan más atención',
        commitment: '➤ Mi compromiso concreto',
        conversation: '➤ Conversación pendiente con mi pareja'
      };
      ['strength','weakness','commitment','conversation'].forEach(key => {
        if (finalRef[key] && finalRef[key].trim()) {
          summary += labels[key] + ':\n';
          summary += finalRef[key].trim() + '\n\n';
        }
      });
    } else if (Object.keys(refs).length > 0) {
      const sortedKeys = Object.keys(refs).sort((a, b) => {
        const na = parseInt((a.match(/\d+/) || [0])[0]);
        const nb = parseInt((b.match(/\d+/) || [0])[0]);
        return na - nb;
      });
      sortedKeys.forEach(qId => {
        if (refs[qId] && refs[qId].trim()) {
          const num = (qId.match(/\d+/) || [''])[0];
          summary += '➤ Pregunta ' + num + ':\n';
          summary += refs[qId].trim() + '\n\n';
        }
      });
    }
    return summary;
  }

  // ────────────────────────────────────────────────────
  // 10. UPGRADE PARA EL ÍNDICE
  // ────────────────────────────────────────────────────
  function upgradeIndex() {
    const isDark = isDarkBackground();
    if (isDark) document.body.classList.add('mv-dark-theme');

    const allProgress = loadProgress();
    const completedCount = Object.values(allProgress).filter(s => s.completed).length;
    const inProgressCount = Object.values(allProgress).filter(s => {
      if (s.completed) return false;
      const refs = s.reflections || {};
      const final = s.finalReflection || {};
      return Object.values(refs).some(v => v && v.trim()) ||
             Object.values(final).some(v => v && v.trim());
    }).length;

    if (completedCount > 0 || inProgressCount > 0) {
      const banner = document.createElement('div');
      banner.className = 'mv-index-banner' + (isDark ? ' mv-dark-banner' : '');
      banner.innerHTML = `
        <div class="mv-index-banner-text">
          ✦ Tu progreso: <strong>${completedCount}</strong> completado${completedCount !== 1 ? 's' : ''}
          ${inProgressCount > 0 ? ` · <strong>${inProgressCount}</strong> en progreso` : ''}
        </div>
        <button onclick="window.MVUpgrade.resetAll()">Reiniciar todo</button>
      `;

      const target = document.querySelector('.intro, .grid-section, main, .container, body');
      if (target) {
        const firstChild = target.firstElementChild;
        if (firstChild && (firstChild.classList.contains('hero') || firstChild.classList.contains('header'))) {
          if (firstChild.nextSibling) target.insertBefore(banner, firstChild.nextSibling);
          else target.appendChild(banner);
        } else {
          target.insertBefore(banner, target.firstChild);
        }
      }
    }

    const links = document.querySelectorAll('a[href*=".html"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const fileMatch = href.match(/([^\/]+)\.html/);
      if (!fileMatch) return;
      const linkSectionId = fileMatch[1].toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const linkData = allProgress[linkSectionId];
      if (!linkData) return;

      const computedPosition = getComputedStyle(link).position;
      if (computedPosition === 'static') link.style.position = 'relative';

      let badge = null;
      if (linkData.completed) {
        badge = document.createElement('span');
        badge.className = 'mv-status-badge mv-status-overlay completed';
        badge.textContent = '✓ Completado';
      } else {
        const refs = linkData.reflections || {};
        const final = linkData.finalReflection || {};
        const hasContent = Object.values(refs).some(v => v && v.trim()) ||
                          Object.values(final).some(v => v && v.trim());
        if (hasContent) {
          badge = document.createElement('span');
          badge.className = 'mv-status-badge mv-status-overlay in-progress';
          badge.textContent = '✏ En progreso';
        }
      }

      if (badge && !link.querySelector('.mv-status-badge')) {
        link.appendChild(badge);
      }
    });
  }

  // ────────────────────────────────────────────────────
  // 11. API PÚBLICA
  // ────────────────────────────────────────────────────
  window.MVUpgrade = {
    resetAll: function () {
      if (!confirm('¿Estás seguro de reiniciar TODO tu progreso de "' + BOOK_NAME + '"? Esta acción no se puede deshacer y borrará todas tus reflexiones guardadas.')) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      location.reload();
    },
    resetSection: function (sectionId) {
      if (!confirm('¿Reiniciar las reflexiones de esta sección?')) return;
      const all = loadProgress();
      delete all[sectionId || SECTION_ID];
      saveProgress(all);
      location.reload();
    },
    getProgress: function () { return loadProgress(); },
    BOOK_ID: BOOK_ID,
    SECTION_ID: SECTION_ID,
    QUIZ_FORMAT: QUIZ_FORMAT
  };

  // ────────────────────────────────────────────────────
  // 12. INICIALIZACIÓN
  // ────────────────────────────────────────────────────
  function init() {
    injectStyles();

    if (IS_INDEX) {
      upgradeIndex();
    } else {
      if (IS_DIAGNOSTIC) {
        upgradeDiagnosticQuiz();
      } else if (QUIZ_FORMAT !== 'none') {
        upgradeReflectiveQuiz();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

})();
