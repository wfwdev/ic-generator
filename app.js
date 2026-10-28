// ============================================================================
// 1. KÖZÖS UI KOMPONENSEK BEFECSKENDEZÉSE (Minden oldalon automatikusan lefut)
// ============================================================================
const injectSharedUI = () => {
    // Hol vagyunk épp?
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path === '/' || path === '';
    const pageTitle = isHome ? "Műszak App" : "IC Generator";
    
    // Felső sáv bal oldali gombja (Kezdőlapon Hamburger, máshol Vissza gomb)
    const navLeftBtn = isHome 
        ? `<button id="hamburgerBtn" class="hamburger-btn" onclick="toggleSideMenu()"><span></span><span></span><span></span></button>` 
        : `<button class="btn text-white p-0 me-3" style="font-size: 1.5rem; line-height: 1;" onclick="window.location.href='index.html'">←</button>`;

    // Felső menüsáv
    const navbarHTML = `
    <div id="flashOverlay"></div>
    <nav class="navbar fixed-top">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                ${navLeftBtn}
                <div class="navbar-title text-white fw-bold ${!isHome ? 'ms-1' : ''}">${pageTitle}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button id="updateBadgeBtn" class="btn btn-sm hidden" style="font-size: 0.75rem; border-radius: 20px; font-weight: bold; background: #ffc107; color: #000; border: none; z-index: 9999;">🔄 Frissítés</button>
                <button id="xmasBtn" class="nav-btn border-0 bg-transparent hidden">🎁</button>
                <button id="themeToggle" class="nav-btn border-0 bg-transparent">🌙</button>
            </div>
        </div>
    </nav>`;

    // Oldalsó menü, Modálok és Értesítések
    const globalsHTML = `
    <!-- PROFIL MENÜ -->
    <div class="side-overlay" id="sideOverlay" onclick="closeSideMenu()"></div>
    <div class="side-menu" id="sideMenu">
        <h5 class="fw-bold mb-4 text-primary d-flex align-items-center gap-2"><span style="font-size: 1.5rem;">👤</span> Profil adatok</h5>
        <div class="info-block highlight mb-4"><p style="font-size: 0.8rem; line-height: 1.4;">A generátor használatához kérlek add meg a nevedet.</p></div>
        <div class="mb-4"><label class="form-label small fw-bold">Név / Azonosító *</label><input type="text" id="profileName" class="form-control" placeholder="Pl. Kiss János"></div>
        <hr class="my-3" style="border-color: var(--bord);">
        <h6 class="text-primary mb-3 fw-bold d-flex align-items-center gap-2">⚙️ Beállítások</h6>
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-2" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Hangjelzés</div><div class="text-muted" style="font-size: 0.7rem;">Csippanás generáláskor</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingAudio"></div>
        </div>
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-2" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Képernyő villanás</div><div class="text-muted" style="font-size: 0.7rem;">Vizuális effekt a széleken</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingFlash"></div>
        </div>
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-4" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Ébrentartás</div><div class="text-muted" style="font-size: 0.7rem;">Kijelző ne kapcsoljon ki</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingWakeLock"></div>
        </div>
        <div class="mt-4 pb-5"><button class="btn btn-primary w-100 btn-lg" onclick="saveProfile()">Mentés & Bezárás</button></div>
    </div>
    
    <!-- ADVENTI NAPTÁR MODÁL -->
    <div class="overlay" id="adventModal">
        <div class="modal-custom" style="max-height: 85vh; display: flex; flex-direction: column;">
            <h4 class="fw-bold mb-1 text-primary">🎄 Adventi Naptár</h4><p class="small text-muted mb-0">Minden nap egy kis apróság a műszakhoz!</p>
            <div id="adventGrid" class="advent-grid" style="overflow-y: auto; padding: 5px; margin-bottom: 15px;"></div>
            <button class="btn btn-light w-100 mt-auto" onclick="closeModal('adventModal')">Bezárás</button>
        </div>
    </div>

    <!-- TOAST ÜZENETEK -->
    <div class="toast-container"><div id="liveToast" class="toast align-items-center text-white bg-dark border-0" role="alert"><div class="d-flex"><div class="toast-body" id="toastMsg"></div></div></div></div>
    `;

    // HTML befecskendezése (Ha esetleg még nincsenek bent)
    if (!document.querySelector('.navbar')) {
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    }
    if (!document.getElementById('sideMenu')) {
        document.body.insertAdjacentHTML('beforeend', globalsHTML);
    }
};

injectSharedUI();

