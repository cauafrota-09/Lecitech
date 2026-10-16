import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ---------------------------------------------------------
// FIREBASE
// ---------------------------------------------------------
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

// Coordenadas da EETI Professora Lecita Fonseca Ramos - Monte das Oliveiras, Manaus/AM
const LAT_ESCOLA = -3.0038926;
const LNG_ESCOLA = -60.0068031;
const RAIO_METROS = 500;

// ---------------------------------------------------------
// MAPA (Leaflet + OpenStreetMap, sem necessidade de chave)
// ---------------------------------------------------------
const mapa = L.map('mapa', { scrollWheelZoom: false }).setView([LAT_ESCOLA, LNG_ESCOLA], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(mapa);

L.marker([LAT_ESCOLA, LNG_ESCOLA])
    .addTo(mapa)
    .bindPopup('<b>Estação Lecitech</b><br>EETI Prof.ª Lecita Fonseca Ramos');

L.circle([LAT_ESCOLA, LNG_ESCOLA], {
    radius: RAIO_METROS,
    color: '#00E5FF',
    weight: 2,
    fillColor: '#00E5FF',
    fillOpacity: 0.12
}).addTo(mapa);

// ---------------------------------------------------------
// CHANCE DE CHUVA + MENSAGENS PROGRAMADAS (sem IA)
// Regra principal: 0 mm de precipitação = 0% de chance de chuva.
// ---------------------------------------------------------
function calcularChuva(mm, umidade) {
    const v = isNaN(mm) ? null : mm;

    if (v === null) {
        return { pct: null, texto: 'Aguardando a leitura do sensor de chuva...' };
    }

    if (v === 0) {
        let texto = 'Sem chuva registrada pela estação neste momento.';
        if (!isNaN(umidade) && umidade >= 85) {
            texto += ' A umidade do ar está alta, mas o sensor não detectou precipitação.';
        }
        return { pct: 0, texto };
    }
    if (v < 0.5) return { pct: 20,  texto: 'Chuvisco fraco detectado pela estação. A chance de a chuva continuar é baixa.' };
    if (v < 2.5) return { pct: 40,  texto: 'Chuva fraca em andamento na região da estação.' };
    if (v < 7.6) return { pct: 60,  texto: 'Chuva moderada em andamento. Fique atento.' };
    if (v < 25)  return { pct: 80,  texto: 'Chuva forte em andamento. Evite áreas sujeitas a alagamento.' };
    return         { pct: 100, texto: 'Chuva muito forte! Procure abrigo e evite se deslocar.' };
}

// ---------------------------------------------------------
// DADOS ATUAIS
// ---------------------------------------------------------
const elChuva = document.getElementById('mapa-chuva');
const elUmidade = document.getElementById('mapa-umidade');
const elPressao = document.getElementById('mapa-pressao');
const elVento = document.getElementById('mapa-vento');
const elChance = document.getElementById('mapa-chance');
const elTextoClima = document.getElementById('texto-clima');

const estacaoRef = ref(database, 'estacao');
onValue(estacaoRef, (snapshot) => {
    const dados = snapshot.val();
    if (!dados) return;

    const chuva = parseFloat(dados.chuva);
    const umidade = parseFloat(dados.umidade);
    const pressao = parseFloat(dados.pressao);
    const vento = parseFloat(dados.vento ?? dados.velocidade ?? dados.vel_vento);

    if (elChuva) elChuva.innerText = isNaN(chuva) ? '--' : chuva.toFixed(1);
    if (elUmidade) elUmidade.innerText = isNaN(umidade) ? '--' : umidade.toFixed(1);
    if (elPressao) elPressao.innerText = isNaN(pressao) ? '--' : pressao.toFixed(1);
    if (elVento) elVento.innerText = isNaN(vento) ? '--' : vento.toFixed(1);

    const { pct, texto } = calcularChuva(chuva, umidade);
    if (elChance) elChance.innerText = pct === null ? '--%' : pct + '%';
    if (elTextoClima) elTextoClima.innerText = texto;
});