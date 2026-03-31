// --- Default Configuration & Themes ---
const THEMES = [
    { id: 'dark', bg: '#121212', text: '#efefef', name: 'Dark' },
    { id: 'light', bg: '#fafafa', text: '#1a1a1a', name: 'Light' },
    { id: 'matcha', bg: '#e8f0e5', text: '#4a5c48', name: 'Matcha' },
    { id: 'midnight', bg: '#0f172a', text: '#94a3b8', name: 'Midnight' },
    { id: 'coffee', bg: '#3e2723', text: '#d7ccc8', name: 'Coffee' },
    { id: 'ocean', bg: '#003049', text: '#eae2b7', name: 'Ocean' }
];

const FONTS = {
    'sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    'mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
};

// --- Sound Definitions (Web Audio API) ---
const SOUNDS = {
    chime: {
        name: 'Chime',
        play: (ctx, now, volume) => {
            const playBellNode = (freq, delay, dur, vol) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(vol * volume, now + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
                osc.start(now + delay);
                osc.stop(now + delay + dur);
            };
            // Two-tone "ding-dong" resonant bell chime
            playBellNode(987.77, 0, 1.5, 0.4);
            playBellNode(1975.53, 0, 1.0, 0.1);
            playBellNode(659.25, 0.4, 2.5, 0.5);
            playBellNode(1318.51, 0.4, 2.0, 0.1);
        }
    },
    bell: {
        name: 'Bell',
        play: (ctx, now, volume) => {
            const createTone = (freq, delay, dur, vol) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(vol * volume, now + delay + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
                osc.start(now + delay);
                osc.stop(now + delay + dur);
            };
            // Single resonant bell strike
            createTone(880, 0, 3.0, 0.5);
            createTone(1760, 0, 2.0, 0.15);
            createTone(2640, 0, 1.5, 0.05);
        }
    },
    digital: {
        name: 'Digital Beep',
        play: (ctx, now, volume) => {
            const beep = (delay) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.value = 1000;
                gain.gain.setValueAtTime(0.3 * volume, now + delay);
                gain.gain.setValueAtTime(0, now + delay + 0.15);
                osc.start(now + delay);
                osc.stop(now + delay + 0.15);
            };
            // Two short digital beeps
            beep(0);
            beep(0.25);
        }
    },
    soft: {
        name: 'Soft Tone',
        play: (ctx, now, volume) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 440;
            // Slow attack, slow release
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.4 * volume, now + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.start(now);
            osc.stop(now + 1.8);
        }
    },
    nature: {
        name: 'Nature Chime',
        play: (ctx, now, volume) => {
            const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
            freqs.forEach((freq, i) => {
                const delay = i * 0.15;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(0.35 * volume, now + delay + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.0);
                osc.start(now + delay);
                osc.stop(now + delay + 2.0);
            });
        }
    }
};

const DEFAULT_SETTINGS = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
    volume: 0.5,
    theme: THEMES[0],
    font: 'sans',
    breakStartSound: 'chime',
    breakEndSound: 'bell'
};

const DEFAULT_STATS = {
    completedPomodoros: 0,
    totalFocusSeconds: 0
};

// --- Application State ---
let state = {
    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    timeLeft: 0,
    isRunning: false,
    cycle: 0,
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS },
    timerInterval: null,
    endTime: null
};

// --- Utility Functions ---
const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length == 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    // 6 digits
    } else if (hex.length == 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return `${+r}, ${+g}, ${+b}`;
};

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatStatsTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
};

const playSound = (soundKey) => {
    if (!state.settings.soundEnabled || state.settings.volume === 0) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const sound = SOUNDS[soundKey];
        if (sound) sound.play(ctx, ctx.currentTime, state.settings.volume);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
};

// --- State Management ---
const loadState = () => {
    try {
        const savedSettings = localStorage.getItem('pomo-settings');
        if (savedSettings) state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };

        const savedStats = localStorage.getItem('pomo-stats');
        if (savedStats) state.stats = { ...DEFAULT_STATS, ...JSON.parse(savedStats) };
    } catch (e) {
        console.error("Error loading state", e);
    }

    // Initial Time Setup
    state.timeLeft = state.settings.focus * 60;
    applyTheme();
};