// ============================================================================
// 2. JOGOSULTSÁG KEZELÉS (RBAC)
// ============================================================================
if (!localStorage.getItem('anon_user_id')) {
    localStorage.setItem('anon_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}

window.currentUser = {
    id: localStorage.getItem('anon_user_id'),
    name: localStorage.getItem('userName'),
    role: localStorage.getItem('userRole') || 'operator' // Alapértelmezett: operátor
};

// Ki hova léphet be?
window.PAGE_PERMISSIONS = {
    'index.html': ['operator', 'leader', 'admin'],
    '': ['operator', 'leader', 'admin'], 
    'ic-generator.html': ['operator', 'leader', 'admin'],
    'mes-terminal.html': ['leader', 'admin'], 
    'pack-code.html': ['leader', 'admin'],
    'admin.html': ['admin']
};

const checkPageAccess = () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const allowedRoles = window.PAGE_PERMISSIONS[currentPath];
    if (allowedRoles && !allowedRoles.includes(window.currentUser.role)) {
        alert("🔒 Nincs jogosultságod ennek az oldalnak a megtekintéséhez!");
        window.location.replace('index.html');
    }
};

window.checkAndGo = (url) => {
    const allowedRoles = window.PAGE_PERMISSIONS[url];
    if (allowedRoles && !allowedRoles.includes(window.currentUser.role)) {
        alert("🔒 Ehhez a modulhoz Csoportvezetői vagy Admin jogosultság szükséges!");
        return;
    }
    window.location.href = url;
};

checkPageAccess();

// ============================================================================
// 3. FIREBASE INICIALIZÁLÁS
// ============================================================================
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

// ============================================================================
// 4. KÉPERNYŐ ÉBRENTARTÁS, HANG ÉS VILLANÁS
// ============================================================================
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
    if (wakeLock !== null && document.visibilityState === 'visible' && localStorage.getItem('settingWakeLock') === 'true') requestWakeLock();
});
if (localStorage.getItem('settingWakeLock') === 'true') requestWakeLock();

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
            osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
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
            overlay.className = ''; void overlay.offsetWidth;
            if (type === 'success') overlay.classList.add('flash-active-success');
            else if (type === 'error') overlay.classList.add('flash-active-error');
            else overlay.classList.add('flash-active-light');
            setTimeout(() => { overlay.className = ''; }, 50);
        }
    }
};

window.showToast = (m) => {
    const msgEl = document.getElementById('toastMsg'); const toastEl = document.getElementById('liveToast');
    if (msgEl && toastEl) { msgEl.textContent = m; new bootstrap.Toast(toastEl).show(); }
};

const formatIC = (raw) => {
    if (!raw) return ''; 
    const c = String(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (c.length !== 13) return c; 
    return `${c.slice(0,2)}.${c.slice(2,6)}-${c.slice(6,10)}.${c.slice(10,11)}.${c.slice(11,13)}`;
};

// ============================================================================
// 5. TÉMA VÁLTÓ
// ============================================================================
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

// ============================================================================
// 6. PROFIL ÉS BEÁLLÍTÁSOK MENÜ
// ============================================================================
window.toggleSideMenu = () => {
    playFeedback('light');
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('sideOverlay');
    const btn = document.getElementById('hamburgerBtn');
    if (!menu || !overlay) return;
    
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
        if (!localStorage.getItem('userName')) { playFeedback('error'); return showToast("Kérlek, add meg a neved a folytatáshoz!"); }
        menu.classList.remove('open'); overlay.classList.remove('open'); if(btn) btn.classList.remove('open');
    } else {
        menu.classList.add('open'); overlay.classList.add('open'); if(btn) btn.classList.add('open');
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
    window.currentUser.name = name;
    playFeedback('success'); showToast("Mentve!");
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('sideOverlay').classList.remove('open');
    const btn = document.getElementById('hamburgerBtn');
    if(btn) btn.classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settingAudio')?.addEventListener('change', (e) => {
        localStorage.setItem('settingAudio', e.target.checked); if (e.target.checked) playFeedback('success');
    });
    document.getElementById('settingFlash')?.addEventListener('change', (e) => {
        localStorage.setItem('settingFlash', e.target.checked); if (e.target.checked) playFeedback('success');
    });
    document.getElementById('settingWakeLock')?.addEventListener('change', (e) => {
        localStorage.setItem('settingWakeLock', e.target.checked);
        if (e.target.checked) { requestWakeLock(); showToast("Ébrentartás bekapcsolva"); } else releaseWakeLock();
    });

    setTimeout(() => {
        if (!localStorage.getItem('userName')) {
            const menu = document.getElementById('sideMenu');
            if (menu && !menu.classList.contains('open')) { toggleSideMenu(); showToast("Első lépésként add meg a nevedet."); }
        }
    }, 800);
});

