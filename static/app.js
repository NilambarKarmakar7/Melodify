// ============================================================
// Melodify — Complete Application Script (Bug-Fixed & Enhanced)
// ============================================================

// ─── SVG Icon Helper (bypasses Lucide re-render issues) ─────
const ICONS = {
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    playSmall: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    heartFilled: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    volumeX: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
    volume1: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    volume2: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    bot: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    music2: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4"/></svg>`,
};

// ─── Core Application State ─────────────────────────────────
let songsData = [];
let likedSongs = JSON.parse(localStorage.getItem('melodify_likes')) || [];
let recentlyPlayed = JSON.parse(localStorage.getItem('melodify_recent')) || [];
let chatMessages = JSON.parse(localStorage.getItem('melodify_chat')) || [
    {
        sender: 'bot',
        text: "Hello! I'm Melodify. Tell me what you're feeling, what happened, or what kind of music you need, and I'll help shape the next songs around that.",
        timestamp: new Date().toISOString()
    }
];
chatMessages = chatMessages
    .filter(msg => !String(msg.text || '').startsWith('Connection error.'))
    .map(msg => ({ ...msg, timestamp: msg.timestamp || new Date().toISOString() }));
localStorage.setItem('melodify_chat', JSON.stringify(chatMessages));

// ─── Playback Queue State ────────────────────────────────────
let playQueue = [];
let currentQueueIndex = -1;
let isShuffle = false;
let isRepeat = false;
let isPlaying = false;

// ─── Audio Element ───────────────────────────────────────────
const audio = document.getElementById('main-audio-element');
audio.volume = 0.7;

// ─── DOM References ──────────────────────────────────────────
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const searchInput = document.getElementById('search-input');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsTitle = document.getElementById('search-results-title');
const searchClearBtn = document.getElementById('search-clear-btn');
const recentlyPlayedList = document.getElementById('recently-played-list');
const likedSongsList = document.getElementById('liked-songs-list');
const likedSongsCount = document.getElementById('liked-songs-count');
const upcomingQueueList = document.getElementById('upcoming-queue-list');
const recommendationsList = document.getElementById('recommendations-list');
const refreshRecommendationsBtn = document.getElementById('refresh-recommendations-btn');
const settingsBtn = document.getElementById('settings-btn');
const notificationsBtn = document.getElementById('notifications-btn');
const settingsPanel = document.getElementById('settings-panel');
const notificationsPanel = document.getElementById('notifications-panel');
const notificationList = document.getElementById('notification-list');
const compactToggle = document.getElementById('compact-toggle');
const motionToggle = document.getElementById('motion-toggle');
const themeToggle = document.getElementById('theme-toggle');
const settingsSearchAction = document.getElementById('settings-search-action');
const chatMiniRecs = document.getElementById('chat-mini-recs');
const heroChatBtn = document.getElementById('hero-chat-btn');
const heroPlayBtn = document.getElementById('hero-play-btn');
const newReleasesBtn = document.getElementById('new-releases-btn');
const shufflePlayBtn = document.getElementById('shuffle-play-btn');
const homeTotalTracks = document.getElementById('home-total-tracks');
const homeLikedTracks = document.getElementById('home-liked-tracks');
const sidebarTotalCount = document.getElementById('sidebar-total-count');
const sidebarLikedCount = document.getElementById('sidebar-liked-count');
const sidebarToggle = document.getElementById('sidebar-toggle');

// Player Controls
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const progressSlider = document.getElementById('progress-slider');
const volumeSlider = document.getElementById('volume-slider');
const volumeIconBtn = document.getElementById('volume-icon-btn');
const playerArt = document.getElementById('player-art');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerLikeBtn = document.getElementById('player-like-btn');
const npAlbumArt = document.getElementById('np-album-art');
const npTitle = document.getElementById('np-title');
const npArtist = document.getElementById('np-artist');
const npLikeBtn = document.getElementById('np-like-btn');
const playerAlbumArtEl = document.querySelector('.player-album-art');

