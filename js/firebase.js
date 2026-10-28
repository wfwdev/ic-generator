import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsthGIMXvc-pFXfc63tGEclGg5V6qCT0s",
    authDomain: "ic-generator-93915.firebaseapp.com",
    projectId: "ic-generator-93915",
    storageBucket: "ic-generator-93915.firebasestorage.app",
    messagingSenderId: "571045375663",
    appId: "1:571045375663:web:591a7f51b5921dac90ae5a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => console.warn("Offline mód korlátozott"));

export { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs };
