import { playFeedback, showToast } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mesUser')) {
        document.getElementById('mesUser').value = localStorage.getItem('mesData_user') || '';
        document.getElementById('mesPass').value = localStorage.getItem('mesData_pass') || '';
    }
});

window.saveMesData = () => {
    const u = document.getElementById('mesUser').value.trim();
    const p = document.getElementById('mesPass').value.trim();
    if(!u || !p) return showToast("Minden mezőt ki kell tölteni!");
    
    localStorage.setItem('mesData_user', u);
    localStorage.setItem('mesData_pass', p);
    playFeedback('success'); showToast("Adatok elmentve az eszközre! 🔒");
};

window.generateMesQr = () => {
    const u = document.getElementById('mesUser').value.trim();
    const p = document.getElementById('mesPass').value.trim();
    if(!u || !p) return showToast("Kérlek töltsd ki az adatokat!");

    playFeedback('success');
    const qrOutput = document.getElementById('mesQrOutput');
    qrOutput.innerHTML = '';
    
    // Felhasználónév + TAB (\t) + Jelszó + ENTER (\r)
    new QRCode(qrOutput, { text: `${u}\t${p}\r`, width: 218, height: 218 });
    document.getElementById('mesQrContainer').classList.remove('hidden');
};
