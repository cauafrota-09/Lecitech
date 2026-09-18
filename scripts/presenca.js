import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onDisconnect, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq0D0kz59B3nkMMyIwW5SeHG01_wJPTcM",
    authDomain: "lecitech-78671.firebaseapp.com",
    databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com",
    projectId: "lecitech-78671",
    storageBucket: "lecitech-78671.firebasestorage.app",
    messagingSenderId: "693126140232",
    appId: "1:693126140232:web:943dfc132719f9904ba37d"
};

// getApps()/getApp() evita erro se a página já inicializou o Firebase em outro script
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

const presenceListRef = ref(database, 'presence');
const myPresenceRef = push(presenceListRef);
const connectedRef = ref(database, '.info/connected');

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        onDisconnect(myPresenceRef).remove();
        set(myPresenceRef, { conectadoEm: serverTimestamp() });
    }
});

onValue(presenceListRef, (snapshot) => {
    const total = snapshot.size;
    const elemento = document.getElementById('online-count');
    if (elemento) {
        elemento.innerText = `ON:${total}`;
    }
});