// ─── Helper: Safely set icon HTML ────────────────────────────
function setIcon(el, svgHtml) {
    if (el) el.innerHTML = svgHtml;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function setupHeaderActions() {
    settingsBtn?.addEventListener('click', e => {
        e.stopPropagation();
        togglePopover(settingsPanel, settingsBtn);
    });

    notificationsBtn?.addEventListener('click', e => {
        e.stopPropagation();
        renderNotifications();
        notificationsBtn.classList.remove('has-dot');
        togglePopover(notificationsPanel, notificationsBtn);
    });

    document.querySelectorAll('[data-close-popover]').forEach(btn => {
        btn.addEventListener('click', () => closePopovers());
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.header-popover') && !e.target.closest('.header-icon-btn')) {
            closePopovers();
        }
    });

    compactToggle?.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('compact-mode');
        setPreference('compact-mode', enabled, compactToggle);
    });

    motionToggle?.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('reduce-motion');
        setPreference('reduce-motion', enabled, motionToggle);
    });

    themeToggle?.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('dark-mode');
        setPreference('dark-mode', enabled, themeToggle);
    });

    settingsSearchAction?.addEventListener('click', () => {
        closePopovers();
        switchTab('search');
        searchInput?.focus();
    });

    refreshRecommendationsBtn?.addEventListener('click', () => renderRecommendations(true));

    heroChatBtn?.addEventListener('click', () => {
        switchTab('chat');
        chatInput?.focus();
    });

    heroPlayBtn?.addEventListener('click', () => {
        const tracks = getRecommendedTracks(true);
        if (tracks.length) setupQueue(tracks, 0, true);
    });

    newReleasesBtn?.addEventListener('click', () => {
        switchTab('search');
        const fresh = songsData.slice(0, 80);
        if (searchResultsTitle) searchResultsTitle.textContent = 'New Releases';
        renderSearch(fresh);
    });

    shufflePlayBtn?.addEventListener('click', () => {
        if (!songsData.length) return;
        const shuffled = [...songsData].sort(() => Math.random() - 0.5);
        setupQueue(shuffled, 0, true);
    });

    document.querySelectorAll('[data-tab-target]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab-target')));
    });

}

function togglePopover(panel, button) {
    if (!panel) return;
    const wasOpen = panel.classList.contains('open');
    closePopovers();
    if (!wasOpen) {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        button?.classList.add('active');
    }
}

function closePopovers() {
    [settingsPanel, notificationsPanel].forEach(panel => {
        panel?.classList.remove('open');
        panel?.setAttribute('aria-hidden', 'true');
    });
    [settingsBtn, notificationsBtn].forEach(btn => btn?.classList.remove('active'));
}

function setPreference(className, enabled, toggle) {
    document.body.classList.toggle(className, enabled);
    toggle?.classList.toggle('on', enabled);
    toggle?.setAttribute('aria-pressed', String(enabled));
    localStorage.setItem(`melodify_${className}`, enabled ? '1' : '0');
}

function applySavedPreferences() {
    const compact = localStorage.getItem('melodify_compact-mode') === '1';
    const reduced = localStorage.getItem('melodify_reduce-motion') === '1';
    const dark = localStorage.getItem('melodify_dark-mode') === '1';
    setPreference('compact-mode', compact, compactToggle);
    setPreference('reduce-motion', reduced, motionToggle);
    setPreference('dark-mode', dark, themeToggle);
}

function renderNotifications() {
    if (!notificationList) return;
    const likedCount = likedSongs.length;
    const recentName = recentlyPlayed[0]?.track_name || songsData[0]?.track_name || 'your first track';
    const recCount = Math.min(4, songsData.length || 4);
    notificationList.innerHTML = `
        <div class="notification-item">${ICONS.heart}<span>${likedCount} liked song${likedCount === 1 ? '' : 's'} saved.</span></div>
        <div class="notification-item">${ICONS.playSmall}<span>${recCount} fresh recommendations are ready.</span></div>
        <div class="notification-item">${ICONS.bot}<span>Try asking for music by mood, genre, or activity.</span></div>
        <div class="notification-item">${ICONS.music2}<span>Last queue seed: ${escapeHTML(recentName)}.</span></div>`;
}

function updateHomeStats() {
    if (homeTotalTracks) homeTotalTracks.textContent = songsData.length.toLocaleString();
    if (homeLikedTracks) homeLikedTracks.textContent = likedSongs.length.toLocaleString();
    if (sidebarTotalCount) sidebarTotalCount.textContent = songsData.length.toLocaleString();
    if (sidebarLikedCount) sidebarLikedCount.textContent = likedSongs.length.toLocaleString();
}

// ─── Initialization ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();

    setupTabs();
    setupSidebarToggle();
    setupAudioListeners();
    setupPlayerButtons();
    setupSearchHandlers();
    setupChatHandlers();
    setupHeaderActions();
    applySavedPreferences();

    // Init volume slider UI
    volumeSlider.value = 70;
    setIcon(volumeIconBtn, ICONS.volume2);

    // Load data from API
    renderLoadingRows();
    loadSongs();

    // Render chat
    renderChat();
});

