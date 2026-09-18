import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const valorDestaque = document.getElementById('valor-atual-destaque');
const ctx = document.getElementById('graficoCanvas').getContext('2d');

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
            pointRadius: 3,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ba6b5' } },
            x: { grid: { display: false }, ticks: { color: '#9ba6b5', maxTicksLimit: 12 } }
        },
        plugins: { legend: { display: false } }
    }
});

// Histórico para o gráfico
const historicoRef = ref(database, 'historico');
onValue(historicoRef, (snapshot) => {
    const dadosHistorico = snapshot.val();
    if (dadosHistorico) {
        const listaLabels = [];
        const listaValores = [];

        Object.keys(dadosHistorico).forEach(idUnico => {
            const leitura = dadosHistorico[idUnico];
            const valVento = leitura.vento ?? leitura.velocidade ?? leitura.vel_vento;

            if (valVento !== undefined && valVento !== null && leitura.datahora) {
                const valor = parseFloat(valVento);
                const partes = leitura.datahora.split(' ');
                const dia = partes[0] ? partes[0].split('-')[0] : '';
                const horaMinuto = partes[1] ? partes[1].substring(0, 5) : '';
                listaLabels.push(`${dia} às ${horaMinuto}`);
                listaValores.push(valor.toFixed(1));
            }
        });

        meuGrafico.data.labels = listaLabels.slice(-60);
        meuGrafico.data.datasets[0].data = listaValores.slice(-60);
        meuGrafico.update();
    }
});

// Valor atual em tempo real
const tempoRealRef = ref(database, 'estacao');
onValue(tempoRealRef, (snapshot) => {
    const dados = snapshot.val();
    if (dados) {
        const ventoAtual = dados.vento ?? dados.velocidade ?? dados.vel_vento;
        if (ventoAtual !== undefined && valorDestaque) {
            valorDestaque.innerText = parseFloat(ventoAtual).toFixed(1);
        }
    }
});