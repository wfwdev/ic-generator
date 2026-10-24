if (!localStorage.getItem('anon_user_id')) {
    localStorage.setItem('anon_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}
const userId = localStorage.getItem('anon_user_id');

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsthGIMXvc-pFXfc63tGEclGg5V6qCT0s",
    authDomain: "ic-generator-93915.firebaseapp.com",
    projectId: "ic-generator-93915",
    storageBucket: "ic-generator-93915.firebasestorage.app",
    messagingSenderId: "571045375663",
    appId: "1:571045375663:web:591a7f51b5921dac90ae5a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => console.warn("Offline mód korlátozott"));

// === KÉPERNYŐ ÉBRENTARTÁS ===
let wakeLock = null;
const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
        try { wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) { console.error("Wake Lock hiba:", err); }
    }
};
const releaseWakeLock = async () => {
    if (wakeLock !== null) { await wakeLock.release(); wakeLock = null; }
};
document.addEventListener('visibilitychange', () => {
    if (wakeLock !== null && document.visibilityState === 'visible' && localStorage.getItem('settingWakeLock') === 'true') {
        requestWakeLock();
    }
});
if (localStorage.getItem('settingWakeLock') === 'true') requestWakeLock();

// === VISSZAJELZÉS RENDSZER (HANG + VILLANÁS) ===
const playAudioBeep = (type) => {
    if (localStorage.getItem('settingAudio') === 'false') return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); // Magas csip
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); // Mélyebb buzz
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); // Halk, diszkrét pitty a menünek
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.02, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        }
    } catch (e) {}
};

window.playFeedback = (type = 'light') => {
    playAudioBeep(type);
    
    if (localStorage.getItem('settingFlash') !== 'false') {
        const overlay = document.getElementById('flashOverlay');
        if (overlay) {
            overlay.className = ''; // Reset
            void overlay.offsetWidth; // Trigger CSS reflow
            if (type === 'success') overlay.classList.add('flash-active-success');
            else if (type === 'error') overlay.classList.add('flash-active-error');
            else overlay.classList.add('flash-active-light');
            
            setTimeout(() => { overlay.className = ''; }, 50); // Elindítja a CSS fade-outot
        }
    }
};

const formatIC = (raw) => {
    if (!raw) return ''; 
    const c = String(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (c.length !== 13) return c; 
    return `${c.slice(0,2)}.${c.slice(2,6)}-${c.slice(6,10)}.${c.slice(10,11)}.${c.slice(11,13)}`;
};

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
    });
}

let icDatabase = [], currentGenType = 'ESS', editIcId = null;

onSnapshot(collection(db, 'ic_numbers'), (snap) => {
    icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminList();
    updateGenSelect();
}, (error) => {
    console.error("Firebase lekérési hiba: ", error);
});

window.showTab = (name) => {
    playFeedback('light');
    ['generator', 'admin', 'stat', 'info'].forEach(t => { 
        const el = document.getElementById(`tab-${t}`);
        if(el) el.classList.toggle('hidden', t !== name);
    });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(name)));
    
    if (name === 'stat') window.loadStats();
};

window.switchType = (type) => {
    playFeedback('light');
    currentGenType = type;
    document.querySelectorAll('.pill-nav button').forEach(b => b.classList.toggle('active', b.textContent === type));
    updateGenSelect();
};

const updateGenSelect = () => {
    const sel = document.getElementById('genSelect');
    if (!sel) return;
    const filtered = icDatabase.filter(ic => ic.type === currentGenType);
    sel.innerHTML = filtered.length ? '<option value="">-- Válassz --</option>' + 
        filtered.map(ic => `<option value="${ic.code}">${formatIC(ic.code)}</option>`).join('') : '<option>Nincs adat</option>';
};