// ============================================================================
// 7. IC GENERÁTOR, ADMIN ÉS STATISZTIKA LOGIKA (ic-generator.html)
// ============================================================================
let icDatabase = [], currentGenType = 'ESS', editIcId = null;

// Tab váltó (Csak az ic-generator.html belső füleihez)
window.showTab = (name) => {
    playFeedback('light');
    ['generator', 'admin', 'stat'].forEach(t => { 
        const el = document.getElementById(`tab-${t}`);
        if(el) el.classList.toggle('hidden', t !== name);
    });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${name}'`)));
    if (name === 'stat') window.loadStats();
};

window.switchType = (type) => {
    playFeedback('light'); currentGenType = type;
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

onSnapshot(collection(db, 'ic_numbers'), (snap) => {
    icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if(document.getElementById('adminList')) renderAdminList();
    updateGenSelect();
}, (error) => console.error("Firebase lekérési hiba: ", error));

window.generateData = async () => {
    if (!localStorage.getItem('userName')) { playFeedback('error'); showToast("Előbb töltsd ki a profilt!"); return toggleSideMenu(); }
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
            icCode: code, amount: amount, userId: window.currentUser.id, userName: window.currentUser.name, timestamp: new Date().toISOString()
        });
    } catch (err) { console.error("Firebase hiba:", err); }

    document.getElementById('qrFullscreen').classList.remove('hidden');
};

window.closeQr = () => { playFeedback('light'); document.getElementById('qrFullscreen').classList.add('hidden'); document.getElementById('genAmount').value = ''; document.getElementById('genSelect').value = ''; };

// Statisztika
window.loadStats = async () => {
    try {
        playFeedback('light');
        const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
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

        if(document.getElementById('statDayCount')) {
            document.getElementById('statDayCount').innerText = dayCount; document.getElementById('statDayAmount').innerText = dayAmount.toLocaleString('hu-HU') + ' db'; document.getElementById('statDayTop').innerText = getTopIc(dayIcs);
            document.getElementById('statMonthCount').innerText = monthCount; document.getElementById('statMonthAmount').innerText = monthAmount.toLocaleString('hu-HU') + ' db'; document.getElementById('statMonthTop').innerText = getTopIc(monthIcs);
            document.getElementById('statAllCount').innerText = allCount; document.getElementById('statAllUsers').innerText = uniqueUsers.size;
        }

        const statIcBreakdownEl = document.getElementById('statIcBreakdown');
        if (statIcBreakdownEl) {
            const sortedIcs = Object.entries(allIcsBreakdown).sort((a, b) => b[1].count - a[1].count);
            if (sortedIcs.length === 0) statIcBreakdownEl.innerHTML = '<div class="text-center text-muted small py-2">Nincs még rögzített adat.</div>';
            else statIcBreakdownEl.innerHTML = sortedIcs.map(([ic, stats]) => `<div class="d-flex justify-content-between align-items-center p-2 rounded mb-1" style="background: var(--sur); border: 1px solid var(--bord);"><strong class="text-primary" style="font-family: monospace; font-size: 0.95rem;">${formatIC(ic)}</strong><div class="text-end"><div class="fw-bold" style="font-size: 0.9rem;">${stats.count}x generálva</div><div class="text-muted" style="font-size: 0.75rem;">Összesen: ${stats.amount.toLocaleString('hu-HU')} db</div></div></div>`).join('');
        }
    } catch (error) { showToast("Hiba történt az adatok letöltésekor!"); }
};

// Admin
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

// ============================================================================
// 8. PWA FRISSÍTÉS ÉS ÜNNEPI MÓD
// ============================================================================
if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!refreshing) { window.location.reload(); refreshing = true; } });
    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    playFeedback('success'); const updateBtn = document.getElementById('updateBadgeBtn');
                    if (updateBtn) {
                        updateBtn.classList.remove('hidden');
                        updateBtn.addEventListener('click', () => {
                            playFeedback('light'); updateBtn.innerText = 'Töltés...'; updateBtn.style.animation = 'none';
                            worker.postMessage({ type: 'SKIP_WAITING' });
                        });
                    }
                }
            });
        });
    }).catch(err => console.error("SW hiba:", err));
}

