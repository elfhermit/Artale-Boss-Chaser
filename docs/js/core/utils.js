
(function () {
    function pad(n) {
        return n.toString().padStart(2, '0');
    }

    function formatTimeDisplay(date) {
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
        const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        return isToday ? timeStr : `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`;
    }

    function formatTime(date) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function formatDuration(secs) {
        if (secs < 0) secs = 0;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
        return `${pad(m)}:${pad(s)}`;
    }

    function getBossById(bosses, id) {
        return bosses.find(b => b.id === id);
    }

    function calculateTimerState(boss, killTimeStr) {
        const now = new Date();
        const killTime = new Date(killTimeStr);

        const minRespawnTime = new Date(killTime.getTime() + boss.minMinutes * 60000);
        const maxRespawnTime = new Date(killTime.getTime() + boss.maxMinutes * 60000);

        const secondsToMin = (minRespawnTime - now) / 1000;
        const secondsToMax = (maxRespawnTime - now) / 1000;

        if (secondsToMin <= 0) {
            if (secondsToMax > 0) {
                return { status: 'alive', text: '🟢 可能已出', timer: `區間剩 ${formatDuration(secondsToMax)}`, secondsToMin: secondsToMin };
            } else {
                return { status: 'alive', text: '🟢 必出', timer: '立即前往', secondsToMin: secondsToMin };
            }
        } else if (secondsToMin <= 600) { // 10 minutes warning for visuals
            // We can refine this in main loop for audio
            return { status: 'warning', text: '🟡 即將重生', timer: formatDuration(secondsToMin), secondsToMin: secondsToMin };
        } else {
            return { status: 'cooldown', text: '🔴 冷卻中', timer: formatDuration(secondsToMin), secondsToMin: secondsToMin };
        }
    }

    function parseChannelList(raw) {
        if (!raw) return [];
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        const out = new Set();
        for (const p of parts) {
            if (p.includes('-')) {
                const [a, b] = p.split('-').map(x => parseInt(x.trim())).filter(n => !isNaN(n));
                if (!isNaN(a) && !isNaN(b)) {
                    const start = Math.min(a, b), end = Math.max(a, b);
                    for (let i = start; i <= end; i++) out.add(i);
                }
            } else {
                const n = parseInt(p);
                if (!isNaN(n)) out.add(n);
            }
        }
        return Array.from(out).sort((a, b) => a - b).filter(n => n >= 1 && n <= 3000);
    }

    function playNotificationSound(type) {
        type = type || (window.App && window.App.Core.State && window.App.Core.State.state.settings.soundType) || 'ding';
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const now = ctx.currentTime;

            if (type === 'bell') {
                // Bell: harmonic-rich double tone
                [880, 1320].forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = f;
                    osc.connect(g); g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.001, now);
                    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02 + i * 0.06);
                    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
                    osc.start(now); osc.stop(now + 1.0);
                });
            } else if (type === 'drum') {
                // Drum: low sine + quick decay
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
                osc.connect(g); g.connect(ctx.destination);
                g.gain.setValueAtTime(0.25, now);
                g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                osc.start(now); osc.stop(now + 0.3);
            } else {
                // Ding (default): single sine ping
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 880;
                osc.connect(g); g.connect(ctx.destination);
                g.gain.setValueAtTime(0.12, now);
                g.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            }
        } catch (e) {
            console.warn("Audio play failed", e);
        }
    }

    function isDesktopNotificationSupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }

    function requestDesktopNotification() {
        if (!isDesktopNotificationSupported()) return Promise.resolve('unsupported');
        if (Notification.permission === 'granted') return Promise.resolve('granted');
        if (Notification.permission === 'denied') return Promise.resolve('denied');
        try {
            return Notification.requestPermission();
        } catch (e) {
            return Promise.resolve('error');
        }
    }

    function showDesktopNotification(title, body, onClick) {
        if (!isDesktopNotificationSupported()) return null;
        if (Notification.permission !== 'granted') return null;
        try {
            const n = new Notification(title, { body, tag: 'artale-boss', renotify: true });
            if (typeof onClick === 'function') {
                n.onclick = function () {
                    try { window.focus(); } catch (e) {}
                    try { onClick(); } catch (e) {}
                    n.close();
                };
            }
            return n;
        } catch (e) { return null; }
    }

    function relativeTimeFromNow(date) {
        const now = new Date();
        const diff = (now - date) / 1000;
        if (diff < 60) return '剛剛';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
        return `${Math.floor(diff / 86400)} 天前`;
    }

    // Export
    window.App.Core.Utils = {
        pad, formatTimeDisplay, formatTime, formatDuration, getBossById, calculateTimerState, parseChannelList,
        playNotificationSound, requestDesktopNotification, showDesktopNotification, isDesktopNotificationSupported,
        relativeTimeFromNow
    };
})();
