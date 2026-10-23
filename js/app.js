/* ==========================================================================
   RAU DEV </> Software Engineering Club — Minimalist Multi-Page Engine
   Pages: index.html | scoreboard.html | resources.html | news.html | team.html
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'rau_dev_club_data_v1';
  const ADMIN_TOKEN_KEY = 'rau_dev_session_token_v1';

  let state = {
    data: null,
    isAdmin: false,
    sessionToken: sessionStorage.getItem(ADMIN_TOKEN_KEY) || '',
    serverConnected: false,
    expandedMembers: new Set(['mem-andreea']),
    scoreboardSearch: '',
    scoreboardLevelFilter: 'ALL',
    scoreboardSort: 'XP_DESC',
    resourceCategoryFilter: 'ALL',
    resourceSearch: '',
    newsTopicFilter: 'ALL',
    newsSearch: '',
    teamDeptFilter: 'ALL'
  };

  /* --------------------------------------------------------------------------
     Initialization & Data Persistence
     -------------------------------------------------------------------------- */
  async function initApp() {
    await verifyExistingSession();
    await loadData();
    syncAdminUiState();
    updateSidebarBadges();
    bindGlobalEvents();
    renderCurrentPage();

    if (window.location.hash === '#admin' && !state.isAdmin) {
      openAdminPasswordPrompt();
    }
  }

  async function verifyExistingSession() {
    if (!state.sessionToken) {
      state.isAdmin = false;
      return;
    }
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('api/session', {
          method: 'GET',
          headers: { 'X-Admin-Token': state.sessionToken },
          cache: 'no-store'
        });
        if (res.ok) {
          state.isAdmin = true;
          return;
        }
      } catch (_) {}
    }
    // Invalid or expired token -> clear immediately
    state.isAdmin = false;
    state.sessionToken = '';
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  async function loadData() {
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
      } catch (_) {}
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        state.data = JSON.parse(cached);
        if (state.data.clubInfo) {
          state.data.clubInfo.instagramUrl = 'https://www.instagram.com/raudev.club/';
          state.data.clubInfo.linkedinUrl = 'https://www.linkedin.com/company/rau-dev/';
          delete state.data.clubInfo.adminPin;
        }
        updateServerStatusIndicator();
        return;
      } catch (e) {
        console.warn('Could not parse cached data, resetting to default.', e);
      }
    }

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

    state.data = JSON.parse(JSON.stringify(window.RAU_DEV_DEFAULT_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    updateServerStatusIndicator();
  }

  async function persistData(toastMsg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    updateSidebarBadges();

    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': state.sessionToken || ''
          },
          body: JSON.stringify(state.data, null, 2)
        });
        if (res.ok) {
          state.serverConnected = true;
          updateServerStatusIndicator();
        } else if (res.status === 401) {
          state.isAdmin = false;
          state.sessionToken = '';
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          syncAdminUiState();
          renderCurrentPage();
          showToast('Unauthorized: Valid session token required to save changes.');
          return;
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
      el.textContent = 'Auto-saving to data/club-data.json';
    } else {
      el.textContent = 'Saving to browser storage';
    }
  }

  function updateSidebarBadges() {
    if (!state.data) return;
    const sbCount = document.getElementById('nav-badge-members');
    const resCount = document.getElementById('nav-badge-resources');
    const newsCount = document.getElementById('nav-badge-news');
    if (sbCount) sbCount.textContent = (state.data.members || []).length;
    if (resCount) resCount.textContent = (state.data.resources || []).length;
    if (newsCount) newsCount.textContent = (state.data.news || []).length;
  }

  function syncAdminUiState() {
    if (state.isAdmin) {
      document.body.classList.add('admin-mode');
    } else {
      document.body.classList.remove('admin-mode');
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
    const enriched = (state.data.members || []).map((m) => {
      const totalXp = getMemberTotalXp(m);
      const levelInfo = getLevelInfoForXp(totalXp);
      const lastDate =
        (m.xpHistory || []).reduce((latest, h) => (!latest || (h.date && h.date > latest) ? h.date : latest), '') ||
        '2026-10-16';
      return {
        ...m,
        totalXp,
        levelInfo,
        actionCount: (m.xpHistory || []).length,
        lastDate
      };
    });

    const byXp = enriched.slice().sort((a, b) => {
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return a.name.localeCompare(b.name);
    });

    let currentRank = 1;
    for (let i = 0; i < byXp.length; i++) {
      if (i > 0 && byXp[i].totalXp < byXp[i - 1].totalXp) {
        currentRank = i + 1;
      }
      byXp[i].rank = currentRank;
    }

    if (state.scoreboardSort === 'NAME_ASC') {
      byXp.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.scoreboardSort === 'ACTIONS_DESC') {
      byXp.sort((a, b) => b.actionCount - a.actionCount || b.totalXp - a.totalXp);
    } else if (state.scoreboardSort === 'RECENT_DESC') {
      byXp.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || b.totalXp - a.totalXp);
    }

    return byXp;
  }

  /* --------------------------------------------------------------------------
     Page Dispatcher
     -------------------------------------------------------------------------- */
  function renderCurrentPage() {
    if (document.getElementById('leaderboard-list')) {
      renderScoreboardSection();
    }
    if (document.getElementById('resources-grid')) {
      renderResourcesSection();
    }
    if (document.getElementById('news-grid')) {
      renderNewsSection();
    }
    if (document.getElementById('team-grid')) {
      renderTeamSection();
    }
  }

  /* --------------------------------------------------------------------------
     Minimalist Interactive Scoreboard
     -------------------------------------------------------------------------- */
  function renderScoreboardSection() {
    const ranked = getSortedScoreboard();

    // Populate Admin Dropdowns
    populateAdminXpSelects(ranked);

    // Populate Level Filter Dropdown
    const levelFilterEl = document.getElementById('scoreboard-level-filter');
    if (levelFilterEl) {
      const currentFilterVal = state.scoreboardLevelFilter;
      levelFilterEl.innerHTML =
        `<option value="ALL">All Ranks (${ranked.length})</option>` +
        state.data.levels
          .map((lvl) => {
            const count = ranked.filter((m) => m.levelInfo.current.name === lvl.name).length;
            return `<option value="${escapeHtml(lvl.name)}">${lvl.icon} ${escapeHtml(lvl.name)} — ${lvl.neededXp}+ XP (${count})</option>`;
          })
          .join('');
      levelFilterEl.value = currentFilterVal;
    }

    // Render Leaderboard Cards
    renderLeaderboardCards(ranked);

    // Render Levels Ladder Sidebar
    const levelsListEl = document.getElementById('levels-ladder-list');
    if (levelsListEl) {
      levelsListEl.innerHTML = state.data.levels
        .map((lvl) => {
          const isActive = state.scoreboardLevelFilter === lvl.name;
          const countAtTier = ranked.filter((m) => m.levelInfo.current.name === lvl.name).length;
          return `
            <div
              class="level-tier-row ${lvl.neededXp >= 3500 ? 'legend' : ''} ${isActive ? 'active-tier' : ''}"
              onclick="window.RauDevApp.filterByLevelTier('${escapeHtml(lvl.name)}')"
              title="Click to filter by ${escapeHtml(lvl.name)}"
            >
              <div>
                <div class="level-tier-name">
                  <span>${lvl.icon}</span>
                  <span>${escapeHtml(lvl.name)}</span>
                  ${
                    countAtTier > 0
                      ? `<span style="font-family:var(--font-mono); font-size:0.68rem; padding:1px 6px; border-radius:99px; background:var(--mint-soft); color:var(--mint);">${countAtTier}</span>`
                      : ''
                  }
                </div>
                <div class="level-tier-reward">🎁 ${escapeHtml(lvl.reward)}</div>
              </div>
              <div class="level-tier-xp">${lvl.neededXp} XP</div>
            </div>
          `;
        })
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

  function renderLeaderboardCards(ranked) {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    const q = state.scoreboardSearch.trim().toLowerCase();
    const filtered = ranked.filter((m) => {
      const matchesLevel =
        state.scoreboardLevelFilter === 'ALL' || m.levelInfo.current.name === state.scoreboardLevelFilter;
      if (!matchesLevel) return false;
      if (!q) return true;
      const inName =
        m.name.toLowerCase().includes(q) ||
        (m.handle && m.handle.toLowerCase().includes(q)) ||
        (m.year && m.year.toLowerCase().includes(q));
      const inHistory = (m.xpHistory || []).some(
        (h) =>
          (h.action && h.action.toLowerCase().includes(q)) ||
          (h.details && h.details.toLowerCase().includes(q)) ||
          (h.session && h.session.toLowerCase().includes(q))
      );
      return inName || inHistory;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="panel-card" style="text-align:center; padding: 32px;">
          <p style="color: var(--text-secondary); margin-bottom:12px;">No members match your current filter.</p>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.RauDevApp.resetScoreboardFilters()">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered
      .map((member) => {
        const isExpanded = state.expandedMembers.has(member.id);
        const { current, next, progressPct, xpForNext } = member.levelInfo;
        const initials = getInitials(member.name);

        const avatarHtml = member.avatar
          ? `<img src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.name)}" class="member-avatar" />`
          : `<div class="member-avatar">${escapeHtml(initials)}</div>`;

        const historyItems = (member.xpHistory || []).slice().reverse();

        return `
          <div id="member-card-${escapeHtml(member.id)}" class="member-card ${member.rank === 1 ? 'top-rank' : ''} ${isExpanded ? 'expanded' : ''}">
            <div class="member-row-main" onclick="window.RauDevApp.toggleMemberExpand('${escapeHtml(member.id)}')">
              <div class="rank-badge ${member.rank === 1 ? 'rank-1' : ''}">#${member.rank}</div>
              <div class="member-identity">
                ${avatarHtml}
                <div>
                  <div class="member-name">
                    <span>${escapeHtml(member.name)}</span>
                    ${member.handle ? `<span class="member-handle">${escapeHtml(member.handle)}</span>` : ''}
                  </div>
                  <div class="member-sub">
                    <span class="level-pill">${current.icon} ${escapeHtml(current.name)}</span>
                    ${member.year ? `<span>• ${escapeHtml(member.year)}</span>` : ''}
                    <span>• ${member.actionCount} XP ${member.actionCount === 1 ? 'action' : 'actions'}</span>
                  </div>
                </div>
              </div>
              <div class="member-progress-col">
                <div class="xp-bar-track">
                  <div class="xp-bar-fill" style="width: ${progressPct}%;"></div>
                </div>
                <div class="xp-progress-label">
                  <span>${escapeHtml(current.name)}</span>
                  <span>${next ? `${xpForNext} XP to ${escapeHtml(next.name)}` : 'Max Level'}</span>
                </div>
              </div>
              <div class="member-xp-col">
                <span class="xp-total-badge">${member.totalXp} XP</span>
                <button type="button" class="expand-btn" title="View how XP was gained">
                  ${isExpanded ? '▲' : '▼'}
                </button>
              </div>
            </div>

            <div class="member-xp-details">
              <div class="xp-history-header">
                <span class="xp-history-title">
                  XP Breakdown — ${escapeHtml(member.name)} (${member.totalXp} XP)
                </span>
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                  <span style="font-size:0.78rem; color:var(--text-secondary);">
                    Reward: <strong style="color:var(--mint);">${escapeHtml(current.reward)}</strong>
                  </span>
                  <button type="button" class="btn btn-sm btn-outline-mint admin-only" onclick="window.RauDevApp.prefillMemberAward('${escapeHtml(member.id)}')">
                    + Award XP
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary admin-only" onclick="window.RauDevApp.openEditMemberModal('${escapeHtml(member.id)}')">
                    ✏️ Modify Member
                  </button>
                  <button type="button" class="btn btn-sm btn-danger admin-only" onclick="window.RauDevApp.deleteMember('${escapeHtml(member.id)}')">
                    🗑️ Delete Member
                  </button>
                </div>
              </div>

              <div class="xp-log-list">
                ${
                  historyItems.length === 0
                    ? `<div class="xp-log-item"><span class="xp-log-note">No XP actions recorded yet for ${escapeHtml(member.name)}.</span></div>`
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
                          <div class="xp-log-note">${escapeHtml(entry.details || 'Club activity')}</div>
                        </div>
                        <div class="xp-log-right">
                          <span class="xp-delta ${Number(entry.xp) < 0 ? 'negative' : ''}">
                            ${Number(entry.xp) >= 0 ? `+${entry.xp}` : entry.xp} XP
                          </span>
                          <button
                            type="button"
                            class="btn btn-sm btn-secondary admin-only"
                            title="Modify this XP entry"
                            onclick="window.RauDevApp.openEditXpEntryModal('${escapeHtml(member.id)}', '${escapeHtml(entry.id)}')"
                          >
                            ✏️
                          </button>
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

  /* --------------------------------------------------------------------------
     Admin Member CRUD (Add, Modify Details, Delete) & XP Entry Editing
     -------------------------------------------------------------------------- */
  function openAddMemberModal() {
    if (!state.isAdmin) return;
    const form = document.getElementById('member-editor-form');
    if (form) form.reset();
    document.getElementById('member-editor-id').value = '';
    document.getElementById('member-editor-modal-title').textContent = 'Add New Club Member';
    document.getElementById('member-editor-name').value = '';
    document.getElementById('member-editor-handle').value = '';
    document.getElementById('member-editor-year').value = 'RAU Student';
    document.getElementById('member-editor-avatar').value = '';
    const initXpGroup = document.getElementById('member-editor-initial-xp-group');
    if (initXpGroup) initXpGroup.style.display = 'grid';
    const delBtn = document.getElementById('member-editor-delete-btn');
    if (delBtn) delBtn.style.display = 'none';
    document.getElementById('member-editor-modal').classList.add('open');
  }

  function openEditMemberModal(memberId) {
    if (!state.isAdmin) return;
    const member = state.data.members.find((m) => m.id === memberId);
    if (!member) return;

    document.getElementById('member-editor-id').value = member.id;
    document.getElementById('member-editor-modal-title').textContent = `Modify Member Details — ${member.name}`;
    document.getElementById('member-editor-name').value = member.name || '';
    document.getElementById('member-editor-handle').value = member.handle || '';
    document.getElementById('member-editor-year').value = member.year || 'RAU Student';
    document.getElementById('member-editor-avatar').value = member.avatar || '';

    const initXpGroup = document.getElementById('member-editor-initial-xp-group');
    if (initXpGroup) initXpGroup.style.display = 'none';

    const delBtn = document.getElementById('member-editor-delete-btn');
    if (delBtn) {
      delBtn.style.display = 'inline-flex';
      delBtn.onclick = () => {
        document.getElementById('member-editor-modal').classList.remove('open');
        deleteMember(member.id);
      };
    }

    document.getElementById('member-editor-modal').classList.add('open');
  }

  async function submitMemberEditor(e) {
    e.preventDefault();
    const id = document.getElementById('member-editor-id').value.trim();
    const name = document.getElementById('member-editor-name').value.trim();
    if (!name) {
      showToast('Member name is required.');
      return;
    }
    const handle =
      document.getElementById('member-editor-handle').value.trim() ||
      '@' + name.toLowerCase().replace(/\s+/g, '.');
    const year = document.getElementById('member-editor-year').value.trim() || 'RAU Student';
    const avatar = document.getElementById('member-editor-avatar').value.trim();

    if (id) {
      const existing = state.data.members.find((m) => m.id === id);
      if (existing) {
        existing.name = name;
        existing.handle = handle;
        existing.year = year;
        if (avatar) {
          existing.avatar = avatar;
        } else {
          delete existing.avatar;
        }
      }
      document.getElementById('member-editor-modal').classList.remove('open');
      renderCurrentPage();
      await persistData(`Updated member details for ${name}.`);
    } else {
      const newId = 'mem-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      const initXpVal = Number(document.getElementById('member-editor-init-xp').value || 0);
      const initXpNote =
        document.getElementById('member-editor-init-note').value.trim() ||
        'Joined RAU DEV & attended session in Room 515.';

      const xpHistory = [];
      if (initXpVal !== 0) {
        xpHistory.push({
          id: 'xp-' + Date.now(),
          action: initXpVal === 10 ? 'Attend a meetup' : 'Initial XP Award',
          xp: initXpVal,
          date: new Date().toISOString().slice(0, 10),
          session: 'Club Onboarding',
          details: initXpNote
        });
      }

      const newMember = {
        id: newId,
        name,
        handle,
        year,
        xpHistory
      };
      if (avatar) newMember.avatar = avatar;

      state.data.members.push(newMember);
      state.expandedMembers.add(newId);
      document.getElementById('member-editor-modal').classList.remove('open');
      renderCurrentPage();
      await persistData(`Added new member ${name}.`);
    }
  }

  function openEditXpEntryModal(memberId, entryId) {
    if (!state.isAdmin) return;
    const member = state.data.members.find((m) => m.id === memberId);
    if (!member) return;
    const entry = (member.xpHistory || []).find((x) => x.id === entryId);
    if (!entry) return;

    document.getElementById('xp-entry-edit-member-id').value = memberId;
    document.getElementById('xp-entry-edit-id').value = entryId;
    document.getElementById('xp-entry-edit-action').value = entry.action || '';
    document.getElementById('xp-entry-edit-points').value = entry.xp || 10;
    document.getElementById('xp-entry-edit-session').value = entry.session || '';
    document.getElementById('xp-entry-edit-date').value = entry.date || '';
    document.getElementById('xp-entry-edit-details').value = entry.details || '';

    document.getElementById('xp-entry-editor-modal').classList.add('open');
  }

  async function submitXpEntryEdit(e) {
    e.preventDefault();
    const memberId = document.getElementById('xp-entry-edit-member-id').value;
    const entryId = document.getElementById('xp-entry-edit-id').value;
    const member = state.data.members.find((m) => m.id === memberId);
    if (!member) return;
    const entry = (member.xpHistory || []).find((x) => x.id === entryId);
    if (!entry) return;

    entry.action = document.getElementById('xp-entry-edit-action').value.trim() || 'XP Action';
    entry.xp = Number(document.getElementById('xp-entry-edit-points').value) || 0;
    entry.session = document.getElementById('xp-entry-edit-session').value.trim();
    entry.date = document.getElementById('xp-entry-edit-date').value;
    entry.details = document.getElementById('xp-entry-edit-details').value.trim();

    document.getElementById('xp-entry-editor-modal').classList.remove('open');
    renderCurrentPage();
    await persistData(`Updated XP entry for ${member.name}.`);
  }

  function populateAdminXpSelects(rankedMembers) {
    const memberSelect = document.getElementById('admin-xp-member');
    if (memberSelect) {
      const prevVal = memberSelect.value;
      memberSelect.innerHTML =
        `<option value="__NEW__">+ Create & Award New Member...</option>` +
        rankedMembers
          .map(
            (m) =>
              `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} (${m.totalXp} XP — ${escapeHtml(
                m.levelInfo.current.name
              )})</option>`
          )
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
              `<option value="${escapeHtml(a.id)}" data-xp="${a.xp}" data-label="${escapeHtml(a.label)}">${escapeHtml(
                a.label
              )} (+${a.xp} XP)</option>`
          )
          .join('') + `<option value="__CUSTOM__" data-xp="10" data-label="">Custom XP Action...</option>`;
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

  async function handleAwardXpSubmit(e) {
    e.preventDefault();
    const memberSelect = document.getElementById('admin-xp-member');
    const newMemberNameInput = document.getElementById('admin-new-member-name');
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
    const detailsText = (detailsInput.value || '').trim() || `${actionLabel} during ${sessionLabel}.`;

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
        year: 'RAU Student',
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

    state.expandedMembers.add(targetMember.id);
    detailsInput.value = '';

    renderScoreboardSection();
    memberSelect.value = targetMember.id;
    toggleNewMemberInput();

    await persistData(
      `Awarded ${xpValue >= 0 ? '+' + xpValue : xpValue} XP (${actionLabel}) to ${targetMember.name}.`
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
    if (!window.confirm(`Delete member "${member.name}" and all their XP logs from the scoreboard?`)) return;
    state.data.members = state.data.members.filter((m) => m.id !== memberId);
    renderScoreboardSection();
    await persistData(`Deleted member ${member.name}.`);
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

  function openBatchXpModal() {
    if (!state.isAdmin) return;
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
            `<option value="${escapeHtml(a.id)}" data-xp="${a.xp}" data-label="${escapeHtml(a.label)}">${escapeHtml(
              a.label
            )} (+${a.xp} XP)</option>`
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
    renderCurrentPage();
    await persistData(`Awarded +${xpValue} XP (${actionLabel}) to ${checkboxes.length} members.`);
  }

  /* --------------------------------------------------------------------------
     Resources Page
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
                  ${isSolution ? '&lt;/&gt; Solution Code' : '📚 Lecture / Deck'}
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
    if (!state.isAdmin) return;
    const form = document.getElementById('add-resource-form');
    if (form) form.reset();
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

    if (window.location.protocol.startsWith('http')) {
      try {
        const resp = await fetch('api/upload-resource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': state.sessionToken || ''
          },
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
    renderCurrentPage();
    await persistData(`Added downloadable resource: "${title}".`);
  }

  async function deleteResource(resourceId) {
    if (!state.isAdmin) return;
    const res = state.data.resources.find((r) => r.id === resourceId);
    if (!res) return;
    if (!window.confirm(`Delete resource "${res.title}"?`)) return;
    state.data.resources = state.data.resources.filter((r) => r.id !== resourceId);
    renderCurrentPage();
    await persistData(`Deleted resource "${res.title}".`);
  }

  /* --------------------------------------------------------------------------
     News Page
     -------------------------------------------------------------------------- */
  function renderNewsSection() {
    const gridEl = document.getElementById('news-grid');
    if (!gridEl) return;

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

    const q = state.newsSearch.trim().toLowerCase();
    const filtered = sortedNews.filter((n) => {
      const topicMatch = state.newsTopicFilter === 'ALL' || n.topic === state.newsTopicFilter;
      if (!topicMatch) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.topic && n.topic.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="panel-card" style="grid-column: 1 / -1; text-align:center; padding: 36px;">
          <p style="color: var(--text-secondary);">No news stories found matching your filter.</p>
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
    if (!state.isAdmin) return;
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
    if (!state.isAdmin) return;
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
    renderCurrentPage();
    await persistData(id ? `Updated topic "${title}".` : `Published new topic "${title}".`);
  }

  async function deleteNewsPost(newsId) {
    if (!state.isAdmin) return;
    const post = state.data.news.find((n) => n.id === newsId);
    if (!post) return;
    if (!window.confirm(`Delete news post "${post.title}"?`)) return;
    state.data.news = state.data.news.filter((n) => n.id !== newsId);
    renderCurrentPage();
    await persistData(`Deleted news post "${post.title}".`);
  }

  /* --------------------------------------------------------------------------
     Team Page
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
     Global Events & Discreet Server-Authenticated Password Prompt
     -------------------------------------------------------------------------- */
  function bindGlobalEvents() {
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

    const sbSort = document.getElementById('scoreboard-sort');
    if (sbSort) {
      sbSort.addEventListener('change', (e) => {
        state.scoreboardSort = e.target.value;
        renderScoreboardSection();
      });
    }

    const resSearch = document.getElementById('resource-search');
    if (resSearch) {
      resSearch.addEventListener('input', (e) => {
        state.resourceSearch = e.target.value;
        renderResourcesSection();
      });
    }

    const newsSearch = document.getElementById('news-search');
    if (newsSearch) {
      newsSearch.addEventListener('input', (e) => {
        state.newsSearch = e.target.value;
        renderNewsSection();
      });
    }

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

    const xpDateInput = document.getElementById('admin-xp-date');
    if (xpDateInput && !xpDateInput.value) {
      xpDateInput.value = new Date().toISOString().slice(0, 10);
    }

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    // Discreet keyboard shortcut (Ctrl+Shift+A or Alt+A) to open password modal or exit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach((m) => m.classList.remove('open'));
      }
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        toggleAdminMode();
      }
    });

    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#admin') {
        toggleAdminMode();
      }
    });
  }

  function openAdminPasswordPrompt() {
    const pinModal = document.getElementById('admin-pin-modal');
    const pinInput = document.getElementById('admin-pin-input');
    if (pinInput) {
      pinInput.value = '';
    }
    if (pinModal) {
      pinModal.classList.add('open');
      if (pinInput) setTimeout(() => pinInput.focus(), 100);
    }
  }

  async function toggleAdminMode() {
    if (state.isAdmin) {
      if (window.location.protocol.startsWith('http') && state.sessionToken) {
        try {
          await fetch('api/logout', {
            method: 'POST',
            headers: { 'X-Admin-Token': state.sessionToken }
          });
        } catch (_) {}
      }
      state.isAdmin = false;
      state.sessionToken = '';
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      if (window.location.hash === '#admin') {
        history.replaceState(null, '', window.location.pathname);
      }
      syncAdminUiState();
      renderCurrentPage();
      showToast('Session locked.');
      return;
    }
    openAdminPasswordPrompt();
  }

  async function submitAdminPin(e) {
    e.preventDefault();
    const pinInput = document.getElementById('admin-pin-input');
    const entered = (pinInput.value || '').trim();
    if (!entered) return;

    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: entered })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.authenticated && data.token) {
          state.isAdmin = true;
          state.sessionToken = data.token;
          sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          document.getElementById('admin-pin-modal').classList.remove('open');
          syncAdminUiState();
          renderCurrentPage();
          showToast('Authenticated.');
          return;
        } else {
          showToast(data.error || 'Invalid password.');
          return;
        }
      } catch (_) {
        showToast('Could not reach authentication server.');
        return;
      }
    }

    showToast('Run start-server.bat to set your session password and authenticate.');
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
    showToast('Exported club-data.json.');
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
        renderCurrentPage();
        await persistData('Imported club-data.json.');
      } catch (err) {
        showToast('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  }

  async function resetToDefaultData() {
    if (!window.confirm('Reset all scoreboard logs, members, news, and resources back to the initial Session 01 data?')) {
      return;
    }
    state.data = JSON.parse(JSON.stringify(window.RAU_DEV_DEFAULT_DATA));
    renderCurrentPage();
    await persistData('Reset data to initial state.');
  }

  /* --------------------------------------------------------------------------
     Helper Utilities
     -------------------------------------------------------------------------- */
  function getInitials(name) {
    return (name || 'RD')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

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
     Public API
     -------------------------------------------------------------------------- */
  window.RauDevApp = {
    toggleMobileSidebar() {
      const sb = document.querySelector('.sidebar-nav');
      if (sb) sb.classList.toggle('mobile-open');
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
    filterByLevelTier(levelName) {
      if (state.scoreboardLevelFilter === levelName) {
        state.scoreboardLevelFilter = 'ALL';
      } else {
        state.scoreboardLevelFilter = levelName;
      }
      renderScoreboardSection();
    },
    resetScoreboardFilters() {
      state.scoreboardSearch = '';
      state.scoreboardLevelFilter = 'ALL';
      const searchEl = document.getElementById('scoreboard-search');
      if (searchEl) searchEl.value = '';
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
    openAddMemberModal,
    openEditMemberModal,
    submitMemberEditor,
    openEditXpEntryModal,
    submitXpEntryEdit,
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
