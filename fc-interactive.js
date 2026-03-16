/* ============================================================
   FREEDOM CODE — Interactive Course Engine
   Shared JS for all 30 day pages.

   Handles:
   - Breathwork timer (box, 4-7-8, wim hof)
   - Journal autosave to localStorage
   - Section completion checkboxes + persistence
   - Day completion percentage + confetti
   - Streak tracking
   - Top nav progress bar
   - Next-day soft lock
   ============================================================ */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  const FC_PREFIX = 'fc_';
  const TOTAL_DAYS = 30;

  /* Detect current day from URL or data attribute */
  function getCurrentDay() {
    const attr = document.body.dataset.fcDay;
    if (attr) return parseInt(attr, 10);
    const match = window.location.pathname.match(/day-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  const DAY = getCurrentDay();

  /* ---------- LOCALSTORAGE HELPERS ---------- */
  function getKey(key) { return FC_PREFIX + key; }
  function load(key, fallback) {
    try { const v = localStorage.getItem(getKey(key)); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(getKey(key), JSON.stringify(val)); } catch {}
  }

  /* ---------- TOP NAVIGATION BAR ---------- */
  function buildTopNav() {
    const nav = document.createElement('div');
    nav.className = 'fc-topnav';

    const streak = getStreak();
    const overallPct = getOverallProgress();

    const prevDay = DAY > 1 ? DAY - 1 : null;
    const nextDay = DAY < TOTAL_DAYS ? DAY + 1 : null;

    nav.innerHTML = `
      <div class="fc-topnav-inner">
        <div class="fc-topnav-left">
          <span class="fc-topnav-day">Day ${DAY} / ${TOTAL_DAYS}</span>
          ${streak > 0 ? `<span class="fc-topnav-streak" title="${streak} day streak">${streak} day streak</span>` : ''}
        </div>
        <div class="fc-topnav-center">
          <div class="fc-progress-track">
            <div class="fc-progress-fill" style="width: ${overallPct}%"></div>
          </div>
        </div>
        <div class="fc-topnav-right">
          <a class="fc-nav-arrow ${prevDay ? '' : 'disabled'}" href="${prevDay ? '../day-' + prevDay + '/index.html' : '#'}" title="Previous Day">&#8592;</a>
          <a class="fc-nav-hub" href="../course.html" title="Course Hub">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
          </a>
          <a class="fc-nav-arrow fc-next-day-link ${nextDay ? '' : 'disabled'}" href="${nextDay ? '../day-' + nextDay + '/index.html' : '#'}" title="Next Day">&#8594;</a>
        </div>
      </div>`;

    document.body.prepend(nav);
  }

  /* ---------- COMPLETION BAR ---------- */
  function buildCompletionBar() {
    const header = document.querySelector('.header');
    if (!header) return;

    const bar = document.createElement('div');
    bar.className = 'fc-completion-bar';
    bar.innerHTML = `
      <div class="fc-completion-row">
        <span class="fc-completion-label">Today</span>
        <div class="fc-completion-track">
          <div class="fc-completion-fill" id="fc-day-completion-fill"></div>
        </div>
        <span class="fc-completion-pct" id="fc-day-completion-pct">0%</span>
      </div>`;
    header.after(bar);
  }

  /* ---------- SECTION COMPLETION CHECKBOXES ---------- */
  const SECTION_KEYS = ['morning', 'read', 'action', 'video', 'reflection'];
  const SECTION_LABELS_MAP = {
    'morning protocol': 'morning',
    'daily read': 'read',
    'daily action': 'action',
    "today's session": 'video',
    'evening reflection': 'reflection'
  };

  function getSectionChecks() {
    return load('day_' + DAY + '_sections', {});
  }

  function saveSectionCheck(sectionKey, checked) {
    const data = getSectionChecks();
    data[sectionKey] = checked;
    save('day_' + DAY + '_sections', data);
  }

  function buildSectionCheckboxes() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      const label = section.querySelector('.section-label');
      if (!label) return;

      const labelText = label.textContent.trim().toLowerCase();
      const sectionKey = SECTION_LABELS_MAP[labelText];
      if (!sectionKey) return;

      const checks = getSectionChecks();
      const isChecked = checks[sectionKey] === true;

      const checkEl = document.createElement('div');
      checkEl.className = 'fc-section-check' + (isChecked ? ' checked' : '');
      checkEl.dataset.section = sectionKey;
      checkEl.innerHTML = `
        <div class="fc-section-checkbox">
          <svg viewBox="0 0 12 10"><polyline points="1 5 4.5 8.5 11 1.5"/></svg>
        </div>
        <span class="fc-section-check-label">${isChecked ? 'Done' : 'Mark as done'}</span>`;

      checkEl.addEventListener('click', function () {
        const nowChecked = !this.classList.contains('checked');
        this.classList.toggle('checked', nowChecked);
        this.querySelector('.fc-section-check-label').textContent = nowChecked ? 'Done' : 'Mark as done';
        saveSectionCheck(sectionKey, nowChecked);
        updateCompletionUI();
      });

      section.appendChild(checkEl);
    });
  }

  function getCompletionPct() {
    const checks = getSectionChecks();
    const total = SECTION_KEYS.length;
    let done = 0;
    SECTION_KEYS.forEach(k => { if (checks[k] === true) done++; });
    return Math.round((done / total) * 100);
  }

  function isDayComplete(day) {
    const checks = load('day_' + day + '_sections', {});
    return SECTION_KEYS.every(k => checks[k] === true);
  }

  function updateCompletionUI() {
    const pct = getCompletionPct();
    const fill = document.getElementById('fc-day-completion-fill');
    const pctLabel = document.getElementById('fc-day-completion-pct');
    if (fill) fill.style.width = pct + '%';
    if (pctLabel) pctLabel.textContent = pct + '%';

    /* Update badge */
    let badge = document.querySelector('.fc-day-complete-badge');
    if (pct === 100) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'fc-day-complete-badge';
        badge.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 9 7 13 15 5"/></svg> Day Complete';
        const header = document.querySelector('.header');
        if (header) header.appendChild(badge);
      }
      badge.classList.add('visible');
      markDayComplete(DAY);
      triggerConfetti();
    } else if (badge) {
      badge.classList.remove('visible');
    }

    /* Update next-day lock */
    updateNextDayLock();

    /* Recalc streak */
    updateStreakDisplay();

    /* Overall progress */
    updateOverallProgress();
  }

  function markDayComplete(day) {
    const completed = load('completed_days', []);
    if (!completed.includes(day)) {
      completed.push(day);
      save('completed_days', completed);
    }
    /* Set completion date for streak calc */
    const dates = load('completion_dates', {});
    if (!dates[day]) {
      dates[day] = new Date().toISOString().split('T')[0];
      save('completion_dates', dates);
    }
  }

  /* ---------- STREAK CALCULATION ---------- */
  function getStreak() {
    const completed = load('completed_days', []);
    if (completed.length === 0) return 0;

    /* Count consecutive completed days starting from the highest completed day going backwards */
    const sorted = [...completed].sort((a, b) => a - b);
    let streak = 0;
    /* Find current position: the latest completed day */
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (i === sorted.length - 1) {
        streak = 1;
      } else if (sorted[i] === sorted[i + 1] - 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function updateStreakDisplay() {
    const streak = getStreak();
    const el = document.querySelector('.fc-topnav-streak');
    if (streak > 0 && !el) {
      const left = document.querySelector('.fc-topnav-left');
      if (left) {
        const span = document.createElement('span');
        span.className = 'fc-topnav-streak';
        span.title = streak + ' day streak';
        span.textContent = streak + ' day streak';
        left.appendChild(span);
      }
    } else if (el) {
      if (streak > 0) {
        el.textContent = streak + ' day streak';
        el.title = streak + ' day streak';
      } else {
        el.remove();
      }
    }
  }

  /* ---------- OVERALL PROGRESS ---------- */
  function getOverallProgress() {
    const completed = load('completed_days', []);
    return Math.round((completed.length / TOTAL_DAYS) * 100);
  }

  function updateOverallProgress() {
    const pct = getOverallProgress();
    const fill = document.querySelector('.fc-progress-fill');
    if (fill) fill.style.width = pct + '%';
  }

  /* ---------- NEXT-DAY SOFT LOCK ---------- */
  function updateNextDayLock() {
    const nextLink = document.querySelector('.fc-next-day-link');
    if (!nextLink || DAY >= TOTAL_DAYS) return;

    const complete = isDayComplete(DAY);
    const nextFooterBtn = document.querySelector('.nav-btn[href*="day-' + (DAY + 1) + '"]');

    if (!complete) {
      nextLink.addEventListener('click', lockHandler);
      if (nextFooterBtn) {
        nextFooterBtn.classList.add('locked');
        nextFooterBtn.addEventListener('click', lockHandler);
      }
    } else {
      nextLink.removeEventListener('click', lockHandler);
      if (nextFooterBtn) {
        nextFooterBtn.classList.remove('locked');
        nextFooterBtn.removeEventListener('click', lockHandler);
      }
    }
  }

  function lockHandler(e) {
    if (!isDayComplete(DAY)) {
      e.preventDefault();
      showToast("Finish today's practice first");
    }
  }

  /* ---------- TOAST ---------- */
  let toastTimer = null;
  function showToast(msg) {
    let toast = document.querySelector('.fc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'fc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => {
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    });
  }

  /* ---------- CONFETTI ---------- */
  let confettiTriggered = false;
  function triggerConfetti() {
    if (confettiTriggered) return;
    confettiTriggered = true;

    const canvas = document.createElement('canvas');
    canvas.className = 'fc-confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const pieces = [];
    const colors = ['#b8943c', '#d4b563', '#e8d5a3', '#9a7a2e', '#f7f5f2', '#ffffff'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rotation += p.rotSpeed;
        if (frame > maxFrames - 40) p.opacity -= 0.025;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  }

  /* ---------- BREATHWORK TIMER ---------- */
  /*
   * Usage: Add this HTML where you want the timer:
   *   <div class="fc-breathwork" data-pattern="box" data-rounds="3"></div>
   *
   * Patterns:
   *   box     = 4-4-4-4 (inhale-hold-exhale-hold)
   *   478     = 4-7-8 (inhale-hold-exhale)
   *   wimhof  = 30 power breaths (fast 1.5s inhale/1s exhale) + hold
   */

  const BREATH_PATTERNS = {
    box: {
      name: 'Box Breathing',
      desc: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s',
      phases: [
        { label: 'Breathe In', seconds: 4, type: 'inhale' },
        { label: 'Hold', seconds: 4, type: 'hold' },
        { label: 'Breathe Out', seconds: 4, type: 'exhale' },
        { label: 'Hold', seconds: 4, type: 'hold' }
      ],
      defaultRounds: 3
    },
    '478': {
      name: '4-7-8 Breathing',
      desc: 'Inhale 4s, Hold 7s, Exhale 8s',
      phases: [
        { label: 'Breathe In', seconds: 4, type: 'inhale' },
        { label: 'Hold', seconds: 7, type: 'hold' },
        { label: 'Breathe Out', seconds: 8, type: 'exhale' }
      ],
      defaultRounds: 3
    },
    wimhof: {
      name: 'Wim Hof Style',
      desc: '30 power breaths + retention hold',
      phases: [
        { label: 'Breathe In', seconds: 2, type: 'inhale' },
        { label: 'Breathe Out', seconds: 1, type: 'exhale' }
      ],
      defaultRounds: 30,
      retentionHold: 30
    }
  };

  function initBreathworkTimers() {
    document.querySelectorAll('.fc-breathwork').forEach(container => {
      const patternKey = container.dataset.pattern || 'box';
      const rounds = parseInt(container.dataset.rounds, 10) || BREATH_PATTERNS[patternKey]?.defaultRounds || 3;
      const pattern = BREATH_PATTERNS[patternKey];
      if (!pattern) return;

      container.innerHTML = `
        <div class="fc-breathwork-card" id="fc-breath-card-${patternKey}">
          <div class="fc-breathwork-title">${pattern.name}</div>
          <div class="fc-breathwork-subtitle">${pattern.desc}</div>

          <div class="fc-breath-ring-wrap">
            <div class="fc-breath-ring"></div>
            <div class="fc-breath-circle"></div>
            <div class="fc-breath-label"></div>
          </div>

          <div class="fc-breath-countdown"></div>
          <div class="fc-breath-phase">Ready</div>
          <div class="fc-breath-cycles">Round 0 / ${rounds}</div>

          <div class="fc-breath-controls">
            <button class="fc-breath-btn fc-breath-btn-start">Start</button>
            <button class="fc-breath-btn fc-breath-btn-reset" style="display:none">Reset</button>
          </div>
        </div>`;

      const card = container.querySelector('.fc-breathwork-card');
      const circle = card.querySelector('.fc-breath-circle');
      const ring = card.querySelector('.fc-breath-ring');
      const labelEl = card.querySelector('.fc-breath-label');
      const countdownEl = card.querySelector('.fc-breath-countdown');
      const phaseEl = card.querySelector('.fc-breath-phase');
      const cycleEl = card.querySelector('.fc-breath-cycles');
      const startBtn = card.querySelector('.fc-breath-btn-start');
      const resetBtn = card.querySelector('.fc-breath-btn-reset');

      let running = false;
      let paused = false;
      let currentRound = 0;
      let currentPhase = 0;
      let secondsLeft = 0;
      let intervalId = null;
      let isRetention = false;

      function resetCircle() {
        circle.className = 'fc-breath-circle';
        circle.style.animation = 'none';
        circle.offsetHeight; /* force reflow */
        circle.style.animation = '';
        ring.classList.remove('active');
        labelEl.textContent = '';
      }

      function setPhaseVisual(phase) {
        resetCircle();
        ring.classList.add('active');

        if (phase.type === 'inhale') {
          circle.style.setProperty('--inhale-duration', phase.seconds + 's');
          circle.classList.add('inhale');
          labelEl.textContent = '';
        } else if (phase.type === 'exhale') {
          circle.style.setProperty('--exhale-duration', phase.seconds + 's');
          circle.classList.add('exhale');
          labelEl.textContent = '';
        } else {
          circle.classList.add('hold');
          labelEl.textContent = '';
        }
      }

      function tick() {
        if (paused) return;

        secondsLeft--;
        countdownEl.textContent = secondsLeft;

        if (secondsLeft <= 0) {
          /* Move to next phase or round */
          if (isRetention) {
            /* Retention done, finish */
            finish();
            return;
          }

          currentPhase++;
          if (currentPhase >= pattern.phases.length) {
            currentPhase = 0;
            currentRound++;
            cycleEl.textContent = `Round ${currentRound} / ${rounds}`;

            if (currentRound >= rounds) {
              /* Check for retention hold (Wim Hof) */
              if (pattern.retentionHold) {
                isRetention = true;
                secondsLeft = pattern.retentionHold;
                countdownEl.textContent = secondsLeft;
                phaseEl.textContent = 'Hold';
                resetCircle();
                labelEl.textContent = '';
                return;
              }
              finish();
              return;
            }
          }

          startPhase();
        }
      }

      function startPhase() {
        const phase = pattern.phases[currentPhase];
        secondsLeft = phase.seconds;
        countdownEl.textContent = secondsLeft;
        phaseEl.textContent = phase.label;
        setPhaseVisual(phase);
      }

      function start() {
        if (running && !paused) {
          /* Pause */
          paused = true;
          startBtn.textContent = 'Resume';
          startBtn.className = 'fc-breath-btn fc-breath-btn-start';
          return;
        }

        if (paused) {
          paused = false;
          startBtn.textContent = 'Pause';
          startBtn.className = 'fc-breath-btn fc-breath-btn-pause';
          return;
        }

        running = true;
        paused = false;
        currentRound = 0;
        currentPhase = 0;
        isRetention = false;
        confettiTriggered = false;
        card.classList.remove('complete');

        startBtn.textContent = 'Pause';
        startBtn.className = 'fc-breath-btn fc-breath-btn-pause';
        resetBtn.style.display = '';

        cycleEl.textContent = `Round ${currentRound} / ${rounds}`;
        startPhase();
        intervalId = setInterval(tick, 1000);
      }

      function finish() {
        clearInterval(intervalId);
        intervalId = null;
        running = false;
        paused = false;
        resetCircle();

        countdownEl.textContent = '';
        phaseEl.textContent = 'Done';
        cycleEl.textContent = `${rounds} / ${rounds} rounds done`;
        card.classList.add('complete');

        startBtn.textContent = 'Start Again';
        startBtn.className = 'fc-breath-btn fc-breath-btn-start';
      }

      function reset() {
        clearInterval(intervalId);
        intervalId = null;
        running = false;
        paused = false;
        isRetention = false;
        currentRound = 0;
        currentPhase = 0;
        resetCircle();

        countdownEl.textContent = '';
        phaseEl.textContent = 'Ready';
        cycleEl.textContent = `Round 0 / ${rounds}`;
        card.classList.remove('complete');

        startBtn.textContent = 'Start';
        startBtn.className = 'fc-breath-btn fc-breath-btn-start';
        resetBtn.style.display = 'none';
      }

      startBtn.addEventListener('click', start);
      resetBtn.addEventListener('click', reset);
    });
  }

  /* ---------- JOURNAL BOXES ---------- */
  /*
   * Usage: Add where you want journal prompts:
   *   <div class="fc-journal"
   *        data-prompts='["Question 1?","Question 2?","Question 3?"]'>
   *   </div>
   */

  function initJournalBoxes() {
    document.querySelectorAll('.fc-journal').forEach(container => {
      let prompts;
      try { prompts = JSON.parse(container.dataset.prompts); }
      catch { return; }

      if (!Array.isArray(prompts) || prompts.length === 0) return;

      const savedEntries = load('day_' + DAY + '_journal', {});
      let html = '';

      prompts.forEach((prompt, i) => {
        const key = 'q' + (i + 1);
        const savedText = savedEntries[key] || '';
        html += `
          <div class="fc-journal-prompt">
            <div class="fc-journal-label">
              <span class="fc-journal-number">${i + 1}</span>
              <span class="fc-journal-question">${prompt}</span>
            </div>
            <textarea
              class="fc-journal-textarea"
              data-key="${key}"
              placeholder="Write your thoughts here..."
              rows="4"
            >${savedText}</textarea>
            <div class="fc-journal-meta">
              <span class="fc-journal-saved" data-saved="${key}">Saved</span>
            </div>
          </div>`;
      });

      container.innerHTML = html;

      /* Autosave with debounce */
      container.querySelectorAll('.fc-journal-textarea').forEach(textarea => {
        let saveTimeout = null;

        textarea.addEventListener('input', function () {
          clearTimeout(saveTimeout);
          const allEntries = load('day_' + DAY + '_journal', {});
          allEntries[this.dataset.key] = this.value;

          saveTimeout = setTimeout(() => {
            save('day_' + DAY + '_journal', allEntries);
            const savedEl = container.querySelector(`[data-saved="${this.dataset.key}"]`);
            if (savedEl) {
              savedEl.classList.add('show');
              setTimeout(() => savedEl.classList.remove('show'), 1500);
            }
          }, 600);
        });

        /* Auto-resize */
        textarea.addEventListener('input', function () {
          this.style.height = 'auto';
          this.style.height = this.scrollHeight + 'px';
        });

        /* Initial resize if has content */
        if (textarea.value) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    });
  }

  /* ---------- MIGRATE OLD CHECKLIST CHECKBOXES ---------- */
  /* The old pages have inline onclick toggles on .check-box elements.
     We replace those with persistent localStorage versions. */
  function migrateOldChecklists() {
    const checklists = document.querySelectorAll('.checklist');
    checklists.forEach((list, listIdx) => {
      const items = list.querySelectorAll('.check-box');
      const savedChecks = load('day_' + DAY + '_tasks_' + listIdx, []);

      items.forEach((box, itemIdx) => {
        /* Remove old onclick */
        box.removeAttribute('onclick');

        /* Restore state */
        if (savedChecks[itemIdx]) box.classList.add('checked');
        else box.classList.remove('checked');

        box.addEventListener('click', function () {
          this.classList.toggle('checked');
          const allChecks = [];
          items.forEach((b, i) => { allChecks[i] = b.classList.contains('checked'); });
          save('day_' + DAY + '_tasks_' + listIdx, allChecks);
        });
      });
    });
  }

  /* ---------- REMOVE OLD PROGRESS BAR ---------- */
  function removeOldProgressBar() {
    const old = document.querySelector('.progress-bar');
    if (old) old.remove();
  }

  /* ---------- INLINE STYLE OVERRIDES FOR LIGHT THEME ---------- */
  /* The old day pages have inline style colors for the "tomorrow" section.
     Override them with CSS-friendly values. */
  function fixInlineColors() {
    document.querySelectorAll('.section[style]').forEach(section => {
      section.querySelectorAll('p[style]').forEach(p => {
        const style = p.getAttribute('style') || '';
        let newStyle = style
          .replace(/color\s*:\s*#fff\b/gi, 'color: #2c2c2c')
          .replace(/color\s*:\s*#888\b/gi, 'color: #999590')
          .replace(/color\s*:\s*#666\b/gi, 'color: #999590')
          .replace(/color\s*:\s*#555\b/gi, 'color: #999590')
          .replace(/color\s*:\s*#444\b/gi, 'color: #999590');
        /* Also handle font-family references to old fonts */
        newStyle = newStyle.replace(/Playfair Display/g, 'DM Serif Display');
        p.setAttribute('style', newStyle);
      });
    });

    /* Fix footer inline styles */
    document.querySelectorAll('.footer p[style]').forEach(p => {
      const style = p.getAttribute('style') || '';
      let newStyle = style
        .replace(/color\s*:\s*#444\b/gi, 'color: #999590')
        .replace(/color\s*:\s*#555\b/gi, 'color: #999590');
      p.setAttribute('style', newStyle);
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    removeOldProgressBar();
    fixInlineColors();
    buildTopNav();
    buildCompletionBar();
    buildSectionCheckboxes();
    migrateOldChecklists();
    initBreathworkTimers();
    initJournalBoxes();
    updateCompletionUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