// === PROFIL, MENÜ ÉS BEÁLLÍTÁSOK LOGIKA ===
window.toggleSideMenu = () => {
    playFeedback('light');
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('sideOverlay');
    const btn = document.getElementById('hamburgerBtn');
    if (!menu || !overlay || !btn) return;
    
    const isOpen = menu.classList.contains('open');
    
    if (isOpen) {
        if (!localStorage.getItem('userName')) {
            playFeedback('error');
            return showToast("Kérlek, add meg a neved a folytatáshoz!");
        }
        menu.classList.remove('open'); overlay.classList.remove('open'); btn.classList.remove('open');
    } else {
        menu.classList.add('open'); overlay.classList.add('open'); btn.classList.add('open');
        document.getElementById('profileName').value = localStorage.getItem('userName') || '';
        document.getElementById('settingAudio').checked = localStorage.getItem('settingAudio') !== 'false';
        document.getElementById('settingFlash').checked = localStorage.getItem('settingFlash') !== 'false';
        document.getElementById('settingWakeLock').checked = localStorage.getItem('settingWakeLock') === 'true';
    }
};

window.closeSideMenu = () => {
    const menu = document.getElementById('sideMenu');
    if(menu && menu.classList.contains('open')) toggleSideMenu();
};

window.saveProfile = () => {
    const name = document.getElementById('profileName').value.trim();
    if (!name) { playFeedback('error'); return showToast("A név megadása kötelező!"); }
    
    localStorage.setItem('userName', name);
    playFeedback('success'); showToast("Mentve!");
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('sideOverlay').classList.remove('open');
    document.getElementById('hamburgerBtn').classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settingAudio')?.addEventListener('change', (e) => {
        localStorage.setItem('settingAudio', e.target.checked);
        if (e.target.checked) playFeedback('success'); // Próbahang lejátszása
    });
    document.getElementById('settingFlash')?.addEventListener('change', (e) => {
        localStorage.setItem('settingFlash', e.target.checked);
        if (e.target.checked) playFeedback('success'); // Próbavillanás
    });
    document.getElementById('settingWakeLock')?.addEventListener('change', (e) => {
        localStorage.setItem('settingWakeLock', e.target.checked);
        if (e.target.checked) { requestWakeLock(); showToast("Kijelző ébrentartása bekapcsolva"); } 
        else releaseWakeLock();
    });
});

setTimeout(() => {
    if (!localStorage.getItem('userName')) {
        const menu = document.getElementById('sideMenu');
        if (menu && !menu.classList.contains('open')) { toggleSideMenu(); showToast("Üdv! Első lépésként add meg az adataidat."); }
    }
}, 800);

// === GENERÁTOR ===
window.generateData = async () => {
    if (!localStorage.getItem('userName')) {
        playFeedback('error'); showToast("Előbb töltsd ki a profilt!");
        const menu = document.getElementById('sideMenu');
        if(menu && !menu.classList.contains('open')) toggleSideMenu();
        return;
    }

    const code = document.getElementById('genSelect').value;
    const amountStr = document.getElementById('genAmount').value;
    const amount = parseInt(amountStr);

    if (!code || !amountStr) { playFeedback('error'); return showToast("Kérlek tölts ki minden mezőt!"); }
    if (amount > 5000) { playFeedback('error'); return showToast("A mennyiség max 5000 lehet!"); }
    if (amount <= 0) { playFeedback('error'); return showToast("Érvénytelen mennyiség!"); }

    playFeedback('success');
    const cleanIC = code.replace(/[^a-zA-Z0-9]/g, '');
    const paddedAmount = amountStr.padStart(7, '0');
    const r10 = Math.floor(Math.random() * 9e9 + 1e9).toString();
    const now = new Date();
    const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, '0'); const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0'); const minutes = String(now.getMinutes()).padStart(2, '0'); const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const qr1Text = `${cleanIC.toLowerCase()}@${year}${month}${day}@${hours}${minutes}${seconds}`;

    document.getElementById('q1-large').innerHTML = ''; document.getElementById('q2-large').innerHTML = '';
    new QRCode(document.getElementById("q1-large"), { text: qr1Text, width: 250, height: 250, correctLevel: QRCode.CorrectLevel.H });
    new QRCode(document.getElementById("q2-large"), { text: `${cleanIC}${paddedAmount}${r10}`, width: 250, height: 250, correctLevel: QRCode.CorrectLevel.H });
    
    document.getElementById('q1-text').innerHTML = `<strong style="color:#000">${qr1Text}</strong>`;
    document.getElementById('q2-text').innerHTML = `<strong style="color:#000">${formatIC(cleanIC)}${paddedAmount}${r10}</strong>`;

    try {
        await addDoc(collection(db, 'logs'), {
            icCode: code, amount: amount, userId: userId, userName: localStorage.getItem('userName'), timestamp: new Date().toISOString()
        });
    } catch (err) { console.error("Firebase hiba:", err); }

    document.getElementById('qrFullscreen').classList.remove('hidden');
};