function setupSidebarToggle() {
    const savedCollapsed = localStorage.getItem('melodify_sidebar_collapsed') === '1';
    setSidebarCollapsed(savedCollapsed);

    sidebarToggle?.addEventListener('click', () => {
        setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
    });
}

function setSidebarCollapsed(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('melodify_sidebar_collapsed', collapsed ? '1' : '0');
    sidebarToggle?.setAttribute('aria-expanded', String(!collapsed));
    sidebarToggle?.setAttribute('title', collapsed ? 'Show full sidebar' : 'Show icons only');
}

function renderLoadingRows() {
    const loadingRow = `<tr><td colspan="6" class="table-state">Loading songs...</td></tr>`;
    if (recentlyPlayedList) recentlyPlayedList.innerHTML = loadingRow;
    if (searchResultsList) searchResultsList.innerHTML = loadingRow;
    if (recommendationsList) recommendationsList.innerHTML = `<div class="empty-state">Loading recommendations...</div>`;
}

// ─── Tab Navigation (SPA) ────────────────────────────────────
function setupTabs() {
    document.querySelectorAll('.nav-item, .playlist-item, .sidebar-rail-btn[data-tab]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    // Deactivate all nav items & views
    document.querySelectorAll('.nav-item, .playlist-item, .sidebar-rail-btn[data-tab]').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));

    // Activate selected
    document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(nav => nav.classList.add('active'));
    const view = document.getElementById(`view-${tabName}`);
    if (view) view.classList.add('active');

    // Update breadcrumb
    const crumb = document.getElementById('breadcrumb-active');
    const labels = { home: 'Browse', search: 'Search Library', chat: 'Melodify AI', analytics: 'My Music Taste', liked: 'Favorite Songs' };
    if (crumb) crumb.textContent = labels[tabName] || tabName;

    // Tab-specific refresh
    if (tabName === 'analytics') loadAnalytics();
    else if (tabName === 'liked') updateLikedSongsView();
    else if (tabName === 'home') {
        renderRecommendations();
        renderRecentlyPlayed();
    }
}

// Expose for inline HTML onclick
window.switchTab = switchTab;
window.filterByArtist = filterByArtist;
window.toggleLike = toggleLike;
window.playSongFromList = playSongFromList;
window.playSongDirect = playSongDirect;
window.sendSuggestedMessage = sendSuggestedMessage;

// ─── Data: Load Songs ─────────────────────────────────────────
async function loadSongs() {
    try {
        const res = await fetch('/api/songs');
        songsData = await res.json();
        renderSearch(songsData);
        renderRecommendations();
        renderChatMiniRecs();
        renderNotifications();
        updateHomeStats();
        renderRecentlyPlayed();
        if (songsData.length > 0 && playQueue.length === 0) {
            setupQueue(songsData, 0, false);
        }
    } catch (err) {
        console.error('Error loading songs:', err);
        renderSongLoadError();
    }
}

function renderSongLoadError() {
    const errorRow = `<tr><td colspan="6" class="table-state error">Songs could not load. Refresh the page while the server is running.</td></tr>`;
    if (recentlyPlayedList) recentlyPlayedList.innerHTML = errorRow;
    if (searchResultsList) searchResultsList.innerHTML = errorRow;
    if (recommendationsList) recommendationsList.innerHTML = `<div class="empty-state">Songs could not load. Refresh the page.</div>`;
}

// ─── Data: Analytics ─────────────────────────────────────────
async function loadAnalytics() {
    try {
        const res = await fetch(`/api/analytics?likes=${likedSongs.join(',')}`);
        const data = await res.json();

        document.getElementById('stats-total-tracks').textContent = data.total_songs;
        document.getElementById('stats-liked-songs').textContent = data.liked_count;

        let topMood = 'Calm';
        let max = 0;
        for (const [mood, count] of Object.entries(data.moods || {})) {
            if (count > max) { max = count; topMood = mood; }
        }
        document.getElementById('stats-top-mood').textContent = topMood.charAt(0).toUpperCase() + topMood.slice(1);

        renderChartBars('genre-chart-container', data.genres || {}, Math.max(data.liked_count, 1), 'genre-fill');
        renderChartBars('mood-chart-container', data.moods || {}, Math.max(data.liked_count, 1));
    } catch (err) {
        console.error('Analytics error:', err);
    }
}

