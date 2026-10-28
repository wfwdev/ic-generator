import { db, collection, getDocs, doc, updateDoc } from './firebase.js';
import { playFeedback, showToast } from './ui.js';

window.simulateRole = (role) => {
    localStorage.setItem('userRole', role);
    window.currentUser.role = role;
    playFeedback('success');
    showToast(`Új szerepkör: ${role.toUpperCase()}`);
    if (document.getElementById('currentLocalRoleDisplay')) document.getElementById('currentLocalRoleDisplay').textContent = role;
    if (role !== 'admin' && window.location.pathname.endsWith('admin.html')) setTimeout(() => window.location.href = 'index.html', 800);
};

window.loadAdminUsers = async () => {
    const listContainer = document.getElementById('userAdminList');
    if (!listContainer) return;

    try {
        const snap = await getDocs(collection(db, 'users'));
        if (snap.empty) return listContainer.innerHTML = '<div class="text-center text-muted small py-2">Még nincs regisztrált felhasználó.</div>';

        let html = '';
        snap.forEach((docSnap) => {
            const u = docSnap.data();
            const isMe = docSnap.id === window.currentUser.id;

            html += `
            <div class="d-flex justify-content-between align-items-center p-3 rounded mb-2" style="background: var(--sur); border: 1px solid var(--bord);">
                <div>
                    <div class="fw-bold" style="font-size: 0.95rem;">
                        ${u.name || 'Névtelen'} ${isMe ? '<span class="badge bg-primary ms-1">Én</span>' : ''}
                    </div>
                    <div class="text-muted" style="font-size: 0.75rem;">
                        Törzsszám: <b>${u.empId || 'Nincs megadva'}</b>
                    </div>
                </div>
                
                <select class="form-select form-select-sm" style="width: 130px;" onchange="updateUserRoleInDb('${docSnap.id}', this.value)">
                    <option value="operator" ${u.role === 'operator' ? 'selected' : ''}>Operátor</option>
                    <option value="leader" ${u.role === 'leader' ? 'selected' : ''}>Csoportvezető</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>`;
        });

        listContainer.innerHTML = html;
    } catch (e) { showToast("Hiba a felhasználók betöltésekor!"); }
};

window.updateUserRoleInDb = async (userId, newRole) => {
    try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        playFeedback('success'); showToast("Jogosultság frissítve! ✓");
        if (userId === window.currentUser.id) {
            localStorage.setItem('userRole', newRole);
            window.currentUser.role = newRole;
        }
    } catch (e) { showToast("Hiba a mentéskor!"); }
};

if (document.getElementById('userAdminList')) {
    window.loadAdminUsers();
}
