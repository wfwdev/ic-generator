// === KÖZÖS UI BEFECSKENDEZÉS ÉS VISSZAJELZÉSEK ===
export const injectSharedUI = () => {
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path === '/' || path === '';
    const pageTitle = isHome ? "Műszak App" : "Gyári Modul";
    
    const navLeftBtn = isHome 
        ? `<button id="hamburgerBtn" class="hamburger-btn" onclick="toggleSideMenu()"><span></span><span></span><span></span></button>` 
        : `<button class="btn text-white p-0 me-3" style="font-size: 1.5rem; line-height: 1;" onclick="window.location.href='index.html'">←</button>`;

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
                <button id="themeToggle" class="nav-btn border-0 bg-transparent">🌙</button>
            </div>
        </div>
    </nav>`;

    const globalsHTML = `
    <!-- PROFIL MENÜ TÖRZS-SZÁMMAL -->
    <div class="side-overlay" id="sideOverlay" onclick="closeSideMenu()"></div>
    <div class="side-menu" id="sideMenu">
        <h5 class="fw-bold mb-4 text-primary d-flex align-items-center gap-2">👤 Profil adatok</h5>
        
        <div class="mb-3">
            <label class="form-label small fw-bold">Név *</label>
            <input type="text" id="profileName" class="form-control" placeholder="Pl. Kiss János">
        </div>
        
        <div class="mb-4">
            <label class="form-label small fw-bold">Törzsszám / Azonosító *</label>
            <input type="text" id="profileEmpId" class="form-control" placeholder="Pl. 10482">
        </div>

        <hr class="my-3" style="border-color: var(--bord);">
        <h6 class="text-primary mb-3 fw-bold d-flex align-items-center gap-2">⚙️ Beállítások</h6>
        
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-2" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Hangjelzés</div><div class="text-muted" style="font-size: 0.7rem;">Csippanás</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingAudio"></div>
        </div>
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-2" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Képernyő villanás</div><div class="text-muted" style="font-size: 0.7rem;">Vizuális effekt</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingFlash"></div>
        </div>
        <div class="d-flex justify-content-between align-items-center p-2 rounded mb-4" style="background: var(--sur); border: 1px solid var(--bord);">
            <div><div class="fw-bold small">Ébrentartás</div><div class="text-muted" style="font-size: 0.7rem;">Kijelző maradjon bekapcsolva</div></div>
            <div class="form-check form-switch fs-5 mb-0"><input class="form-check-input" type="checkbox" role="switch" id="settingWakeLock"></div>
        </div>
        
        <div class="mt-4 pb-5"><button class="btn btn-primary w-100 btn-lg" onclick="saveProfile()">Mentés & Bezárás</button></div>
    </div>

    <div class="toast-container"><div id="liveToast" class="toast align-items-center text-white bg-dark border-0" role="alert"><div class="d-flex"><div class="toast-body" id="toastMsg"></div></div></div></div>`;

    if (!document.querySelector('.navbar')) document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    if (!document.getElementById('sideMenu')) document.body.insertAdjacentHTML('beforeend', globalsHTML);
};

injectSharedUI();

// Visszajelzések (Hang, Flash, Toast)
export const playFeedback = (type = 'light') => {
    if (localStorage.getItem('settingFlash') !== 'false') {
        const overlay = document.getElementById('flashOverlay');
        if (overlay) {
            overlay.className = ''; void overlay.offsetWidth;
            overlay.classList.add(type === 'success' ? 'flash-active-success' : type === 'error' ? 'flash-active-error' : 'flash-active-light');
            setTimeout(() => overlay.className = '', 50);
        }
    }
};

export const showToast = (m) => {
    const msgEl = document.getElementById('toastMsg'); 
    const toastEl = document.getElementById('liveToast');
    if (msgEl && toastEl) { msgEl.textContent = m; new bootstrap.Toast(toastEl).show(); }
};

window.playFeedback = playFeedback;
window.showToast = showToast;

// Téma váltó
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    if ((localStorage.getItem('theme') || 'light') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
    });
}

// Side Menu Kezelés
window.toggleSideMenu = () => {
    playFeedback('light');
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('sideOverlay');
    if (!menu || !overlay) return;
    
    const isOpen = menu.classList.contains('open');
    if (!isOpen) {
        menu.classList.add('open'); overlay.classList.add('open');
        document.getElementById('profileName').value = localStorage.getItem('userName') || '';
        document.getElementById('profileEmpId').value = localStorage.getItem('userEmpId') || '';
        document.getElementById('settingAudio').checked = localStorage.getItem('settingAudio') !== 'false';
        document.getElementById('settingFlash').checked = localStorage.getItem('settingFlash') !== 'false';
        document.getElementById('settingWakeLock').checked = localStorage.getItem('settingWakeLock') === 'true';
    } else {
        menu.classList.remove('open'); overlay.classList.remove('open');
    }
};

window.closeSideMenu = () => {
    document.getElementById('sideMenu')?.classList.remove('open');
    document.getElementById('sideOverlay')?.classList.remove('open');
};
