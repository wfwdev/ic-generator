import { db, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDocs } from './firebase.js';
import { playFeedback, showToast } from './ui.js';

let icDatabase = [], currentGenType = 'ESS', editIcId = null;

const formatIC = (raw) => {
    if (!raw) return ''; 
    const c = String(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (c.length !== 13) return c; 
    return `${c.slice(0,2)}.${c.slice(2,6)}-${c.slice(6,10)}.${c.slice(10,11)}.${c.slice(11,13)}`;
};

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

if (document.getElementById('tab-generator')) {
    onSnapshot(collection(db, 'ic_numbers'), (snap) => {
        icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if(document.getElementById('adminList')) renderAdminList();
        updateGenSelect();
    });
}

window.generateData = async () => {
    if (!localStorage.getItem('userName')) { playFeedback('error'); showToast("Előbb töltsd ki a profilt!"); return window.toggleSideMenu(); }
    const code = document.getElementById('genSelect').value;
    const amountStr = document.getElementById('genAmount').value;
    const amount = parseInt(amountStr);

    if (!code || !amountStr || amount <= 0 || amount > 5000) { playFeedback('error'); return showToast("Érvénytelen adatok!"); }

    playFeedback('success');
    const cleanIC = code.replace(/[^a-zA-Z0-9]/g, '');
    const paddedAmount = amountStr.padStart(7, '0');
    const r10 = Math.floor(Math.random() * 9e9 + 1e9).toString();
    const now = new Date();
    const qr1Text = `${cleanIC.toLowerCase()}@${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}@${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;

    document.getElementById('q1-large').innerHTML = ''; document.getElementById('q2-large').innerHTML = '';
    new QRCode(document.getElementById("q1-large"), { text: qr1Text, width: 250, height: 250 });
    new QRCode(document.getElementById("q2-large"), { text: `${cleanIC}${paddedAmount}${r10}`, width: 250, height: 250 });
    
    document.getElementById('q1-text').innerText = qr1Text;
    document.getElementById('q2-text').innerText = `${formatIC(cleanIC)}${paddedAmount}${r10}`;

    try {
        await addDoc(collection(db, 'logs'), {
            icCode: code, amount: amount, userId: window.currentUser.id, userName: window.currentUser.name, empId: window.currentUser.empId, timestamp: new Date().toISOString()
        });
    } catch (e) { console.error(e); }

    document.getElementById('qrFullscreen').classList.remove('hidden');
};

window.closeQr = () => { document.getElementById('qrFullscreen').classList.add('hidden'); };

window.loadStats = async () => {
    try {
        const snap = await getDocs(collection(db, 'logs'));
        let dayCount = 0, dayAmount = 0, allCount = 0;
        const today = new Date().toISOString().split('T')[0];

        snap.forEach(d => {
            const data = d.data();
            allCount++;
            if (data.timestamp && data.timestamp.startsWith(today)) {
                dayCount++; dayAmount += (data.amount || 0);
            }
        });

        if(document.getElementById('statDayCount')) {
            document.getElementById('statDayCount').innerText = dayCount;
            document.getElementById('statDayAmount').innerText = dayAmount.toLocaleString('hu-HU') + ' db';
            document.getElementById('statAllCount').innerText = allCount;
        }
    } catch (e) { showToast("Hiba a statisztikánál!"); }
};

const renderAdminList = () => {
    const list = document.getElementById('adminList');
    if (!list) return;
    list.innerHTML = icDatabase.map(ic => `<div class="list-group-item d-flex justify-content-between align-items-center"><div><span class="badge me-2 ${ic.type==='ESS'?'bg-primary':'bg-warning'}">${ic.type}</span><b>${formatIC(ic.code)}</b></div><button class="btn btn-sm btn-light" onclick="openIcModal('${ic.id}')">✏️</button></div>`).join('');
};

window.openIcModal = (id = null) => {
    editIcId = id; const ic = id ? icDatabase.find(x => x.id === id) : null;
    document.getElementById('imCode').value = ic?.code || ''; 
    document.getElementById('imType').value = ic?.type || 'ESS';
    document.getElementById('imDel').style.display = id ? 'block' : 'none'; 
    document.getElementById('icModal').classList.add('open');
};

window.saveIc = async () => {
    let code = document.getElementById('imCode').value.trim().toUpperCase().replace(/[^A-Z0-9]/gi, '');
    if (code.length !== 13) return showToast("Pontosan 13 karakter kell!");
    try {
        editIcId ? await updateDoc(doc(db, 'ic_numbers', editIcId), {code, type: document.getElementById('imType').value}) : await addDoc(collection(db, 'ic_numbers'), {code, type: document.getElementById('imType').value});
        document.getElementById('icModal').classList.remove('open'); showToast("Mentve!");
    } catch (e) { showToast("Hiba a mentéskor!"); }
};

window.deleteIc = async () => {
    if (confirm("Biztos törlöd?") && editIcId) { await deleteDoc(doc(db, 'ic_numbers', editIcId)); document.getElementById('icModal').classList.remove('open'); }
};