function renderChartBars(containerId, dataObj, total, barClass = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const sorted = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
        container.innerHTML = `<p style="font-size:13px;color:var(--text-muted-dark);text-align:center;padding:20px;">Like some songs to generate statistics!</p>`;
        return;
    }
    sorted.forEach(([label, value]) => {
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'chart-row';
        row.innerHTML = `
            <div class="chart-row-meta">
                <span class="chart-label">${label.charAt(0).toUpperCase() + label.slice(1)}</span>
                <span class="chart-value">${value} song(s) (${pct}%)</span>
            </div>
            <div class="chart-progress-bg">
                <div class="chart-progress-fill ${barClass}" style="width:0%"></div>
            </div>`;
        container.appendChild(row);
        setTimeout(() => { row.querySelector('.chart-progress-fill').style.width = `${pct}%`; }, 50);
    });
}

// ─── Player Queue ─────────────────────────────────────────────
function setupQueue(tracks, index = 0, autoPlay = true) {
    playQueue = [...tracks];
    currentQueueIndex = Math.min(index, tracks.length - 1);
    loadTrack(playQueue[currentQueueIndex], autoPlay);
    renderQueue();
}

function loadTrack(track, autoPlay = true) {
    if (!track) return;

    // Set audio source
    audio.src = track.audio_url;
    audio.load();

    // Update bottom player UI
    playerArt.src = track.image_url;
    playerTitle.textContent = track.track_name;
    playerArtist.textContent = track.artist_name;

    // Update right panel
    npAlbumArt.src = track.image_url;
    npTitle.textContent = track.track_name;
    npArtist.textContent = track.artist_name;

    // Highlight active row in tables
    document.querySelectorAll('.songs-table tbody tr').forEach(row => {
        row.classList.toggle('playing', row.getAttribute('data-song-id') === track.track_id);
    });

    // Sync like button visuals
    syncLikeUI(track.track_id);

    // Save to recently played
    addToRecent(track);

    if (autoPlay) {
        playAudio();
    } else {
        pauseAudio();
    }
}

function playAudio() {
    audio.play().then(() => {
        isPlaying = true;
        setIcon(btnPlay, ICONS.pause);
        btnPlay.title = 'Pause';
        playerAlbumArtEl.classList.add('playing');
    }).catch(err => {
        console.warn('Playback blocked:', err);
        isPlaying = false;
        setIcon(btnPlay, ICONS.play);
    });
}

function pauseAudio() {
    audio.pause();
    isPlaying = false;
    setIcon(btnPlay, ICONS.play);
    btnPlay.title = 'Play';
    playerAlbumArtEl.classList.remove('playing');
}

function togglePlay() {
    if (playQueue.length === 0 && songsData.length > 0) {
        setupQueue(songsData, 0, true);
        return;
    }
    if (audio.paused) {
        playAudio();
    } else {
        pauseAudio();
    }
}

function nextTrack() {
    if (playQueue.length === 0) return;
    currentQueueIndex = isShuffle
        ? Math.floor(Math.random() * playQueue.length)
        : (currentQueueIndex + 1) % playQueue.length;
    loadTrack(playQueue[currentQueueIndex], true);
    renderQueue();
}

function prevTrack() {
    if (playQueue.length === 0) return;
    // If > 3 seconds into track, restart; else go back
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        currentQueueIndex = (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
        loadTrack(playQueue[currentQueueIndex], true);
    }
    renderQueue();
}

// ─── Audio Event Listeners ────────────────────────────────────
function setupAudioListeners() {
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressSlider.value = pct;
        timeCurrent.textContent = formatTime(audio.currentTime);
        timeTotal.textContent = formatTime(audio.duration);
        updateWaveform(pct);
    });

    audio.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextTrack();
        }
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        isPlaying = false;
        setIcon(btnPlay, ICONS.play);
        playerAlbumArtEl.classList.remove('playing');
    });

    // Progress seek
    progressSlider.addEventListener('input', e => {
        if (!audio.duration) return;
        audio.currentTime = (e.target.value / 100) * audio.duration;
    });

    // Click on waveform container also seeks
    document.getElementById('timeline-seek-bar').addEventListener('click', e => {
        if (!audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        audio.currentTime = (pct / 100) * audio.duration;
        progressSlider.value = pct;
    });

    // Volume
    volumeSlider.addEventListener('input', e => {
        audio.volume = e.target.value / 100;
        updateVolumeIcon(audio.volume);
    });

    volumeIconBtn.addEventListener('click', () => {
        if (audio.volume > 0) {
            audio.dataset.prevVol = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            const prev = parseFloat(audio.dataset.prevVol) || 0.7;
            audio.volume = prev;
            volumeSlider.value = prev * 100;
        }
        updateVolumeIcon(audio.volume);
    });
}

