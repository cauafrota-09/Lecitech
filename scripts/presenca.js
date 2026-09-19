import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, remove, onDisconnect, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq0D0kz59B3nkMMyIwW5SeHG01_wJPTcM",
    authDomain: "lecitech-78671.firebaseapp.com",
    databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com",
    projectId: "lecitech-78671",
    storageBucket: "lecitech-78671.firebasestorage.app",
    messagingSenderId: "693126140232",
    appId: "1:693126140232:web:943dfc132719f9904ba37d"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

// ---------------------------------------------------------
// ID FIXO POR ABA: gerado uma vez e guardado no sessionStorage.
// Isso garante que navegar entre páginas do site (Monitoramento,
// Dashboard, Temperatura, etc.) NÃO cria um novo registro a cada
// clique — todas as páginas da MESMA aba reutilizam o mesmo ID.
// Um novo ID só é criado se você abrir uma aba/janela nova.
// ---------------------------------------------------------
let meuId = sessionStorage.getItem('lecitech_presence_id');
if (!meuId) {
    meuId = 'visitante-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('lecitech_presence_id', meuId);
}

const presenceListRef = ref(database, 'presence');
const myPresenceRef = ref(database, 'presence/' + meuId);
const connectedRef = ref(database, '.info/connected');

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        // Remove automaticamente quando a aba realmente fechar / cair a conexão
        onDisconnect(myPresenceRef).remove();
        // Marca presença (isso também "renova" o registro a cada página visitada)
        set(myPresenceRef, { ultimaPagina: window.location.pathname, atualizadoEm: serverTimestamp() });
    }
});

// Escuta a lista de presença inteira e atualiza o número na tela
onValue(presenceListRef, (snapshot) => {
    const total = snapshot.size;
    const elemento = document.getElementById('online-count');
    if (elemento) {
        elemento.innerText = `ON:${total}`;
    }
});