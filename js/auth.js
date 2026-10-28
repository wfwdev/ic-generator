import { db, doc, setDoc } from './firebase.js';
import { playFeedback, showToast } from './ui.js';

if (!localStorage.getItem('anon_user_id')) {
    localStorage.setItem('anon_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}

let savedRole = localStorage.getItem('userRole');
if (!savedRole) {
    const savedName = localStorage.getItem('userName') || '';
    savedRole = (savedName.toLowerCase().includes('gábor') || savedName.toLowerCase().includes('kovács')) ? 'admin' : 'operator';
    localStorage.setItem('userRole', savedRole);
}

window.currentUser = {
    id: localStorage.getItem('anon_user_id'),
    name: localStorage.getItem('userName') || '',
    empId: localStorage.getItem('userEmpId') || '',
    role: savedRole
};

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
};

checkPageAccess();