window.clearGenerator = () => { playFeedback('light'); document.getElementById('genAmount').value = ''; document.getElementById('genSelect').value = ''; };
window.closeQr = () => { playFeedback('light'); document.getElementById('qrFullscreen').classList.add('hidden'); document.getElementById('genAmount').value = ''; document.getElementById('genSelect').value = ''; };

// === BŐVÍTETT STATISZTIKA ===
window.loadStats = async () => {
    try {
        playFeedback('light');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const querySnapshot = await getDocs(collection(db, 'logs'));
        let dayCount = 0, monthCount = 0, allCount = 0, dayAmount = 0, monthAmount = 0;
        const dayIcs = {}, monthIcs = {}, allIcsBreakdown = {}; 
        const uniqueUsers = new Set();

        querySnapshot.forEach((doc) => {
            const data = doc.data(); if (!data.timestamp) return;
            allCount++; if (data.userId) uniqueUsers.add(data.userId);
            if (!allIcsBreakdown[data.icCode]) allIcsBreakdown[data.icCode] = { count: 0, amount: 0 };
            allIcsBreakdown[data.icCode].count++; allIcsBreakdown[data.icCode].amount += (data.amount || 0);

            if (data.timestamp >= firstDayOfMonth) { monthCount++; monthAmount += (data.amount || 0); monthIcs[data.icCode] = (monthIcs[data.icCode] || 0) + 1; }
            if (data.timestamp >= today) { dayCount++; dayAmount += (data.amount || 0); dayIcs[data.icCode] = (dayIcs[data.icCode] || 0) + 1; }
        });

        const getTopIc = (countsObj) => {
            let topIc = "Nincs adat", maxCount = 0;
            for (const [ic, count] of Object.entries(countsObj)) { if (count > maxCount) { maxCount = count; topIc = `${formatIC(ic)} (${count}x)`; } }
            return topIc;
        };

        document.getElementById('statDayCount').innerText = dayCount; document.getElementById('statDayAmount').innerText = dayAmount.toLocaleString('hu-HU') + ' db'; document.getElementById('statDayTop').innerText = getTopIc(dayIcs);
        document.getElementById('statMonthCount').innerText = monthCount; document.getElementById('statMonthAmount').innerText = monthAmount.toLocaleString('hu-HU') + ' db'; document.getElementById('statMonthTop').innerText = getTopIc(monthIcs);
        document.getElementById('statAllCount').innerText = allCount; document.getElementById('statAllUsers').innerText = uniqueUsers.size;

        const statIcBreakdownEl = document.getElementById('statIcBreakdown');
        if (statIcBreakdownEl) {
            const sortedIcs = Object.entries(allIcsBreakdown).sort((a, b) => b[1].count - a[1].count);
            if (sortedIcs.length === 0) statIcBreakdownEl.innerHTML = '<div class="text-center text-muted small py-2">Nincs még rögzített adat.</div>';
            else statIcBreakdownEl.innerHTML = sortedIcs.map(([ic, stats]) => `<div class="d-flex justify-content-between align-items-center p-2 rounded mb-1" style="background: var(--sur); border: 1px solid var(--bord);"><strong class="text-primary" style="font-family: monospace; font-size: 0.95rem;">${formatIC(ic)}</strong><div class="text-end"><div class="fw-bold" style="font-size: 0.9rem;">${stats.count}x generálva</div><div class="text-muted" style="font-size: 0.75rem;">Összesen: ${stats.amount.toLocaleString('hu-HU')} db</div></div></div>`).join('');
        }
    } catch (error) { showToast("Hiba történt az adatok letöltésekor!"); }
};

