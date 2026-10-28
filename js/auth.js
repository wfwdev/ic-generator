import { db, doc, setDoc } from './firebase.js';
import { playFeedback, showToast } from './ui.js';

if (!localStorage.getItem('anon_user_id')) {
    localStorage.setItem('anon_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}

// === 1. KŐKEMÉNY BIZTONSÁG: A TE EGYEDI AZONOSÍTÓD ===
// Ide írd be azt az ID-t, amit az F12 Konzolból kimásoltál! (pl. 'user_a1b2c3d4e')
const MASTER_ADMIN_ID = 'user_1swx210zk';

let savedRole = localStorage.getItem('userRole');
if (!savedRole) {
    savedRole = 'operator'; // Alapértelmezetten minden új belépő szigorúan operátor
    localStorage.setItem('userRole', savedRole);
}

window.currentUser = {
    id: localStorage.getItem('anon_user_id'),
    name: localStorage.getItem('userName') || '',
    empId: localStorage.getItem('userEmpId') || '',
    role: savedRole
};

// Ha az adott eszköz ID-je megegyezik a Mester Admin ID-vel, azonnal felülírja a rangot!
if (window.currentUser.id === MASTER_ADMIN_ID) {
    window.currentUser.role = 'admin';
    localStorage.setItem('userRole', 'admin');
}

window.PAGE_PERMISSIONS = {
    'index.html': ['operator', 'leader', 'admin'],
    '': ['operator', 'leader', 'admin'],
    'ic-generator.html': ['operator', 'leader', 'admin'],
    'mes-terminal.html': ['operator', 'leader', 'admin'],
    'admin.html': ['admin']
};

export const checkPageAccess = () => {
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

window.saveProfile = async () => {
    const name = document.getElementById('profileName').value.trim();
    const empId = document.getElementById('profileEmpId').value.trim();

    if (!name || !empId) { 
        playFeedback('error'); 
        return showToast("A név és a törzsszám megadása is kötelező!"); 
    }
    
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmpId', empId);
    window.currentUser.name = name;
    window.currentUser.empId = empId;

    // Mester Admin másodlagos ellenőrzés mentéskor is
    if (window.currentUser.id === MASTER_ADMIN_ID) {
        window.currentUser.role = 'admin';
        localStorage.setItem('userRole', 'admin');
    }

    try {
        await setDoc(doc(db, 'users', window.currentUser.id), {
            name: name,
            empId: empId,
            role: window.currentUser.role,
            lastActive: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error("Firestore profil hiba:", e);
    }

    playFeedback('success'); 
    showToast("Profil elmentve! ✓");
    window.closeSideMenu();
    
    // Ha Admin vagy, és a mentés megtörtént, azonnal frissít, hogy mindent elérj
    if (window.currentUser.id === MASTER_ADMIN_ID) {
        setTimeout(() => window.location.reload(), 800);
    }
};

checkPageAccess();
