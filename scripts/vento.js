import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const historicoRef = ref(database, 'historico');
const tempoRealRef = ref(database, 'estacao');
const valorDestaque = document.getElementById('valor-atual-destaque');
const metaEl = document.getElementById('chart-meta');

const ctx = document.getElementById('graficoCanvas').getContext('2d');

let datahorasCompletas = [];

const meuGrafico = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Velocidade do Vento (km/h)',
            data: [],
            borderColor: '#00E5FF',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            borderWidth: 3,
            pointBackgroundColor: '#1a2430',
            pointBorderColor: '#00E5FF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ba6b5' } },
            x: { grid: { display: false }, ticks: { color: '#9ba6b5', maxTicksLimit: 10, autoSkip: true } }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#233142',
                borderColor: '#3c4c60',
                borderWidth: 1,
                padding: 12,
                titleColor: '#00E5FF',
                bodyColor: '#ffffff',
                callbacks: {
                    title: (items) => datahorasCompletas[items[0].dataIndex] || '',
                    label: (item) => `Vento: ${item.formattedValue} km/h`
                }
            }
        }
    }
});

// 1. Escuta o HISTÓRICO para montar a linha do gráfico (só o dia mais recente)
onValue(historicoRef, (snapshot) => {
    const dadosHistorico = snapshot.val();
    if (!dadosHistorico) return;

    const leituras = Object.values(dadosHistorico)
        .map((l) => {
            const valVento = l.vento ?? l.velocidade ?? l.vel_vento;
            if (valVento === undefined || valVento === null || !l.datahora) return null;
            const [dataParte, horaParte] = l.datahora.split(' ');
            return {
                data: dataParte,
                hora: (horaParte || '').substring(0, 5),
                valor: parseFloat(valVento),
                datahora: l.datahora
            };
        })
        .filter(Boolean);

    if (leituras.length === 0) return;

    const dataMaisRecente = leituras[leituras.length - 1].data;
    const leiturasDoDia = leituras.filter((l) => l.data === dataMaisRecente);

    const labels = leiturasDoDia.map((l) => l.hora);
    const valores = leiturasDoDia.map((l) => l.valor.toFixed(1));
    datahorasCompletas = leiturasDoDia.map((l) => `${l.data} às ${l.hora}`);

    meuGrafico.data.labels = labels;
    meuGrafico.data.datasets[0].data = valores;
    meuGrafico.update();

    if (metaEl) {
        const [dia, mes, ano] = dataMaisRecente.split('-');
        metaEl.innerText = `📅 Dados de ${dia}/${mes}/${ano} · Atualiza automaticamente sempre que a estação envia um novo dado (o intervalo entre leituras pode variar)`;
    }
});

// 2. Escuta o valor em tempo real do painel de monitoramento pro número no topo
onValue(tempoRealRef, (snapshot) => {
    const dados = snapshot.val();
    if (dados) {
        const ventoAtual = dados.vento ?? dados.velocidade ?? dados.vel_vento;
        if (ventoAtual !== undefined && valorDestaque) {
            valorDestaque.innerText = parseFloat(ventoAtual).toFixed(1);
        }
    }
});