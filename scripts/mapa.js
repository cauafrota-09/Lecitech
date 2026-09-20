import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ⚠️ COLE AQUI A MESMA API KEY DO GEMINI USADA NO ia-assistente.js
const GEMINI_API_KEY = "COLE_SUA_CHAVE_AQUI";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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
// DADOS ATUAIS + TEXTO DA IA
// ---------------------------------------------------------
const elChuva = document.getElementById('mapa-chuva');
const elUmidade = document.getElementById('mapa-umidade');
const elPressao = document.getElementById('mapa-pressao');
const elVento = document.getElementById('mapa-vento');
const elTextoIA = document.getElementById('texto-ia-clima');

let ultimaChaveGerada = null; // evita gerar o texto de novo toda hora sem necessidade

const estacaoRef = ref(database, 'estacao');
onValue(estacaoRef, async (snapshot) => {
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

    // Só chama a IA de novo se os valores mudaram desde a última vez
    const chaveAtual = `${chuva}-${umidade}-${pressao}-${vento}`;
    if (chaveAtual === ultimaChaveGerada) return;
    ultimaChaveGerada = chaveAtual;

    await gerarLeituraIA({ chuva, umidade, pressao, vento });
});

async function gerarLeituraIA({ chuva, umidade, pressao, vento }) {
    if (!elTextoIA) return;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "COLE_SUA_CHAVE_AQUI") {
        elTextoIA.innerHTML = 'Configure a API key do Gemini em <code>scripts/mapa.js</code> para ativar essa leitura.';
        return;
    }

    elTextoIA.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analisando os dados atuais...';

    const contexto = `
[DADOS ATUAIS DA ESTAÇÃO LECITECH - Monte das Oliveiras, Manaus/AM]
- Precipitação (chuva): ${isNaN(chuva) ? 'sem leitura' : chuva.toFixed(1) + ' mm'}
- Umidade do ar: ${isNaN(umidade) ? 'sem leitura' : umidade.toFixed(1) + ' %'}
- Pressão atmosférica: ${isNaN(pressao) ? 'sem leitura' : pressao.toFixed(1) + ' hPa'}
- Velocidade do vento: ${isNaN(vento) ? 'sem leitura' : vento.toFixed(1) + ' km/h'}
    `;

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: "Você é um professor de geografia especializado em climatologia, explicando para " +
                              "estudantes e visitantes de uma feira de robótica escolar (projeto Lecitech) a " +
                              "tendência de chuva na região com base nos dados atuais de uma estação " +
                              "microclimática (representativa só de uns 500 metros ao redor dela, não da cidade " +
                              "toda). Analise principalmente pressão atmosférica, umidade e chuva atual para " +
                              "estimar se a tendência é de chuva se aproximando, se afastando, ou tempo estável. " +
                              "Seja breve (2 a 3 frases), didático, e deixe claro que é uma leitura educativa " +
                              "baseada no instante atual, não uma previsão oficial. Nunca dê datas exatas futuras " +
                              "(tipo 'vai chover dia 15') — fale em termos de tendência (curto prazo, próximas horas)."
                    }]
                },
                contents: [{
                    role: "user",
                    parts: [{ text: `${contexto}\n\nExplique a tendência climática atual, com foco na chuva.` }]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
        }

        const textoIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui gerar uma leitura agora.";
        elTextoIA.innerText = textoIA;
    } catch (erro) {
        console.error('Erro ao consultar a IA:', erro);
        elTextoIA.innerText = `Não foi possível gerar a leitura da IA agora (${erro.message}).`;
    }
}