// ─── Player Button Wiring ─────────────────────────────────────
function setupPlayerButtons() {
    btnPlay.addEventListener('click', togglePlay);
    btnNext.addEventListener('click', nextTrack);
    btnPrev.addEventListener('click', prevTrack);

    btnShuffle.addEventListener('click', () => {
        isShuffle = !isShuffle;
        btnShuffle.style.color = isShuffle ? 'var(--accent)' : '';
        btnShuffle.style.textShadow = isShuffle ? '0 0 8px rgba(245,197,24,0.5)' : '';
    });

    btnRepeat.addEventListener('click', () => {
        isRepeat = !isRepeat;
        btnRepeat.style.color = isRepeat ? 'var(--accent)' : '';
        btnRepeat.style.textShadow = isRepeat ? '0 0 8px rgba(245,197,24,0.5)' : '';
    });

    playerLikeBtn.addEventListener('click', () => {
        const t = playQueue[currentQueueIndex];
        if (t) toggleLike(t.track_id);
    });

    npLikeBtn.addEventListener('click', () => {
        const t = playQueue[currentQueueIndex];
        if (t) toggleLike(t.track_id);
    });
}

// ─── Waveform Visualizer ──────────────────────────────────────
let waveAnimFrame = null;
function updateWaveform(percent) {
    const bars = document.querySelectorAll('#waveform-visualizer .wave-bar');
    const activeCount = Math.floor((percent / 100) * bars.length);
    bars.forEach((bar, i) => {
        if (i <= activeCount) {
            bar.style.backgroundColor = 'var(--accent)';
            if (isPlaying) {
                bar.style.height = `${8 + Math.random() * 24}px`;
            }
        } else {
            bar.style.backgroundColor = 'rgba(255,255,255,0.25)';
        }
    });
}

// ─── Volume Icon Helper ───────────────────────────────────────
function updateVolumeIcon(vol) {
    if (vol === 0) setIcon(volumeIconBtn, ICONS.volumeX);
    else if (vol < 0.4) setIcon(volumeIconBtn, ICONS.volume1);
    else setIcon(volumeIconBtn, ICONS.volume2);
}

// ─── Time Formatter ───────────────────────────────────────────
function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ─── Like System ──────────────────────────────────────────────
function toggleLike(songId) {
    const idx = likedSongs.indexOf(songId);
    if (idx === -1) likedSongs.push(songId);
    else likedSongs.splice(idx, 1);
    localStorage.setItem('melodify_likes', JSON.stringify(likedSongs));

    syncLikeUI(songId);
    renderRecommendations();
    renderChatMiniRecs();
    renderNotifications();
    updateHomeStats();
    // Re-render liked list if currently visible
    updateLikedSongsView();

    // Refresh analytics if open
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.getAttribute('data-tab') === 'analytics') loadAnalytics();
}

function syncLikeUI(songId) {
    const liked = likedSongs.includes(songId);
    const current = playQueue[currentQueueIndex];

    // Player bottom bar & right panel like buttons
    if (current && current.track_id === songId) {
        setIcon(playerLikeBtn, liked ? ICONS.heartFilled : ICONS.heart);
        playerLikeBtn.style.color = liked ? 'var(--accent-green)' : '';
        setIcon(npLikeBtn, liked ? ICONS.heartFilled : ICONS.heart);
        npLikeBtn.style.color = liked ? 'var(--accent-green)' : '';
    }

    // Song table rows
    document.querySelectorAll(`.btn-row-like[data-song-id="${songId}"]`).forEach(btn => {
        btn.classList.toggle('liked', liked);
        setIcon(btn, liked ? ICONS.heartFilled : ICONS.heart);
    });
}

// ─── Recently Played ──────────────────────────────────────────
function addToRecent(song) {
    recentlyPlayed = recentlyPlayed.filter(s => s.track_id !== song.track_id);
    recentlyPlayed.unshift(song);
    if (recentlyPlayed.length > 10) recentlyPlayed.pop();
    localStorage.setItem('melodify_recent', JSON.stringify(recentlyPlayed));
    renderRecommendations();
    renderChatMiniRecs();
    renderNotifications();
    renderRecentlyPlayed();
}

// ─── Render: Recently Played (Home Tab) ───────────────────────
function renderRecentlyPlayed() {
    if (!recentlyPlayedList) return;
    recentlyPlayedList.innerHTML = '';
    const list = recentlyPlayed.length > 0 ? recentlyPlayed : songsData.slice(0, 8);
    list.forEach((track, i) => {
        const row = buildSongRow(track, i + 1, 'recent', list);
        recentlyPlayedList.appendChild(row);
    });
}