const saveSettings = () => {
    localStorage.setItem('pomo-settings', JSON.stringify(state.settings));
    applyTheme();
};

const saveStats = () => {
    localStorage.setItem('pomo-stats', JSON.stringify(state.stats));
    updateStatsDisplay();
};

// --- DOM Elements ---
const els = {
    timeDisplay: document.getElementById('time-display'),
    phaseLabel: document.getElementById('phase-label'),
    progressDots: document.getElementById('progress-dots'),
    toggleBtn: document.getElementById('toggle-btn'),
    resetBtn: document.getElementById('reset-btn'),
    skipBtn: document.getElementById('skip-btn'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),

    // Modal
    modal: document.getElementById('settings-modal'),
    openBtn: document.getElementById('open-settings'),
    closeDesktop: document.getElementById('close-settings-desktop'),
    closeMobile: document.getElementById('close-settings-mobile'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    sections: document.querySelectorAll('.settings-section'),

    // Inputs
    inputs: {
        focus: document.getElementById('setting-focus'),
        shortBreak: document.getElementById('setting-shortBreak'),
        longBreak: document.getElementById('setting-longBreak'),
        longBreakInterval: document.getElementById('setting-longBreakInterval'),
        bgColor: document.getElementById('setting-bgColor'),
        textColor: document.getElementById('setting-textColor'),
        autoStartBreaks: document.getElementById('setting-autoStartBreaks'),
        autoStartFocus: document.getElementById('setting-autoStartFocus'),
        soundEnabled: document.getElementById('setting-soundEnabled'),
        volume: document.getElementById('setting-volume'),
        breakStartSound: document.getElementById('setting-breakStartSound'),
        breakEndSound: document.getElementById('setting-breakEndSound')
    },

    // UI Text
    bgColorVal: document.getElementById('bg-color-val'),
    textColorVal: document.getElementById('text-color-val'),
    themePresets: document.getElementById('theme-presets'),

    // Stats
    statPomodoros: document.getElementById('stat-pomodoros'),
    statHours: document.getElementById('stat-hours'),
    resetStatsBtn: document.getElementById('reset-stats-btn')
};

// --- Core Logic ---
const applyTheme = () => {
    const root = document.documentElement;
    const theme = state.settings.theme;

    root.style.setProperty('--bg-color', theme.bg);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--font-family', FONTS[state.settings.font]);

    // Calculate RGB for semi-transparent modal background
    const rgb = hexToRgb(theme.bg);
    root.style.setProperty('--modal-bg', `rgba(${rgb}, 0.85)`);
    root.style.setProperty('--bg-rgb', rgb);

    // Update inputs
    els.inputs.bgColor.value = theme.bg;
    els.inputs.textColor.value = theme.text;
    els.bgColorVal.textContent = theme.bg;
    els.textColorVal.textContent = theme.text;

    // Re-render presets to show active state
    renderThemePresets();
};

const renderDisplay = () => {
    els.timeDisplay.textContent = formatTime(state.timeLeft);

    let label = 'FOCUS';
    if (state.mode === 'shortBreak') label = 'SHORT BREAK';
    if (state.mode === 'longBreak') label = 'LONG BREAK';
    els.phaseLabel.textContent = label;

    // Toggle play/pause icons
    if (state.isRunning) {
        els.playIcon.classList.add('hidden');
        els.pauseIcon.classList.remove('hidden');
    } else {
        els.playIcon.classList.remove('hidden');
        els.pauseIcon.classList.add('hidden');
    }

    renderProgressDots();
    document.title = `${formatTime(state.timeLeft)} - ${label}`;
};

const renderProgressDots = () => {
    els.progressDots.innerHTML = '';
    for (let i = 0; i < state.settings.longBreakInterval; i++) {
        const dot = document.createElement('div');
        dot.className = `w-2 h-2 rounded-full transition-all duration-500 border border-current`;
        if (i < state.cycle % state.settings.longBreakInterval) {
            dot.classList.add('bg-current', 'opacity-100', 'scale-125');
        }
        els.progressDots.appendChild(dot);
    }
};

const updateStatsDisplay = () => {
    els.statPomodoros.textContent = state.stats.completedPomodoros;
    els.statHours.textContent = formatStatsTime(state.stats.totalFocusSeconds);
};

const populateSettingsModal = () => {
    els.inputs.focus.value = state.settings.focus;
    els.inputs.shortBreak.value = state.settings.shortBreak;
    els.inputs.longBreak.value = state.settings.longBreak;
    els.inputs.longBreakInterval.value = state.settings.longBreakInterval;

    els.inputs.autoStartBreaks.checked = state.settings.autoStartBreaks;
    els.inputs.autoStartFocus.checked = state.settings.autoStartFocus;
    els.inputs.soundEnabled.checked = state.settings.soundEnabled;
    els.inputs.volume.value = state.settings.volume;
    els.inputs.breakStartSound.value = state.settings.breakStartSound;
    els.inputs.breakEndSound.value = state.settings.breakEndSound;

    const fontRadios = document.querySelectorAll('input[name="fontFamily"]');
    fontRadios.forEach(radio => {
        radio.checked = radio.value === state.settings.font;
    });

    updateStatsDisplay();
    renderThemePresets();
};

const renderThemePresets = () => {
    els.themePresets.innerHTML = '';
    THEMES.forEach(t => {
        const btn = document.createElement('button');
        const isActive = state.settings.theme.name === t.name;
        btn.className = `px-4 py-2 rounded-full text-xs tracking-wider transition-all border`;
        btn.style.backgroundColor = t.bg;
        btn.style.color = t.text;
        btn.style.borderColor = isActive ? t.text : `${t.text}33`;
        btn.textContent = t.name;

        btn.onclick = () => {
            state.settings.theme = { bg: t.bg, text: t.text, name: t.name };
            saveSettings();
        };
        els.themePresets.appendChild(btn);
    });
};

// --- Timer Controls ---
const startTimer = () => {
    if (state.isRunning) return;
    state.isRunning = true;

    // Calculate the exact real-world time this timer should end
    state.endTime = Date.now() + (state.timeLeft * 1000);
    renderDisplay();

    state.timerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.round((state.endTime - now) / 1000);

        if (remaining > 0) {
            // Only re-render if the second has actually changed
            if (state.timeLeft !== remaining) {
                state.timeLeft = remaining;
                renderDisplay();
            }
        } else {
            state.timeLeft = 0;
            handlePhaseComplete();
        }
    }, 200); // Run faster than 1s to ensure UI updates exactly when the second rolls over
};

