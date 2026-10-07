if (!localStorage.getItem('anon_user_id')) {
    localStorage.setItem('anon_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}
const userId = localStorage.getItem('anon_user_id');


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// === HAPTIKUS VISSZAJELZÉS (Biztonságos hívás) ===
const haptic = (type = 'light') => {
    if (!("vibrate" in navigator)) return;
    try {
        if (type === 'light') navigator.vibrate(30);
        if (type === 'success') navigator.vibrate([40, 30, 40]);
        if (type === 'error') navigator.vibrate([100, 50, 100]);
    } catch (e) {}
};

// === IC FORMÁZÓ (Hibajavított, nem fagy le üres adatnál) ===
const formatIC = (raw) => {
    if (!raw) return ''; 
    const c = String(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (c.length !== 13) return c; 
    return `${c.slice(0,2)}.${c.slice(2,6)}-${c.slice(6,10)}.${c.slice(10,11)}.${c.slice(11,13)}`;
};

// === SÖTÉT MÓD LOGIKA ===
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

// === ADATBÁZIS FIGYELÉS ===
onSnapshot(collection(db, 'ic_numbers'), (snap) => {
    icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminList();
    updateGenSelect();
}, (error) => {
    console.error("Firebase lekérési hiba: ", error);
});

// === UI KEZELÉS ===
window.showTab = (name) => {
    haptic('light');
    ['generator', 'admin', 'info'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if(el) el.classList.toggle('hidden', t !== name);
    });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(name)));
};

window.switchType = (type) => {
    haptic('light');
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

// === GENERÁTOR ===
// === GENERÁTOR ===
window.generateData = () => {
    const code = document.getElementById('genSelect').value;
    const amountStr = document.getElementById('genAmount').value;
    const amount = parseInt(amountStr);

    if (!code || !amountStr) { haptic('error'); return showToast("Kérlek tölts ki minden mezőt!"); }
    if (amount > 5000) { haptic('error'); return showToast("A mennyiség max 5000 lehet!"); }
    if (amount <= 0) { haptic('error'); return showToast("Érvénytelen mennyiség!"); }

    haptic('success');
    const cleanIC = code.replace(/[^a-zA-Z0-9]/g, '');
    const paddedAmount = amountStr.padStart(7, '0');
    
    // A 2. QR kód random kiegészítése maradt
    const r10 = Math.floor(Math.random() * 9e9 + 1e9).toString();

    // === ÚJ LOGIKA AZ 1. QR KÓDHOZ ===
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Formátum felépítése (Pl: a2c0131370200@20260427@092355)
    // cleanIC.toLowerCase() a kisbetűs formátumhoz
    const qr1Text = `${cleanIC.toLowerCase()}@${year}${month}${day}@${hours}${minutes}${seconds}`;

    document.getElementById('q1-large').innerHTML = '';
    document.getElementById('q2-large').innerHTML = '';

    // QR kódok legenerálása
    new QRCode(document.getElementById("q1-large"), { text: qr1Text, width: 250, height: 250, correctLevel: QRCode.CorrectLevel.H });
    new QRCode(document.getElementById("q2-large"), { text: `${cleanIC}${paddedAmount}${r10}`, width: 250, height: 250, correctLevel: QRCode.CorrectLevel.H });
    
    // Szövegek beállítása a QR kódok alá
    document.getElementById('q1-text').innerHTML = `<strong style="color:#000">${qr1Text}</strong>`;
    document.getElementById('q2-text').innerHTML = `<strong style="color:#000">${formatIC(cleanIC)}${paddedAmount}${r10}</strong>`;

    document.getElementById('qrFullscreen').classList.remove('hidden');
};


window.clearGenerator = () => {
    haptic('light');
    document.getElementById('genAmount').value = '';
    document.getElementById('genSelect').value = '';
};

window.closeQr = () => {
    haptic('light');
    document.getElementById('qrFullscreen').classList.add('hidden');
    document.getElementById('genAmount').value = '';
    document.getElementById('genSelect').value = '';
};

// === ADMIN ===
const renderAdminList = () => {
    const list = document.getElementById('adminList');
    if (!list) return;
    list.innerHTML = icDatabase.sort((a,b) => (a.code || "").localeCompare(b.code || "")).map(ic => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div><span class="badge me-2 ${ic.type==='ESS'?'bg-primary':'bg-warning'}">${ic.type}</span><b>${formatIC(ic.code)}</b></div>
            <button class="btn btn-sm btn-light" onclick="openIcModal('${ic.id}')">✏️</button>
        </div>`).join('') || '<p class="text-center py-4 small text-muted">Üres lista.</p>';
};

window.openIcModal = (id = null) => {
    haptic('light');
    editIcId = id;
    const ic = id ? icDatabase.find(x => x.id === id) : null;
    document.getElementById('imCode').value = ic?.code || '';
    document.getElementById('imType').value = ic?.type || 'ESS';
    document.getElementById('imDel').style.display = id ? 'block' : 'none';
    document.getElementById('icModal').classList.add('open');
};

window.saveIc = async () => {
    let code = document.getElementById('imCode').value.trim().toUpperCase();
    const type = document.getElementById('imType').value;
    
    const cleanCode = code.replace(/[^A-Z0-9]/gi, '');

    if (cleanCode.length !== 13) {
        haptic('error');
        return showToast("Az IC száma pontosan 13 karakter kell legyen!");
    }

    const isDuplicate = icDatabase.some(ic => ic.code === cleanCode && ic.id !== editIcId);
    if (isDuplicate) {
        haptic('error');
        return showToast("Ez az IC már szerepel az adatbázisban!");
    }

    haptic('success');
    try {
        editIcId ? 
            await updateDoc(doc(db, 'ic_numbers', editIcId), {code: cleanCode, type}) : 
            await addDoc(collection(db, 'ic_numbers'), {code: cleanCode, type});
        
        closeModal('icModal');
        showToast("Adatbázis frissítve! ✓");
    } catch (error) {
        showToast("Hiba történt a mentéskor!");
        console.error(error);
    }
};

window.deleteIc = async () => {
    if (confirm("Biztosan törlöd?")) {
        haptic('error');
        if (editIcId) await deleteDoc(doc(db, 'ic_numbers', editIcId));
        closeModal('icModal');
    }
};

window.closeModal = (id) => {
    haptic('light');
    document.getElementById(id).classList.remove('open');
};

const showToast = (m) => {
    const msgEl = document.getElementById('toastMsg');
    const toastEl = document.getElementById('liveToast');
    if (msgEl && toastEl) {
        msgEl.textContent = m;
        new bootstrap.Toast(toastEl).show();
    }
};

// === PWA FRISSÍTÉS DETEKTOR ÉS BANNER ===
if ('serviceWorker' in navigator) {
    let refreshing = false;

    // Ha az új verzió átveszi az irányítást, frissítsük az oldalt
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });

    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                // Ha sikeresen letöltött egy új verziót, és van már egy régi aktív
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateBanner(newWorker);
                }
            });
        });
    }).catch(err => console.error("SW hiba:", err));
}

// A vizuális "Frissítés" banner létrehozása
function showUpdateBanner(worker) {
    haptic('success');
    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
        <span>Új verzió elérhető!</span>
        <button id="reloadAppBtn">Frissítés</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('reloadAppBtn').addEventListener('click', () => {
        haptic('light');
        banner.innerHTML = 'Frissítés folyamatban...';
        // Szólunk a Service Workernek, hogy aktiválja az új kódot
        worker.postMessage({ type: 'SKIP_WAITING' });
    });
}