// === ADMIN ===
const renderAdminList = () => {
    const list = document.getElementById('adminList');
    if (!list) return;
    list.innerHTML = icDatabase.sort((a,b) => (a.code || "").localeCompare(b.code || "")).map(ic => `<div class="list-group-item d-flex justify-content-between align-items-center"><div><span class="badge me-2 ${ic.type==='ESS'?'bg-primary':'bg-warning'}">${ic.type}</span><b>${formatIC(ic.code)}</b></div><button class="btn btn-sm btn-light" onclick="openIcModal('${ic.id}')">✏️</button></div>`).join('') || '<p class="text-center py-4 small text-muted">Üres lista.</p>';
};

window.openIcModal = (id = null) => {
    playFeedback('light'); editIcId = id; const ic = id ? icDatabase.find(x => x.id === id) : null;
    document.getElementById('imCode').value = ic?.code || ''; document.getElementById('imType').value = ic?.type || 'ESS';
    document.getElementById('imDel').style.display = id ? 'block' : 'none'; document.getElementById('icModal').classList.add('open');
};

window.saveIc = async () => {
    let code = document.getElementById('imCode').value.trim().toUpperCase(); const type = document.getElementById('imType').value;
    const cleanCode = code.replace(/[^A-Z0-9]/gi, '');
    if (cleanCode.length !== 13) { playFeedback('error'); return showToast("Az IC száma pontosan 13 karakter kell legyen!"); }
    if (icDatabase.some(ic => ic.code === cleanCode && ic.id !== editIcId)) { playFeedback('error'); return showToast("Ez az IC már szerepel az adatbázisban!"); }

    playFeedback('success');
    try {
        editIcId ? await updateDoc(doc(db, 'ic_numbers', editIcId), {code: cleanCode, type}) : await addDoc(collection(db, 'ic_numbers'), {code: cleanCode, type});
        closeModal('icModal'); showToast("Adatbázis frissítve! ✓");
    } catch (error) { showToast("Hiba történt a mentéskor!"); }
};

window.deleteIc = async () => {
    if (confirm("Biztosan törlöd?")) { playFeedback('error'); if (editIcId) await deleteDoc(doc(db, 'ic_numbers', editIcId)); closeModal('icModal'); }
};
window.closeModal = (id) => { playFeedback('light'); const modal = document.getElementById(id); if(modal) modal.classList.remove('open'); };

const showToast = (m) => {
    const msgEl = document.getElementById('toastMsg'); const toastEl = document.getElementById('liveToast');
    if (msgEl && toastEl) { msgEl.textContent = m; new bootstrap.Toast(toastEl).show(); }
};

// === PWA FRISSÍTÉS ===
if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!refreshing) { window.location.reload(); refreshing = true; } });
    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) showUpdateButton(newWorker);
            });
        });
    }).catch(err => console.error("SW hiba:", err));
}
function showUpdateButton(worker) {
    playFeedback('success'); const updateBtn = document.getElementById('updateBadgeBtn');
    if (updateBtn) {
        updateBtn.classList.remove('hidden');
        updateBtn.addEventListener('click', () => {
            playFeedback('light'); updateBtn.innerText = 'Töltés...'; updateBtn.style.animation = 'none';
            worker.postMessage({ type: 'SKIP_WAITING' });
        });
    }
}