const pauseTimer = () => {
    state.isRunning = false;
    clearInterval(state.timerInterval);

    // Lock in the exact remaining time when paused
    if (state.endTime) {
        const now = Date.now();
        state.timeLeft = Math.max(0, Math.round((state.endTime - now) / 1000));
        state.endTime = null;
    }

    renderDisplay();
};

const toggleTimer = () => {
    state.isRunning ? pauseTimer() : startTimer();
};

const resetTimer = () => {
    pauseTimer();
    const duration = state.mode === 'focus' ? state.settings.focus :
                     state.mode === 'shortBreak' ? state.settings.shortBreak :
                     state.settings.longBreak;
    state.timeLeft = duration * 60;
    renderDisplay();
};

const skipPhase = () => {
    pauseTimer();

    if (state.mode === 'focus') {
        // Determine next phase without adding to stats (since it was skipped)
        state.cycle++;
        if (state.cycle % state.settings.longBreakInterval === 0) {
            state.mode = 'longBreak';
            state.timeLeft = state.settings.longBreak * 60;
        } else {
            state.mode = 'shortBreak';
            state.timeLeft = state.settings.shortBreak * 60;
        }
    } else {
        // Return to focus
        state.mode = 'focus';
        state.timeLeft = state.settings.focus * 60;
    }

    renderDisplay();
};

const handlePhaseComplete = () => {
    pauseTimer();

    if (state.mode === 'focus') {
        // Focus ended → break starting
        playSound(state.settings.breakStartSound);

        // Update Stats
        state.stats.completedPomodoros++;
        state.stats.totalFocusSeconds += state.settings.focus * 60;
        saveStats();

        // Determine next phase
        state.cycle++;
        if (state.cycle % state.settings.longBreakInterval === 0) {
            state.mode = 'longBreak';
            state.timeLeft = state.settings.longBreak * 60;
        } else {
            state.mode = 'shortBreak';
            state.timeLeft = state.settings.shortBreak * 60;
        }

        if (state.settings.autoStartBreaks) startTimer();

    } else {
        // Break ended → focus starting
        playSound(state.settings.breakEndSound);

        state.mode = 'focus';
        state.timeLeft = state.settings.focus * 60;

        if (state.settings.autoStartFocus) startTimer();
    }

    renderDisplay();
};