function getRecommendedTracks(shuffle = false) {
    if (!songsData.length) return [];
    const likedTracks = songsData.filter(track => likedSongs.includes(track.track_id));
    const seedTracks = [...likedTracks, ...recentlyPlayed].slice(0, 8);
    const preferredGenres = new Set(seedTracks.map(track => String(track.genre || '').toLowerCase()).filter(Boolean));
    const preferredMoods = new Set(seedTracks.map(track => String(track.mood || '').toLowerCase()).filter(Boolean));
    const excluded = new Set(seedTracks.map(track => track.track_id));

    let scored = songsData
        .filter(track => !excluded.has(track.track_id))
        .map((track, index) => {
            let score = 0;
            if (preferredGenres.has(String(track.genre || '').toLowerCase())) score += 3;
            if (preferredMoods.has(String(track.mood || '').toLowerCase())) score += 2;
            score += Math.max(0, 1 - index / Math.max(songsData.length, 1));
            if (shuffle) score += Math.random() * 3;
            return { track, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(item => item.track);

    if (!seedTracks.length) {
        scored = [...songsData].sort((a, b) => Number(b.energy || 0) - Number(a.energy || 0));
        if (shuffle) scored.sort(() => Math.random() - 0.5);
    }

    return scored.slice(0, 4);
}

function renderRecommendations(shuffle = false) {
    if (!recommendationsList) return;
    const tracks = getRecommendedTracks(shuffle);
    recommendationsList.innerHTML = '';

    if (!tracks.length) {
        recommendationsList.innerHTML = `<div class="empty-state">Recommendations will appear when songs load.</div>`;
        return;
    }

    tracks.forEach((track, index) => {
        const card = document.createElement('article');
        card.className = 'recommendation-card';
        card.style.animationDelay = `${index * 45}ms`;
        card.innerHTML = `
            <img src="${escapeHTML(track.image_url)}" alt="" loading="lazy">
            <div class="rec-overlay">
                <span class="rec-label">${escapeHTML(track.mood || track.genre || 'Recommended')}</span>
                <span class="rec-title">${escapeHTML(track.track_name)}</span>
                <span class="rec-artist">${escapeHTML(track.artist_name)}</span>
            </div>
            <button class="rec-play-btn" title="Play recommended track">${ICONS.play}</button>`;

        card.addEventListener('click', () => {
            const idx = tracks.findIndex(item => item.track_id === track.track_id);
            setupQueue(tracks, idx, true);
        });
        card.querySelector('.rec-play-btn').addEventListener('click', e => {
            e.stopPropagation();
            setupQueue(tracks, index, true);
        });
        recommendationsList.appendChild(card);
    });
}

function renderChatMiniRecs() {
    if (!chatMiniRecs) return;
    const tracks = getRecommendedTracks(false).slice(0, 3);
    chatMiniRecs.innerHTML = tracks.map(track => `
        <button class="mini-rec-chip" data-song-id="${escapeHTML(track.track_id)}">
            <img src="${escapeHTML(track.image_url)}" alt="" loading="lazy">
            <span>${escapeHTML(track.track_name)}</span>
        </button>`).join('');

    chatMiniRecs.querySelectorAll('.mini-rec-chip').forEach(chip => {
        chip.addEventListener('click', () => playSongDirect(chip.getAttribute('data-song-id')));
    });
}

// ─── Render: Search Results ───────────────────────────────────
function renderSearch(tracks) {
    if (!searchResultsList) return;
    searchResultsList.innerHTML = '';
    if (tracks.length === 0) {
        searchResultsList.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted-dark)">No tracks found.</td></tr>`;
        return;
    }
    tracks.forEach((track, i) => {
        const row = buildSongRow(track, i + 1, 'search', tracks);
        searchResultsList.appendChild(row);
    });
}

// ─── Render: Liked Songs ──────────────────────────────────────
function updateLikedSongsView() {
    if (!likedSongsList) return;
    likedSongsList.innerHTML = '';
    const liked = songsData.filter(t => likedSongs.includes(t.track_id));
    if (likedSongsCount) likedSongsCount.textContent = `${liked.length} song(s)`;

    if (liked.length === 0) {
        likedSongsList.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted-dark)">
                <div style="display:flex;flex-direction:column;align-items:center;gap:12px;opacity:0.5">
                    ${ICONS.music2}
                    <span>Songs you like will appear here. Use Search or AI Chat to discover tracks!</span>
                </div>
            </td></tr>`;
        return;
    }
    liked.forEach((track, i) => {
        const row = buildSongRow(track, i + 1, 'liked', liked);
        likedSongsList.appendChild(row);
    });
}

// ─── Shared Row Builder ───────────────────────────────────────
function buildSongRow(track, num, listType, sourceList) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-song-id', track.track_id);
    const isActive = playQueue[currentQueueIndex] && playQueue[currentQueueIndex].track_id === track.track_id;
    if (isActive) tr.classList.add('playing');
    const isLiked = likedSongs.includes(track.track_id);

    tr.innerHTML = `
        <td>
            <span class="row-number">${num}</span>
            <button class="btn-play-row" data-id="${track.track_id}" data-list="${listType}">${ICONS.playSmall}</button>
        </td>
        <td>
            <div class="song-title-cell">
                <img class="song-img" src="${track.image_url}" alt="" loading="lazy">
                <div class="song-details-text">
                    <span class="song-title-main">${track.track_name}</span>
                    <span class="song-artist-sub">${track.artist_name}</span>
                </div>
            </div>
        </td>
        <td>${track.album_name}</td>
        <td>${track.genre}</td>
        <td>${track.mood ? track.mood.charAt(0).toUpperCase() + track.mood.slice(1) : ''}</td>
        <td>
            <button class="btn-row-like ${isLiked ? 'liked' : ''}" data-song-id="${track.track_id}">
                ${isLiked ? ICONS.heartFilled : ICONS.heart}
            </button>
        </td>`;

    // Play row button
    tr.querySelector('.btn-play-row').addEventListener('click', e => {
        e.stopPropagation();
        playSongFromList(track.track_id, listType, sourceList);
    });

    // Like button
    tr.querySelector('.btn-row-like').addEventListener('click', e => {
        e.stopPropagation();
        toggleLike(track.track_id);
    });

    // Click row to play
    tr.addEventListener('click', () => {
        const srcIdx = sourceList.findIndex(t => t.track_id === track.track_id);
        if (srcIdx !== -1) setupQueue(sourceList, srcIdx, true);
    });

    return tr;
}

// ─── Render: Queue ────────────────────────────────────────────
function renderQueue() {
    if (!upcomingQueueList) return;
    upcomingQueueList.innerHTML = '';
    if (playQueue.length === 0) return;

    for (let i = 1; i <= Math.min(4, playQueue.length - 1); i++) {
        const idx = (currentQueueIndex + i) % playQueue.length;
        if (idx === currentQueueIndex) break;
        const track = playQueue[idx];
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <img class="queue-item-art" src="${track.image_url}" alt="" loading="lazy">
            <div class="queue-item-meta">
                <span class="queue-item-title">${track.track_name}</span>
                <span class="queue-item-artist">${track.artist_name}</span>
            </div>
            <span class="queue-item-duration">${track.genre}</span>`;
        item.addEventListener('click', () => setupQueue(playQueue, idx, true));
        upcomingQueueList.appendChild(item);
    }
}

// ─── Play from List ───────────────────────────────────────────
function playSongFromList(songId, listType, sourceList) {
    let list = sourceList || songsData;
    if (!sourceList) {
        if (listType === 'liked') list = songsData.filter(t => likedSongs.includes(t.track_id));
        else if (listType === 'recent') list = recentlyPlayed.length > 0 ? recentlyPlayed : songsData;
    }
    const idx = list.findIndex(t => t.track_id === songId);
    if (idx !== -1) setupQueue(list, idx, true);
}

function playSongDirect(songId) {
    const idx = songsData.findIndex(t => t.track_id === songId);
    if (idx !== -1) setupQueue(songsData, idx, true);
}

// ─── Search / Filter ──────────────────────────────────────────
function setupSearchHandlers() {
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        searchClearBtn.style.display = q ? 'block' : 'none';
        const filtered = songsData.filter(t =>
            t.track_name.toLowerCase().includes(q) ||
            t.artist_name.toLowerCase().includes(q) ||
            t.genre.toLowerCase().includes(q) ||
            t.mood.toLowerCase().includes(q)
        );
        if (searchResultsTitle) searchResultsTitle.textContent = q ? `Results for "${searchInput.value}"` : 'All Tracks';
        renderSearch(filtered);
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        if (searchResultsTitle) searchResultsTitle.textContent = 'All Tracks';
        renderSearch(songsData);
    });

    document.querySelectorAll('.mood-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const mood = tag.getAttribute('data-mood');
            const wasActive = tag.classList.contains('active');
            document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));

            if (!wasActive) {
                tag.classList.add('active');
                const filtered = songsData.filter(t => t.mood.toLowerCase() === mood);
                if (searchResultsTitle) searchResultsTitle.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Tracks`;
                renderSearch(filtered);
            } else {
                if (searchResultsTitle) searchResultsTitle.textContent = 'All Tracks';
                renderSearch(songsData);
            }
        });
    });
}

function filterByArtist(artist) {
    switchTab('search');
    searchInput.value = artist;
    searchInput.dispatchEvent(new Event('input'));
}

// ─── Chat Logic ───────────────────────────────────────────────
function setupChatHandlers() {
    if (!chatSendBtn) return;

    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    chatInput.addEventListener('input', autoResizeChatInput);

    clearChatBtn.addEventListener('click', () => {
        if (confirm('Clear your chat history?')) {
            chatMessages = [{
                sender: 'bot',
                text: "Fresh start. Tell me how you're feeling or what you need music for.",
                timestamp: new Date().toISOString()
            }];
            localStorage.setItem('melodify_chat', JSON.stringify(chatMessages));
            renderChat();
        }
    });
}

async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || chatSendBtn.classList.contains('is-sending')) return;

    chatMessages.push({ sender: 'user', text, timestamp: new Date().toISOString() });
    chatInput.value = '';
    autoResizeChatInput();
    chatSendBtn.classList.add('is-sending');
    chatSendBtn.disabled = true;
    setIcon(chatSendBtn, `<span class="send-loader" aria-label="Sending"></span>`);
    renderChat();

    const typingBubble = document.createElement('div');
    typingBubble.className = 'message-bubble bot typing-indicator-bubble';
    typingBubble.innerHTML = `
        <div class="bubble-avatar">${ICONS.bot}</div>
        <div class="bubble-content">
        <div class="bubble-text">
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
        <span class="message-time">Typing...</span>
        </div>`;
    chatBox.appendChild(typingBubble);
    scrollChatToBottom();

    try {
        const history = chatMessages.slice(-12).map(msg => ({
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp
        }));
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history })
        });
        const data = await res.json();
        document.querySelector('.typing-indicator-bubble')?.remove();
        chatMessages.push({
            sender: 'bot',
            text: data.response,
            songs: data.songs,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('melodify_chat', JSON.stringify(chatMessages));
        renderChat();
    } catch (err) {
        document.querySelector('.typing-indicator-bubble')?.remove();
        const isFilePage = window.location.protocol === 'file:';
        chatMessages.push({
            sender: 'bot',
            text: isFilePage
                ? 'This page is opened as a file. Open http://127.0.0.1:8000/ so AI Chat can connect.'
                : 'I could not reach the chat service. Keep the backend running, refresh once, and try again.',
            timestamp: new Date().toISOString()
        });
        renderChat();
    } finally {
        chatSendBtn.classList.remove('is-sending');
        chatSendBtn.disabled = false;
        setIcon(chatSendBtn, ICONS.send);
        chatInput.focus();
    }
}

function sendSuggestedMessage(text) {
    chatInput.value = text;
    autoResizeChatInput();
    handleSendMessage();
}

function autoResizeChatInput() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 132)}px`;
}