const xmasMessages = [
    "Első nap! Igyál egy jó kávét a gépből, megérdemled! ☕", "Kitartás, közeleg a hétvége! 🚀", "Mai kihívás: Dicsérd meg az egyik kollégádat! 🤝", "Generálj ma hibátlanul! 😎",
    "Jön a Mikulás! Pucold ki a bakancsot! 🎅", "Boldog Mikulást! Kérj egy szaloncukrot a műszakvezetőtől! 🍬", "Már egy hete nyitogatod az ablakokat! Szép munka! 🏭", "Csak lazán, ma senki sem hajt a tatár! 🧘",
    "Figyelted már, milyen szépen hullik a hó az appban? ❄️", "Mai bónusz: Veregesd vállon magad egy jó IC beolvasás után! 👏", "Félidő! Rohamosan közeleg a Karácsony! 🎄", "Lassan érdemes elgondolkodni az ajándékokon... 🎁",
    "Igyál egy pohár vizet, fontos a hidratálás! 💧", "Ma minden vonalkód elsőre zöld lesz. (Reméljük!) 🟢", "Tudtad? Az IC generátor is várja már az ünnepeket! 🤖", "Lassan itt a pihenés ideje. Tarts ki! 🔋",
    "Egy mosoly sokat segít a műszak végén. Próbáld ki! 😁", "Már csak egy hét Szentestéig! ⏳", "Hajrá! Mindenki számít a munkádra! 💪", "Érzed már a bejgli illatát? 🥐",
    "Ma este nézz meg egy jó filmet otthon! 🎬", "Mindjárt itt az ünnep! Utolsó hajrá! 🏎️", "Holnap Karácsony! Ma már csak óvatosan a raklapokkal! ⚠️", "🎄 BOLDOG KARÁCSONYT KÍVÁN AZ IC GENERATOR! 🎄 Pihenj sokat!"
];

const initXmasFeatures = () => {
    const d = new Date();
    const month = d.getMonth(); 
    const date = d.getDate();

    // TESZT IDŐGÉPHEZ VEDD KI A // JELET (ÉS KOMMENTELD KI A FENTIEKET)
    // const month = 11; const date = 5;

    const xmasBtn = document.getElementById('xmasBtn');
    if (!xmasBtn) return;

    if (month === 10 && date >= 15) {
        xmasBtn.classList.remove('hidden');
        const newBtn = xmasBtn.cloneNode(true); xmasBtn.parentNode.replaceChild(newBtn, xmasBtn);
        newBtn.addEventListener('click', () => { playFeedback('error'); showToast("🎁 Türelem! Valami különleges meglepetés készül decemberre..."); });
    } 
    else if (month === 11 && date <= 31) {
        xmasBtn.classList.remove('hidden');
        const newBtn = xmasBtn.cloneNode(true); xmasBtn.parentNode.replaceChild(newBtn, xmasBtn);
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.textContent = document.body.classList.contains('dark-mode') ? '⛄' : '❄️';
            themeBtn.addEventListener('click', () => setTimeout(() => themeBtn.textContent = document.body.classList.contains('dark-mode') ? '⛄' : '❄️', 50));
        }

        setInterval(() => {
            const flake = document.createElement('div'); flake.classList.add('snowflake'); flake.style.left = Math.random() * 100 + 'vw';
            flake.style.animationDuration = Math.random() * 3 + 5 + 's'; flake.innerHTML = '❄️';
            document.body.appendChild(flake); setTimeout(() => flake.remove(), 8000); 
        }, 1500); 

        newBtn.addEventListener('click', () => {
            playFeedback('light'); renderAdvent(date); document.getElementById('adventModal').classList.add('open');
        });
    }
};

const renderAdvent = (currentDay) => {
    const grid = document.getElementById('adventGrid'); if (!grid) return; grid.innerHTML = '';
    const openedDays = JSON.parse(localStorage.getItem('adventOpened') || '[]');

    for (let i = 1; i <= 24; i++) {
        const box = document.createElement('div'); box.classList.add('advent-day'); box.textContent = i;
        if (i > currentDay) {
            box.classList.add('locked'); box.onclick = () => { playFeedback('error'); showToast("Ezt még nem nyithatod ki! 🛑"); };
        } else if (openedDays.includes(i)) {
            box.classList.add('opened'); box.innerHTML = '🎁'; box.onclick = () => { playFeedback('success'); alert(`🎄 ${i}. Nap:\n\n${xmasMessages[i-1]}`); };
        } else {
            box.onclick = () => {
                playFeedback('success'); box.classList.add('opened'); box.innerHTML = '🎁';
                openedDays.push(i); localStorage.setItem('adventOpened', JSON.stringify(openedDays));
                alert(`🎄 ${i}. Nap:\n\n${xmasMessages[i-1]}`);
            };
        }
        grid.appendChild(box);
    }
};

document.addEventListener('DOMContentLoaded', initXmasFeatures);