// --- Event Listeners ---
const initEventListeners = () => {
    // Main Controls
    els.toggleBtn.addEventListener('click', toggleTimer);
    els.timeDisplay.addEventListener('click', toggleTimer);
    els.resetBtn.addEventListener('click', resetTimer);
    els.skipBtn.addEventListener('click', skipPhase);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if modal is open or user is typing in an input
        if (els.modal.classList.contains('active')) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scrolling
            toggleTimer();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyN') {
            e.preventDefault();
            skipPhase();
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            resetTimer();
        }
    });

    // Modal Controls
    const openModal = () => {
        populateSettingsModal();
        els.modal.classList.add('active');
    };
    const closeModal = () => els.modal.classList.remove('active');

    els.openBtn.addEventListener('click', openModal);
    els.closeDesktop.addEventListener('click', closeModal);
    els.closeMobile.addEventListener('click', closeModal);

    // Close on backdrop click
    els.modal.addEventListener('click', (e) => {
        if (e.target === els.modal) closeModal();
    });

    // Tab Switching
    els.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.tabBtns.forEach(b => b.classList.remove('active'));
            els.sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Settings Inputs
    const handleDurationChange = (key, inputEl) => {
        let val = parseInt(inputEl.value);
        if (isNaN(val) || val < 1) val = 1;
        state.settings[key] = val;
        saveSettings();
        if (!state.isRunning) resetTimer(); // Apply immediately if not running
    };

    els.inputs.focus.addEventListener('change', (e) => handleDurationChange('focus', e.target));
    els.inputs.shortBreak.addEventListener('change', (e) => handleDurationChange('shortBreak', e.target));
    els.inputs.longBreak.addEventListener('change', (e) => handleDurationChange('longBreak', e.target));
    els.inputs.longBreakInterval.addEventListener('change', (e) => handleDurationChange('longBreakInterval', e.target));

    // Preferences Inputs
    els.inputs.autoStartBreaks.addEventListener('change', (e) => { state.settings.autoStartBreaks = e.target.checked; saveSettings(); });
    els.inputs.autoStartFocus.addEventListener('change', (e) => { state.settings.autoStartFocus = e.target.checked; saveSettings(); });
    els.inputs.soundEnabled.addEventListener('change', (e) => { state.settings.soundEnabled = e.target.checked; saveSettings(); });

    els.inputs.volume.addEventListener('input', (e) => {
        state.settings.volume = parseFloat(e.target.value);
        saveSettings();
    });
    els.inputs.volume.addEventListener('change', () => {
        // Play test sound when user releases slider
        playSound(state.settings.breakStartSound);
    });

    // Sound Selection
    els.inputs.breakStartSound.addEventListener('change', (e) => {
        state.settings.breakStartSound = e.target.value;
        saveSettings();
        playSound(e.target.value);
    });
    els.inputs.breakEndSound.addEventListener('change', (e) => {
        state.settings.breakEndSound = e.target.value;
        saveSettings();
        playSound(e.target.value);
    });

    // Font Radios
    document.querySelectorAll('input[name="fontFamily"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.settings.font = e.target.value;
            saveSettings();
        });
    });

    // Custom Colors
    const handleCustomColor = () => {
        state.settings.theme = {
            bg: els.inputs.bgColor.value,
            text: els.inputs.textColor.value,
            name: 'Custom'
        };
        saveSettings();
    };
    els.inputs.bgColor.addEventListener('input', handleCustomColor);
    els.inputs.textColor.addEventListener('input', handleCustomColor);

    // Stats Reset
    els.resetStatsBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to delete all statistics? This cannot be undone.')){
            state.stats = { ...DEFAULT_STATS };
            state.cycle = 0;
            saveStats();
            renderProgressDots();
        }
    });
};

// --- Initialization ---
const init = () => {
    loadState();
    initEventListeners();
    renderDisplay();
};

// Start App
init();
