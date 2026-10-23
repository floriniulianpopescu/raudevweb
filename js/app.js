/* ==========================================================================
   RAU DEV </> Software Engineering Club — Application Logic
   Handles Scoreboard + XP History Breakdown, Resources, News, Team & Admin UI
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'rau_dev_club_data_v1';

  let state = {
    data: null,
    isAdmin: false,
    serverConnected: false,
    expandedMembers: new Set(['mem-andreea']), // Expand first member by default to showcase XP breakdown
    scoreboardSearch: '',
    scoreboardLevelFilter: 'ALL',
    resourceCategoryFilter: 'ALL',
    resourceSearch: '',
    newsTopicFilter: 'ALL',
    teamDeptFilter: 'ALL',
    activeHeroTab: 'python'
  };

  /* --------------------------------------------------------------------------
     Initialization & Persistence
     -------------------------------------------------------------------------- */
  async function initApp() {
    await loadData();
    bindGlobalEvents();
    renderAll();
  }

  async function loadData() {
    // 1. Try local auto-save server API first
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('api/data', { cache: 'no-store' });
        if (res.ok) {
          const serverData = await res.json();
          state.data = serverData;
          state.serverConnected = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
          updateServerStatusIndicator();
          return;
        }
      } catch (_) {
        // Fallback to static JSON or localStorage
      }
    }

    // 2. Check localStorage for saved user edits
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        state.data = JSON.parse(cached);
        updateServerStatusIndicator();
        return;
      } catch (e) {
        console.warn('Could not parse cached data, resetting to default.', e);
      }
    }

    // 3. Try fetching static data/club-data.json if served over HTTP
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('data/club-data.json', { cache: 'no-store' });
        if (res.ok) {
          state.data = await res.json();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
          updateServerStatusIndicator();
          return;
        }
      } catch (_) {}
    }

    // 4. Fallback to embedded default data (works on file:// protocol)
    state.data = JSON.parse(JSON.stringify(window.RAU_DEV_DEFAULT_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    updateServerStatusIndicator();
  }

  async function persistData(toastMsg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));

    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.data, null, 2)
        });
        if (res.ok) {
          state.serverConnected = true;
          updateServerStatusIndicator();
        }
      } catch (_) {
        state.serverConnected = false;
        updateServerStatusIndicator();
      }
    }

    if (toastMsg) {
      showToast(toastMsg);
    }
  }

  function updateServerStatusIndicator() {
    const el = document.getElementById('persistence-status');
    if (!el) return;
    if (state.serverConnected) {
      el.textContent = 'Auto-saving to disk (data/club-data.json) & browser storage';
    } else {
      el.textContent = 'Saving to browser storage (use Export JSON to commit changes)';
    }
  }

  /* --------------------------------------------------------------------------
     Level & XP Calculation Helpers
     -------------------------------------------------------------------------- */
  function getMemberTotalXp(member) {
    if (!member.xpHistory || !Array.isArray(member.xpHistory)) return 0;
    return member.xpHistory.reduce((sum, item) => sum + (Number(item.xp) || 0), 0);
  }

  function getLevelInfoForXp(xp) {
    const levels = state.data.levels || [];
    let current = levels[0] || { level: 1, name: 'Rookie', neededXp: 0, reward: 'Digital Badge + Sticker', icon: '🌱' };
    let next = null;

    for (let i = 0; i < levels.length; i++) {
      if (xp >= levels[i].neededXp) {
        current = levels[i];
        next = levels[i + 1] || null;
      } else {
        break;
      }
    }

    let progressPct = 100;
    let xpIntoLevel = xp - current.neededXp;
    let xpForNext = 0;

    if (next) {
      const span = next.neededXp - current.neededXp;
      xpForNext = next.neededXp - xp;
      progressPct = Math.min(100, Math.max(0, Math.round((xpIntoLevel / span) * 100)));
    }

    return { current, next, progressPct, xpForNext };
  }

  function getSortedScoreboard() {
    const enriched = state.data.members.map((m) => {
      const totalXp = getMemberTotalXp(m);
      const levelInfo = getLevelInfoForXp(totalXp);
      return {
        ...m,
        totalXp,
        levelInfo
      };
    });

    enriched.sort((a, b) => {
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return a.name.localeCompare(b.name);
    });

    // Assign standard competition rank (ties share rank)
    let currentRank = 1;
    for (let i = 0; i < enriched.length; i++) {
      if (i > 0 && enriched[i].totalXp < enriched[i - 1].totalXp) {
        currentRank = i + 1;
      }
      enriched[i].rank = currentRank;
    }

    return enriched;
  }

  /* --------------------------------------------------------------------------
     Master Render Orchestrator
     -------------------------------------------------------------------------- */
  function renderAll() {
    renderHeroCodeWindow();
    renderScoreboardSection();
    renderResourcesSection();
    renderNewsSection();
    renderTeamSection();
  }

  /* --------------------------------------------------------------------------
     1. Hero Interactive Code Window
     -------------------------------------------------------------------------- */
  function renderHeroCodeWindow() {
    const bodyEl = document.getElementById('hero-code-body');
    if (!bodyEl) return;

    if (state.activeHeroTab === 'python') {
      bodyEl.innerHTML = `
        <div class="code-line"><span class="line-num">1</span><span><span class="tok-cm"># RAU DEV • Room 515 • Fridays 11:00–14:00</span></span></div>
        <div class="code-line"><span class="line-num">2</span><span><span class="tok-kw">def</span> <span class="tok-fn">solve</span>():</span></div>
        <div class="code-line"><span class="line-num">3</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-cm"># learn</span></span></div>
        <div class="code-line"><span class="line-num">4</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-cm"># practice</span></span></div>
        <div class="code-line"><span class="line-num">5</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-cm"># build together</span></span></div>
        <div class="code-line"><span class="line-num">6</span><span></span></div>
        <div class="code-line"><span class="line-num">7</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">while</span> <span class="tok-bool">True</span>:</span></div>
        <div class="code-line"><span class="line-num">8</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">learn</span>()</span></div>
        <div class="code-line"><span class="line-num">9</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">code</span>()</span></div>
        <div class="code-line"><span class="line-num">10</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">share</span>()</span></div>
        <div class="code-line"><span class="line-num">11</span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">improve</span>()</span></div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="code-line"><span class="line-num">1</span><span><span class="tok-cm">// 01 // WELCOME — First Session</span></span></div>
        <div class="code-line"><span class="line-num">2</span><span><span class="tok-kw">const</span> club = <span class="tok-str">"RAU DEV &lt;/&gt;"</span>;</span></div>
        <div class="code-line"><span class="line-num">3</span><span></span></div>
        <div class="code-line"><span class="line-num">4</span><span><span class="tok-kw">while</span> (curious) {</span></div>
        <div class="code-line"><span class="line-num">5</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">learn</span>();</span></div>
        <div class="code-line"><span class="line-num">6</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">build</span>();</span></div>
        <div class="code-line"><span class="line-num">7</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">share</span>();</span></div>
        <div class="code-line"><span class="line-num">8</span><span>}</span></div>
        <div class="code-line"><span class="line-num">9</span><span></span></div>
        <div class="code-line"><span class="line-num">10</span><span><span class="tok-cm">// Build skills. Share knowledge. Engineer together.</span></span></div>
      `;
    }
  }

  /* --------------------------------------------------------------------------
     2. Scoreboard, XP Breakdown & Admin XP Controls
     -------------------------------------------------------------------------- */
  function renderScoreboardSection() {
    const ranked = getSortedScoreboard();

    // Update top summary stats
    const totalMembersEl = document.getElementById('stat-total-members');
    const totalXpEl = document.getElementById('stat-total-xp');
    const totalActionsEl = document.getElementById('stat-total-actions');
    const topXpEl = document.getElementById('stat-top-xp');

    const totalClubXp = ranked.reduce((s, m) => s + m.totalXp, 0);
    const totalActions = ranked.reduce((s, m) => s + (m.xpHistory ? m.xpHistory.length : 0), 0);
    const topScore = ranked.length > 0 ? ranked[0].totalXp : 0;
    const leaders = ranked.filter((m) => m.totalXp === topScore && topScore > 0).map((m) => m.name);

    if (totalMembersEl) totalMembersEl.textContent = ranked.length;
    if (totalXpEl) totalXpEl.textContent = `${totalClubXp} XP`;
    if (totalActionsEl) totalActionsEl.textContent = totalActions;
    if (topXpEl) {
      topXpEl.textContent = `${topScore} XP`;
      const metaEl = document.getElementById('stat-top-leaders');
      if (metaEl) {
        metaEl.textContent = leaders.length ? `Led by ${leaders.join(', ')}` : 'Season in progress';
      }
    }

    // Populate Admin Member Dropdown & Action Preset Dropdown
    populateAdminXpSelects(ranked);

    // Populate Level Filter Dropdown
    const levelFilterEl = document.getElementById('scoreboard-level-filter');
    if (levelFilterEl && levelFilterEl.options.length <= 1) {
      state.data.levels.forEach((lvl) => {
        const opt = document.createElement('option');
        opt.value = lvl.name;
        opt.textContent = `${lvl.icon} ${lvl.name} (${lvl.neededXp}+ XP)`;
        levelFilterEl.appendChild(opt);
      });
    }

    // Filter members
    const q = state.scoreboardSearch.trim().toLowerCase();
    const filtered = ranked.filter((m) => {
      const matchesLevel =
        state.scoreboardLevelFilter === 'ALL' || m.levelInfo.current.name === state.scoreboardLevelFilter;
      if (!matchesLevel) return false;
      if (!q) return true;
      const inName = m.name.toLowerCase().includes(q) || (m.handle && m.handle.toLowerCase().includes(q));
      const inHistory = (m.xpHistory || []).some(
        (h) =>
          (h.action && h.action.toLowerCase().includes(q)) ||
          (h.details && h.details.toLowerCase().includes(q)) ||
          (h.session && h.session.toLowerCase().includes(q))
      );
      return inName || inHistory;
    });

    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="panel-card" style="text-align:center; padding: 36px;">
          <p style="color: var(--text-secondary);">No members match your current search or level filter.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = filtered
        .map((member) => {
          const isExpanded = state.expandedMembers.has(member.id);
          const { current, next, progressPct, xpForNext } = member.levelInfo;
          const initials = member.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          const avatarHtml = member.avatar
            ? `<img src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.name)}" class="member-avatar" />`
            : `<div class="member-avatar">${escapeHtml(initials)}</div>`;

          const historyItems = (member.xpHistory || []).slice().reverse();

          return `
            <div class="member-card ${member.rank === 1 ? 'top-rank' : ''} ${isExpanded ? 'expanded' : ''}" data-member-id="${escapeHtml(member.id)}">
              <div class="member-row-main" onclick="window.RauDevApp.toggleMemberExpand('${escapeHtml(member.id)}')">
                <div class="rank-badge ${member.rank === 1 ? 'rank-1' : ''}">#${member.rank}</div>
                <div class="member-identity">
                  ${avatarHtml}
                  <div>
                    <div class="member-name">${escapeHtml(member.name)}</div>
                    <div class="member-sub">
                      <span class="level-pill">${current.icon} ${escapeHtml(current.name)}</span>
                      <span>• ${(member.xpHistory || []).length} XP ${
                        (member.xpHistory || []).length === 1 ? 'action' : 'actions'
                      }</span>
                    </div>
                  </div>
                </div>
                <div class="member-progress-col">
                  <div class="xp-bar-track">
                    <div class="xp-bar-fill" style="width: ${progressPct}%;"></div>
                  </div>
                  <div class="xp-progress-label">
                    <span>${escapeHtml(current.name)}</span>
                    <span>${
                      next
                        ? `${xpForNext} XP to ${escapeHtml(next.name)} (${next.neededXp} XP)`
                        : 'Max Level Reached!'
                    }</span>
                  </div>
                </div>
                <div class="member-xp-col">
                  <span class="xp-total-badge">${member.totalXp} XP</span>
                  <button type="button" class="expand-btn" title="View how XP was gained">
                    ${isExpanded ? 'Hide Log ▲' : 'XP Log ▼'}
                  </button>
                </div>
              </div>

              <div class="member-xp-details">
                <div class="xp-history-header">
                  <span class="xp-history-title">
                    </> XP History & Breakdown — How ${escapeHtml(member.name)} earned ${member.totalXp} XP
                  </span>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:0.78rem; color:var(--text-secondary);">
                      Current Reward Tier: <strong style="color:var(--mint);">${escapeHtml(current.reward)}</strong>
                    </span>
                    <button type="button" class="btn btn-sm btn-outline-mint admin-only" onclick="window.RauDevApp.prefillMemberAward('${escapeHtml(member.id)}')">
                      + Award XP to ${escapeHtml(member.name)}
                    </button>
                    <button type="button" class="btn btn-sm btn-danger admin-only" onclick="window.RauDevApp.deleteMember('${escapeHtml(member.id)}')">
                      Remove Member
                    </button>
                  </div>
                </div>

                <div class="xp-log-list">
                  ${
                    historyItems.length === 0
                      ? `<div class="xp-log-item"><span class="xp-log-note">No XP actions recorded yet.</span></div>`
                      : historyItems
                          .map(
                            (entry) => `
                        <div class="xp-log-item">
                          <div class="xp-log-left">
                            <div class="xp-log-action">
                              <span>${escapeHtml(entry.action)}</span>
                              ${
                                entry.session
                                  ? `<span class="xp-log-session">${escapeHtml(entry.session)}</span>`
                                  : ''
                              }
                              ${
                                entry.date
                                  ? `<span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${escapeHtml(entry.date)}</span>`
                                  : ''
                              }
                            </div>
                            <div class="xp-log-note">${escapeHtml(entry.details || 'Verified club activity')}</div>
                          </div>
                          <div class="xp-log-right">
                            <span class="xp-delta ${Number(entry.xp) < 0 ? 'negative' : ''}">
                              ${Number(entry.xp) >= 0 ? `+${entry.xp}` : entry.xp} XP
                            </span>
                            <button
                              type="button"
                              class="btn btn-sm btn-danger admin-only"
                              title="Delete this XP entry"
                              onclick="window.RauDevApp.deleteXpEntry('${escapeHtml(member.id)}', '${escapeHtml(entry.id)}')"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      `
                          )
                          .join('')
                  }
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Render Levels Ladder Sidebar
    const levelsListEl = document.getElementById('levels-ladder-list');
    if (levelsListEl) {
      levelsListEl.innerHTML = state.data.levels
        .map(
          (lvl) => `
          <div class="level-tier-row ${lvl.neededXp >= 3500 ? 'legend' : ''}">
            <div>
              <div class="level-tier-name">
                <span>${lvl.icon}</span>
                <span>${escapeHtml(lvl.name)}</span>
              </div>
              <div class="level-tier-reward">🎁 ${escapeHtml(lvl.reward)}</div>
            </div>
            <div class="level-tier-xp">${lvl.neededXp} XP</div>
          </div>
        `
        )
        .join('');
    }

    // Render Official XP Actions Sidebar
    const xpActionsListEl = document.getElementById('xp-actions-reference-list');
    if (xpActionsListEl) {
      xpActionsListEl.innerHTML = state.data.xpActions
        .map(
          (act) => `
          <div class="xp-action-row" title="${escapeHtml(act.description || '')}">
            <span>${escapeHtml(act.label)}</span>
            <span class="xp-action-pts">+${act.xp} XP</span>
          </div>
        `
        )
        .join('');
    }
  }

  function populateAdminXpSelects(rankedMembers) {
    const memberSelect = document.getElementById('admin-xp-member');
    if (memberSelect) {
      const prevVal = memberSelect.value;
      memberSelect.innerHTML =
        `<option value="__NEW__">+ Create & Award New Member...</option>` +
        rankedMembers
          .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} (Currently ${m.totalXp} XP — ${escapeHtml(m.levelInfo.current.name)})</option>`)
          .join('');
      if (prevVal && (prevVal === '__NEW__' || rankedMembers.some((m) => m.id === prevVal))) {
        memberSelect.value = prevVal;
      } else if (rankedMembers.length > 0) {
        memberSelect.value = rankedMembers[0].id;
      }
      toggleNewMemberInput();
    }

    const actionSelect = document.getElementById('admin-xp-action-preset');
    if (actionSelect && actionSelect.options.length === 0) {
      actionSelect.innerHTML =
        state.data.xpActions
          .map(
            (a) =>
              `<option value="${escapeHtml(a.id)}" data-xp="${a.xp}" data-label="${escapeHtml(a.label)}">${escapeHtml(a.label)} (+${a.xp} XP)</option>`
          )
          .join('') + `<option value="__CUSTOM__" data-xp="10" data-label="">Custom XP Action / Bonus...</option>`;
      handlePresetActionChange();
    }
  }

  function toggleNewMemberInput() {
    const memberSelect = document.getElementById('admin-xp-member');
    const newMemberGroup = document.getElementById('new-member-name-group');
    if (!memberSelect || !newMemberGroup) return;
    newMemberGroup.style.display = memberSelect.value === '__NEW__' ? 'flex' : 'none';
  }

  function handlePresetActionChange() {
    const actionSelect = document.getElementById('admin-xp-action-preset');
    const customLabelGroup = document.getElementById('custom-action-label-group');
    const xpPointsInput = document.getElementById('admin-xp-points');
    if (!actionSelect || !xpPointsInput) return;

    const selectedOpt = actionSelect.options[actionSelect.selectedIndex];
    if (actionSelect.value === '__CUSTOM__') {
      if (customLabelGroup) customLabelGroup.style.display = 'flex';
    } else {
      if (customLabelGroup) customLabelGroup.style.display = 'none';
      const presetXp = selectedOpt ? selectedOpt.getAttribute('data-xp') : 10;
      xpPointsInput.value = presetXp;
    }
  }

  /* --------------------------------------------------------------------------
     3. Resources Section (Downloadable Solutions & Lectures)
     -------------------------------------------------------------------------- */
  function renderResourcesSection() {
    const gridEl = document.getElementById('resources-grid');
    if (!gridEl) return;

    const q = state.resourceSearch.trim().toLowerCase();
    const filtered = state.data.resources.filter((res) => {
      const catMatch =
        state.resourceCategoryFilter === 'ALL' ||
        res.category === state.resourceCategoryFilter ||
        res.type === state.resourceCategoryFilter;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        res.title.toLowerCase().includes(q) ||
        (res.description && res.description.toLowerCase().includes(q)) ||
        (res.language && res.language.toLowerCase().includes(q)) ||
        (res.session && res.session.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="panel-card" style="grid-column: 1 / -1; text-align:center; padding: 36px;">
          <p style="color: var(--text-secondary);">No lectures or solutions match your filter.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered
      .map((res) => {
        const isSolution = res.type === 'solution';
        return `
          <article class="resource-card">
            <div>
              <div class="resource-top-meta">
                <span class="resource-badge ${isSolution ? 'solution' : 'lecture'}">
                  ${isSolution ? '</> Solution Code' : '📚 Lecture / Deck'}
                </span>
                ${res.xpTag ? `<span class="resource-xp-pill">${escapeHtml(res.xpTag)}</span>` : ''}
              </div>
              <h3 class="resource-title">${escapeHtml(res.title)}</h3>
              <p class="resource-desc">${escapeHtml(res.description)}</p>
              <div class="resource-meta-tags">
                ${res.session ? `<span>🗓️ ${escapeHtml(res.session)}</span>` : ''}
                ${res.language ? `<span>💻 ${escapeHtml(res.language)}</span>` : ''}
                ${res.difficulty ? `<span>⚡ ${escapeHtml(res.difficulty)}</span>` : ''}
                ${res.format ? `<span>📦 ${escapeHtml(res.format)}</span>` : ''}
              </div>
            </div>

            <div class="resource-actions">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onclick="window.RauDevApp.downloadResource('${escapeHtml(res.id)}')"
              >
                ⬇ Download ${res.downloadFilename ? `(${escapeHtml(getExtension(res.downloadFilename))})` : ''}
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                onclick="window.RauDevApp.previewResource('${escapeHtml(res.id)}')"
              >
                👁️ ${isSolution ? 'View Code' : 'Preview Notes'}
              </button>
              ${
                res.problemUrl
                  ? `<a href="${escapeHtml(res.problemUrl)}" target="_blank" rel="noopener" class="btn btn-outline-mint btn-sm">Problem ↗</a>`
                  : ''
              }
              ${
                res.externalSolutionUrl
                  ? `<a href="${escapeHtml(res.externalSolutionUrl)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">CSES Paste ↗</a>`
                  : ''
              }
              <button
                type="button"
                class="btn btn-danger btn-sm admin-only"
                onclick="window.RauDevApp.deleteResource('${escapeHtml(res.id)}')"
              >
                Delete
              </button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function getExtension(filename) {
    if (!filename) return 'File';
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : 'File';
  }

  /* --------------------------------------------------------------------------
     4. News & Updatable Topics Section
     -------------------------------------------------------------------------- */
  function renderNewsSection() {
    const gridEl = document.getElementById('news-grid');
    if (!gridEl) return;

    // Populate topic filter pills dynamically
    const topicsSet = new Set(['ALL']);
    state.data.news.forEach((item) => {
      if (item.topic) topicsSet.add(item.topic);
    });

    const filterContainer = document.getElementById('news-topic-pills');
    if (filterContainer) {
      filterContainer.innerHTML = Array.from(topicsSet)
        .map(
          (topic) => `
          <button
            type="button"
            class="filter-pill ${state.newsTopicFilter === topic ? 'active' : ''}"
            onclick="window.RauDevApp.setNewsTopicFilter('${escapeHtml(topic)}')"
          >
            ${topic === 'ALL' ? 'All Topics' : escapeHtml(topic)}
          </button>
        `
        )
        .join('');
    }

    const sortedNews = state.data.news.slice().sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
      return (b.date || '').localeCompare(a.date || '');
    });

    const filtered = sortedNews.filter(
      (n) => state.newsTopicFilter === 'ALL' || n.topic === state.newsTopicFilter
    );

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="panel-card" style="grid-column: 1 / -1; text-align:center; padding: 36px;">
          <p style="color: var(--text-secondary);">No news stories found under this topic.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered
      .map(
        (post) => `
        <article class="news-card ${post.pinned ? 'pinned' : ''}">
          <div>
            <div class="news-meta">
              <span class="topic-tag">${escapeHtml(post.topic || 'Club Update')}</span>
              ${post.pinned ? `<span class="pinned-badge">📌 Pinned Topic</span>` : ''}
            </div>
            <h3 class="news-title">${escapeHtml(post.title)}</h3>
            <p class="news-summary">${escapeHtml(post.summary)}</p>
          </div>

          <div class="news-footer">
            <div>
              <span>📅 ${escapeHtml(post.date || 'Recent')}</span>
              ${post.author ? `<span> • ✍️ ${escapeHtml(post.author)}</span>` : ''}
            </div>
            <div style="display:flex; gap:8px;">
              <button
                type="button"
                class="btn btn-outline-mint btn-sm"
                onclick="window.RauDevApp.openNewsModal('${escapeHtml(post.id)}')"
              >
                Read Topic →
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm admin-only"
                onclick="window.RauDevApp.openEditNewsModal('${escapeHtml(post.id)}')"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-danger btn-sm admin-only"
                onclick="window.RauDevApp.deleteNewsPost('${escapeHtml(post.id)}')"
              >
                ✕
              </button>
            </div>
          </div>
        </article>
      `
      )
      .join('');
  }

  /* --------------------------------------------------------------------------
     5. Team Section (Executive, Tech, Logistics, Tutoring)
     -------------------------------------------------------------------------- */
  function renderTeamSection() {
    const gridEl = document.getElementById('team-grid');
    if (!gridEl) return;

    const filtered = state.data.team.filter((member) => {
      if (state.teamDeptFilter === 'ALL') return true;
      return (member.departments || []).includes(state.teamDeptFilter);
    });

    gridEl.innerHTML = filtered
      .map(
        (member) => `
        <div class="team-card">
          <div class="team-photo-wrap">
            <img src="${escapeHtml(member.photo)}" alt="${escapeHtml(member.name)}" class="team-photo" />
          </div>
          <h3 class="team-name">${escapeHtml(member.name)}</h3>
          <div class="team-roles">
            ${(member.roles || []).map((r) => `<span class="team-role-pill">${escapeHtml(r)}</span>`).join('')}
          </div>
          <p class="team-bio">${escapeHtml(member.bio || '')}</p>
        </div>
      `
      )
      .join('');
  }

  /* --------------------------------------------------------------------------
     Interactive Actions & Event Bindings
     -------------------------------------------------------------------------- */
  function bindGlobalEvents() {
    // Scoreboard search & filter
    const sbSearch = document.getElementById('scoreboard-search');
    if (sbSearch) {
      sbSearch.addEventListener('input', (e) => {
        state.scoreboardSearch = e.target.value;
        renderScoreboardSection();
      });
    }

    const sbLevelFilter = document.getElementById('scoreboard-level-filter');
    if (sbLevelFilter) {
      sbLevelFilter.addEventListener('change', (e) => {
        state.scoreboardLevelFilter = e.target.value;
        renderScoreboardSection();
      });
    }

    // Resource search
    const resSearch = document.getElementById('resource-search');
    if (resSearch) {
      resSearch.addEventListener('input', (e) => {
        state.resourceSearch = e.target.value;
        renderResourcesSection();
      });
    }

    // Admin XP Form bindings
    const memberSelect = document.getElementById('admin-xp-member');
    if (memberSelect) {
      memberSelect.addEventListener('change', toggleNewMemberInput);
    }

    const actionSelect = document.getElementById('admin-xp-action-preset');
    if (actionSelect) {
      actionSelect.addEventListener('change', handlePresetActionChange);
    }

    const awardForm = document.getElementById('admin-award-xp-form');
    if (awardForm) {
      awardForm.addEventListener('submit', handleAwardXpSubmit);
    }

    // Set default date in XP form to today
    const xpDateInput = document.getElementById('admin-xp-date');
    if (xpDateInput && !xpDateInput.value) {
      xpDateInput.value = new Date().toISOString().slice(0, 10);
    }

    // Close modals on backdrop click or Escape key
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach((m) => m.classList.remove('open'));
      }
    });
  }

  /* --------------------------------------------------------------------------
     Admin Scoreboard Handlers
     -------------------------------------------------------------------------- */
  async function handleAwardXpSubmit(e) {
    e.preventDefault();
    const memberSelect = document.getElementById('admin-xp-member');
    const newMemberNameInput = document.getElementById('admin-new-member-name');
    const newMemberRoleInput = document.getElementById('admin-new-member-role');
    const actionSelect = document.getElementById('admin-xp-action-preset');
    const customActionInput = document.getElementById('admin-xp-custom-action');
    const pointsInput = document.getElementById('admin-xp-points');
    const sessionInput = document.getElementById('admin-xp-session');
    const dateInput = document.getElementById('admin-xp-date');
    const detailsInput = document.getElementById('admin-xp-details');

    const xpValue = Number(pointsInput.value);
    if (Number.isNaN(xpValue) || xpValue === 0) {
      showToast('Please enter a non-zero XP amount.');
      return;
    }

    let actionLabel = '';
    if (actionSelect.value === '__CUSTOM__') {
      actionLabel = (customActionInput.value || '').trim() || 'Custom Achievement';
    } else {
      const opt = actionSelect.options[actionSelect.selectedIndex];
      actionLabel = opt ? opt.getAttribute('data-label') : 'XP Action';
    }

    const sessionLabel = (sessionInput.value || '').trim() || 'Club Session';
    const dateLabel = dateInput.value || new Date().toISOString().slice(0, 10);
    const detailsText = (detailsInput.value || '').trim() || `${actionLabel} verified during ${sessionLabel}.`;

    let targetMember = null;
    if (memberSelect.value === '__NEW__') {
      const newName = (newMemberNameInput.value || '').trim();
      if (!newName) {
        showToast('Please enter the new member’s name.');
        newMemberNameInput.focus();
        return;
      }
      const newId = 'mem-' + newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      targetMember = {
        id: newId,
        name: newName,
        handle: '@' + newName.toLowerCase().replace(/\s+/g, '.'),
        year: (newMemberRoleInput && newMemberRoleInput.value.trim()) || 'RAU Student',
        xpHistory: []
      };
      state.data.members.push(targetMember);
      newMemberNameInput.value = '';
    } else {
      targetMember = state.data.members.find((m) => m.id === memberSelect.value);
    }

    if (!targetMember) {
      showToast('Could not find selected member.');
      return;
    }

    const newEntry = {
      id: 'xp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      action: actionLabel,
      xp: xpValue,
      date: dateLabel,
      session: sessionLabel,
      details: detailsText
    };

    targetMember.xpHistory = targetMember.xpHistory || [];
    targetMember.xpHistory.push(newEntry);

    // Expand this member on the scoreboard so the user sees the new XP entry right away
    state.expandedMembers.add(targetMember.id);
    detailsInput.value = '';

    renderScoreboardSection();
    memberSelect.value = targetMember.id;
    toggleNewMemberInput();

    await persistData(
      `Awarded ${xpValue >= 0 ? '+' + xpValue : xpValue} XP (${actionLabel}) to ${targetMember.name}!`
    );
  }

  async function deleteXpEntry(memberId, entryId) {
    if (!state.isAdmin) return;
    const member = state.data.members.find((m) => m.id === memberId);
    if (!member) return;
    const entry = (member.xpHistory || []).find((x) => x.id === entryId);
    member.xpHistory = (member.xpHistory || []).filter((x) => x.id !== entryId);
    renderScoreboardSection();
    await persistData(`Removed XP entry (${entry ? entry.action : entryId}) from ${member.name}.`);
  }

  async function deleteMember(memberId) {
    if (!state.isAdmin) return;
    const member = state.data.members.find((m) => m.id === memberId);
    if (!member) return;
    if (!window.confirm(`Remove ${member.name} from the scoreboard?`)) return;
    state.data.members = state.data.members.filter((m) => m.id !== memberId);
    renderScoreboardSection();
    await persistData(`Removed ${member.name} from the scoreboard.`);
  }

  function prefillMemberAward(memberId) {
    const memberSelect = document.getElementById('admin-xp-member');
    const detailsInput = document.getElementById('admin-xp-details');
    const panel = document.getElementById('admin-xp-panel');
    if (memberSelect) {
      memberSelect.value = memberId;
      toggleNewMemberInput();
    }
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (detailsInput) {
      setTimeout(() => detailsInput.focus(), 300);
    }
  }

  /* Batch Attendance / XP Modal */
  function openBatchXpModal() {
    const listContainer = document.getElementById('batch-members-checklist');
    if (!listContainer) return;
    const ranked = getSortedScoreboard();
    listContainer.innerHTML = ranked
      .map(
        (m) => `
        <label style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(5,19,36,0.7); border:1px solid var(--border-subtle); border-radius:8px; cursor:pointer;">
          <input type="checkbox" name="batchMember" value="${escapeHtml(m.id)}" checked />
          <span style="font-weight:600; color:#fff;">${escapeHtml(m.name)}</span>
          <span style="font-family:var(--font-mono); font-size:0.76rem; color:var(--mint); margin-left:auto;">${m.totalXp} XP</span>
        </label>
      `
      )
      .join('');

    const batchActionSelect = document.getElementById('batch-xp-action');
    if (batchActionSelect && batchActionSelect.options.length === 0) {
      batchActionSelect.innerHTML = state.data.xpActions
        .map(
          (a) =>
            `<option value="${escapeHtml(a.id)}" data-xp="${a.xp}" data-label="${escapeHtml(a.label)}">${escapeHtml(a.label)} (+${a.xp} XP)</option>`
        )
        .join('');
    }

    const batchDate = document.getElementById('batch-xp-date');
    if (batchDate && !batchDate.value) {
      batchDate.value = new Date().toISOString().slice(0, 10);
    }

    document.getElementById('batch-xp-modal').classList.add('open');
  }

  async function submitBatchXp(e) {
    e.preventDefault();
    const checkboxes = Array.from(document.querySelectorAll('input[name="batchMember"]:checked'));
    if (checkboxes.length === 0) {
      showToast('Select at least one member.');
      return;
    }

    const actionSelect = document.getElementById('batch-xp-action');
    const opt = actionSelect.options[actionSelect.selectedIndex];
    const actionLabel = opt ? opt.getAttribute('data-label') : 'Attend a meetup';
    const xpValue = Number(opt ? opt.getAttribute('data-xp') : 10);
    const sessionLabel = (document.getElementById('batch-xp-session').value || '').trim() || 'Friday Session';
    const dateLabel = document.getElementById('batch-xp-date').value || new Date().toISOString().slice(0, 10);
    const detailsText =
      (document.getElementById('batch-xp-details').value || '').trim() ||
      `${actionLabel} during ${sessionLabel}.`;

    checkboxes.forEach((cb) => {
      const m = state.data.members.find((mem) => mem.id === cb.value);
      if (m) {
        m.xpHistory = m.xpHistory || [];
        m.xpHistory.push({
          id: 'xp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          action: actionLabel,
          xp: xpValue,
          date: dateLabel,
          session: sessionLabel,
          details: detailsText
        });
      }
    });

    document.getElementById('batch-xp-modal').classList.remove('open');
    renderScoreboardSection();
    await persistData(`Awarded +${xpValue} XP (${actionLabel}) to ${checkboxes.length} members!`);
  }

  /* --------------------------------------------------------------------------
     Resource Preview, Download & Admin Creation
     -------------------------------------------------------------------------- */
  function previewResource(resourceId) {
    const res = state.data.resources.find((r) => r.id === resourceId);
    if (!res) return;

    const titleEl = document.getElementById('resource-preview-title');
    const metaEl = document.getElementById('resource-preview-meta');
    const codeEl = document.getElementById('resource-preview-code');
    const dlBtn = document.getElementById('resource-preview-download-btn');

    if (titleEl) titleEl.textContent = res.title;
    if (metaEl) {
      metaEl.innerHTML = `
        <span>${escapeHtml(res.category || '')}</span>
        ${res.session ? ` • <span>${escapeHtml(res.session)}</span>` : ''}
        ${res.language ? ` • <span>${escapeHtml(res.language)}</span>` : ''}
        ${res.xpTag ? ` • <strong style="color:var(--mint);">${escapeHtml(res.xpTag)}</strong>` : ''}
      `;
    }
    if (codeEl) {
      codeEl.textContent = res.previewContent || res.description || 'Download file to view full contents.';
    }
    if (dlBtn) {
      dlBtn.onclick = () => downloadResource(res.id);
    }

    document.getElementById('resource-preview-modal').classList.add('open');
  }

  function downloadResource(resourceId) {
    const res = state.data.resources.find((r) => r.id === resourceId);
    if (!res) return;

    // If this is a custom-created resource with inline code/text and no static file URL (or blob)
    if (res.isCustomGenerated && res.previewContent) {
      const blob = new Blob([res.previewContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.downloadFilename || 'rau_dev_resource.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloading ${res.downloadFilename || res.title}...`);
      return;
    }

    // Otherwise trigger download of the real file in downloads/
    if (res.downloadUrl) {
      const a = document.createElement('a');
      a.href = res.downloadUrl;
      a.download = res.downloadFilename || '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading ${res.downloadFilename || res.title}...`);
    }
  }

  function openAddResourceModal() {
    document.getElementById('add-resource-form').reset();
    document.getElementById('add-resource-modal').classList.add('open');
  }

  async function submitNewResource(e) {
    e.preventDefault();
    const title = document.getElementById('res-form-title').value.trim();
    const type = document.getElementById('res-form-type').value;
    const category =
      type === 'solution' ? 'Challenge Solutions' : document.getElementById('res-form-category').value;
    const session = document.getElementById('res-form-session').value.trim() || 'Club Session';
    const language = document.getElementById('res-form-language').value.trim();
    const difficulty = document.getElementById('res-form-difficulty').value.trim();
    const xpTag = document.getElementById('res-form-xptag').value.trim();
    const problemUrl = document.getElementById('res-form-problem-url').value.trim();
    const filename =
      document.getElementById('res-form-filename').value.trim() ||
      (type === 'solution' ? 'solution.py' : 'lecture_notes.md');
    const description = document.getElementById('res-form-desc').value.trim();
    const content = document.getElementById('res-form-content').value;

    const newRes = {
      id: 'res-' + Date.now(),
      title,
      type,
      category,
      session,
      date: new Date().toISOString().slice(0, 10),
      language,
      difficulty,
      xpTag,
      problemUrl,
      format: filename,
      description,
      downloadUrl: `downloads/${type === 'solution' ? 'solutions' : 'lectures'}/${filename}`,
      downloadFilename: filename,
      previewContent: content,
      isCustomGenerated: true
    };

    // If local server is connected, also write the file to downloads/
    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch('api/upload-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: type === 'solution' ? 'solutions' : 'lectures',
            filename,
            content
          })
        });
        if (resp.ok) {
          newRes.isCustomGenerated = false;
        }
      } catch (_) {}
    }

    state.data.resources.unshift(newRes);
    document.getElementById('add-resource-modal').classList.remove('open');
    renderResourcesSection();
    await persistData(`Added downloadable resource: "${title}"!`);
  }

  async function deleteResource(resourceId) {
    if (!state.isAdmin) return;
    const res = state.data.resources.find((r) => r.id === resourceId);
    if (!res) return;
    if (!window.confirm(`Delete resource "${res.title}"?`)) return;
    state.data.resources = state.data.resources.filter((r) => r.id !== resourceId);
    renderResourcesSection();
    await persistData(`Deleted resource "${res.title}".`);
  }

  /* --------------------------------------------------------------------------
     News Reader & Admin News Editor
     -------------------------------------------------------------------------- */
  function openNewsModal(newsId) {
    const post = state.data.news.find((n) => n.id === newsId);
    if (!post) return;

    document.getElementById('news-reader-topic').textContent = post.topic || 'Club Update';
    document.getElementById('news-reader-title').textContent = post.title;
    document.getElementById('news-reader-meta').textContent = `📅 ${post.date || ''} • ✍️ ${post.author || 'RAU DEV Team'}`;
    document.getElementById('news-reader-body').innerHTML = renderSimpleMarkdown(post.content || post.summary || '');
    document.getElementById('news-reader-modal').classList.add('open');
  }

  function openNewNewsModal() {
    document.getElementById('news-editor-id').value = '';
    document.getElementById('news-editor-modal-title').textContent = 'Publish New Club Topic / News';
    document.getElementById('news-editor-title').value = '';
    document.getElementById('news-editor-topic').value = 'Announcement';
    document.getElementById('news-editor-author').value = 'RAU DEV Executive & Tech Team';
    document.getElementById('news-editor-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('news-editor-pinned').checked = false;
    document.getElementById('news-editor-summary').value = '';
    document.getElementById('news-editor-content').value = '';
    document.getElementById('news-editor-modal').classList.add('open');
  }

  function openEditNewsModal(newsId) {
    const post = state.data.news.find((n) => n.id === newsId);
    if (!post) return;
    document.getElementById('news-editor-id').value = post.id;
    document.getElementById('news-editor-modal-title').textContent = 'Edit News Topic';
    document.getElementById('news-editor-title').value = post.title || '';
    document.getElementById('news-editor-topic').value = post.topic || 'Announcement';
    document.getElementById('news-editor-author').value = post.author || '';
    document.getElementById('news-editor-date').value = post.date || new Date().toISOString().slice(0, 10);
    document.getElementById('news-editor-pinned').checked = Boolean(post.pinned);
    document.getElementById('news-editor-summary').value = post.summary || '';
    document.getElementById('news-editor-content').value = post.content || '';
    document.getElementById('news-editor-modal').classList.add('open');
  }

  async function submitNewsEditor(e) {
    e.preventDefault();
    const id = document.getElementById('news-editor-id').value;
    const title = document.getElementById('news-editor-title').value.trim();
    const topic = document.getElementById('news-editor-topic').value.trim() || 'Announcement';
    const author = document.getElementById('news-editor-author').value.trim() || 'RAU DEV Team';
    const date = document.getElementById('news-editor-date').value || new Date().toISOString().slice(0, 10);
    const pinned = document.getElementById('news-editor-pinned').checked;
    const summary = document.getElementById('news-editor-summary').value.trim();
    const content = document.getElementById('news-editor-content').value.trim();

    if (id) {
      const existing = state.data.news.find((n) => n.id === id);
      if (existing) {
        existing.title = title;
        existing.topic = topic;
        existing.author = author;
        existing.date = date;
        existing.pinned = pinned;
        existing.summary = summary;
        existing.content = content;
      }
    } else {
      state.data.news.unshift({
        id: 'news-' + Date.now(),
        title,
        topic,
        author,
        date,
        pinned,
        summary,
        content
      });
    }

    document.getElementById('news-editor-modal').classList.remove('open');
    renderNewsSection();
    await persistData(id ? `Updated topic "${title}"!` : `Published new topic "${title}"!`);
  }

  async function deleteNewsPost(newsId) {
    if (!state.isAdmin) return;
    const post = state.data.news.find((n) => n.id === newsId);
    if (!post) return;
    if (!window.confirm(`Delete news post "${post.title}"?`)) return;
    state.data.news = state.data.news.filter((n) => n.id !== newsId);
    renderNewsSection();
    await persistData(`Deleted news post "${post.title}".`);
  }

  /* --------------------------------------------------------------------------
     Admin Mode Authentication & JSON Export/Import
     -------------------------------------------------------------------------- */
  function toggleAdminMode() {
    if (state.isAdmin) {
      state.isAdmin = false;
      document.body.classList.remove('admin-mode');
      const btn = document.getElementById('admin-mode-btn');
      if (btn) {
        btn.classList.remove('unlocked');
        btn.innerHTML = `<span class="status-dot"></span> Admin Mode`;
      }
      showToast('Locked Admin Mode.');
      return;
    }

    const pinInput = document.getElementById('admin-pin-input');
    if (pinInput) pinInput.value = '';
    document.getElementById('admin-pin-modal').classList.add('open');
    if (pinInput) setTimeout(() => pinInput.focus(), 100);
  }

  function submitAdminPin(e) {
    e.preventDefault();
    const pinInput = document.getElementById('admin-pin-input');
    const entered = (pinInput.value || '').trim();
    const expected = (state.data.clubInfo && state.data.clubInfo.adminPin) || '5150';

    if (entered === expected) {
      state.isAdmin = true;
      document.body.classList.add('admin-mode');
      document.getElementById('admin-pin-modal').classList.remove('open');
      const btn = document.getElementById('admin-mode-btn');
      if (btn) {
        btn.classList.add('unlocked');
        btn.innerHTML = `<span class="status-dot"></span> Admin Unlocked`;
      }
      showToast('Admin Mode unlocked! You can now update the Scoreboard, Resources, and News.');
    } else {
      showToast('Incorrect Admin PIN. (Default PIN for Room 515 is 5150)');
    }
  }

  function exportClubDataJson() {
    const jsonStr = JSON.stringify(state.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'club-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported club-data.json!');
  }

  function importClubDataJson(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.members || !parsed.resources || !parsed.news) {
          showToast('Invalid club-data.json structure.');
          return;
        }
        state.data = parsed;
        renderAll();
        await persistData('Imported club-data.json successfully!');
      } catch (err) {
        showToast('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  }

  async function resetToDefaultData() {
    if (!window.confirm('Reset all scoreboard logs, news, and resources back to the initial Session 01 data?')) {
      return;
    }
    state.data = JSON.parse(JSON.stringify(window.RAU_DEV_DEFAULT_DATA));
    renderAll();
    await persistData('Reset data to initial Session 01 state.');
  }

  /* --------------------------------------------------------------------------
     Utilities (Markdown formatter, HTML escaping, Toasts)
     -------------------------------------------------------------------------- */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSimpleMarkdown(md) {
    const lines = escapeHtml(md).split('\n');
    let html = '';
    let inList = false;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      if (line.startsWith('### ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h4 style="color:var(--mint); font-family:var(--font-display); margin:16px 0 8px;">${formatInlineMd(
          line.slice(4)
        )}</h4>`;
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        if (!inList) {
          html += `<ul style="margin:8px 0 14px 20px; display:flex; flex-direction:column; gap:6px; color:var(--text-secondary);">`;
          inList = true;
        }
        html += `<li>${formatInlineMd(line.slice(2))}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p style="margin-bottom:12px; color:var(--text-secondary); line-height:1.7;">${formatInlineMd(
          line
        )}</p>`;
      }
    }

    if (inList) html += '</ul>';
    return html;
  }

  function formatInlineMd(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#ffffff;">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="font-family:var(--font-mono); background:rgba(28,226,154,0.12); color:var(--mint); padding:2px 6px; border-radius:4px;">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1 ↗</a>');
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color:var(--mint); font-family:var(--font-mono); font-weight:700;">&lt;/&gt;</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3400);
  }

  /* --------------------------------------------------------------------------
     Public API attached to window.RauDevApp
     -------------------------------------------------------------------------- */
  window.RauDevApp = {
    switchHeroTab(tab, btnEl) {
      state.activeHeroTab = tab;
      document.querySelectorAll('.code-tab').forEach((b) => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      renderHeroCodeWindow();
    },
    toggleMemberExpand(memberId) {
      if (state.expandedMembers.has(memberId)) {
        state.expandedMembers.delete(memberId);
      } else {
        state.expandedMembers.add(memberId);
      }
      renderScoreboardSection();
    },
    expandAllMembers() {
      if (state.expandedMembers.size === state.data.members.length) {
        state.expandedMembers.clear();
      } else {
        state.data.members.forEach((m) => state.expandedMembers.add(m.id));
      }
      renderScoreboardSection();
    },
    setResourceCategoryFilter(cat, btnEl) {
      state.resourceCategoryFilter = cat;
      document.querySelectorAll('#resource-filter-pills .filter-pill').forEach((b) => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      renderResourcesSection();
    },
    setNewsTopicFilter(topic) {
      state.newsTopicFilter = topic;
      renderNewsSection();
    },
    setTeamDeptFilter(dept, btnEl) {
      state.teamDeptFilter = dept;
      document.querySelectorAll('#team-filter-pills .filter-pill').forEach((b) => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      renderTeamSection();
    },
    toggleAdminMode,
    submitAdminPin,
    prefillMemberAward,
    deleteXpEntry,
    deleteMember,
    openBatchXpModal,
    submitBatchXp,
    previewResource,
    downloadResource,
    openAddResourceModal,
    submitNewResource,
    deleteResource,
    openNewsModal,
    openNewNewsModal,
    openEditNewsModal,
    submitNewsEditor,
    deleteNewsPost,
    exportClubDataJson,
    importClubDataJson,
    resetToDefaultData,
    copyPreviewCode() {
      const codeEl = document.getElementById('resource-preview-code');
      if (!codeEl) return;
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        showToast('Copied to clipboard!');
      });
    }
  };

  document.addEventListener('DOMContentLoaded', initApp);
})();