function formatMessageTime(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollChatToBottom() {
    if (!chatBox) return;
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function renderChat() {
    if (!chatBox) return;
    chatBox.innerHTML = '';
    chatMessages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${msg.sender}`;

        let cardsHtml = '';
        if (msg.songs && msg.songs.length > 0) {
            cardsHtml = `<div class="recommended-songs-wrapper">` +
                msg.songs.map(song => `
                    <div class="chat-song-card">
                        <div class="chat-song-info">
                            <img class="chat-song-art" src="${escapeHTML(song.image_url)}" alt="" loading="lazy">
                            <div class="chat-song-meta">
                                <span class="chat-song-title">${escapeHTML(song.track_name)}</span>
                                <span class="chat-song-artist">${escapeHTML(song.artist_name)}</span>
                            </div>
                        </div>
                        <div class="chat-song-actions">
                            <button class="chat-btn-play" data-song-id="${song.track_id}" title="Play Now">${ICONS.play}</button>
                        </div>
                    </div>`).join('') +
                `</div>`;
        }

        bubble.innerHTML = `
            <div class="bubble-avatar">${msg.sender === 'user' ? ICONS.user : ICONS.bot}</div>
            <div class="bubble-content">
                <div class="bubble-text"><p>${escapeHTML(msg.text).replace(/\n/g, '<br>')}</p>${cardsHtml}</div>
                <span class="message-time">${formatMessageTime(msg.timestamp)}</span>
            </div>`;

        // Wire play buttons inside chat cards
        bubble.querySelectorAll('.chat-btn-play').forEach(btn => {
            btn.addEventListener('click', () => playSongDirect(btn.getAttribute('data-song-id')));
        });

        chatBox.appendChild(bubble);
    });
    scrollChatToBottom();
}
