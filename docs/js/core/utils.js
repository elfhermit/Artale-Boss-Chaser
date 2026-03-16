
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

    function playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 880; // A5
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.warn("Audio play failed", e);
        }
    }

    function sendDesktopNotification(title, body) {
        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body });
                }
            });
        }
    }

    // Export
    window.App.Core.Utils = {
        pad, formatTimeDisplay, formatTime, formatDuration, getBossById, calculateTimerState, parseChannelList, playNotificationSound, sendDesktopNotification
    };
})();
