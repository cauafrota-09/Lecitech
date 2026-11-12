
import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ==========================================
// FIREBASE
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDq0Dkz59B3nkMMyIwW5SeHG01_wJPTcM",
    authDomain: "lecitech-78671.firebaseapp.com",
    databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com",
    projectId: "lecitech-78671",
    storageBucket: "lecitech-78671.firebasestorage.app",
    messagingSenderId: "693126140232",
    appId: "1:693126140232:web:943dfc132719f9904ba37d"
};

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const database = getDatabase(app);

// ==========================================
// REFERÊNCIAS
// ==========================================

const historicoRef = ref(database, "historico");
const chuvaAtualRef = ref(database, "estacao/chuva");

const valorDestaque = document.getElementById(
    "valor-atual-destaque"
);

const metaEl = document.getElementById("chart-meta");

const canvas = document.getElementById("graficoCanvas");

if (!canvas) {
    throw new Error("Canvas do gráfico não encontrado.");
}

if (typeof Chart === "undefined") {
    throw new Error("Biblioteca Chart.js não foi carregada.");
}

// ==========================================
// CONFIGURAÇÃO DO GRÁFICO
// ==========================================

let datahorasCompletas = [];

const ctx = canvas.getContext("2d");

const meuGrafico = new Chart(ctx, {

    type: "line",

    data: {
        labels: [],

        datasets: [{

            label: "Precipitação (mm)",

            data: [],

            borderColor: "#4FC3F7",

            backgroundColor: "rgba(79, 195, 247, 0.08)",

            borderWidth: 3,

            pointBackgroundColor: "#1a2430",

            pointBorderColor: "#4FC3F7",

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

        interaction: {
            mode: "nearest",
            intersect: false
        },

        // EIXOS
        scales: {

            y: {

                grid: {
                    color: "rgba(255, 255, 255, 0.05)"
                },

                ticks: {
                    color: "#9ba6b5"
                }

            },

            x: {

                grid: {
                    display: false
                },

                ticks: {
                    color: "#9ba6b5",
                    maxTicksLimit: 10,
                    autoSkip: true
                }

            }

        },

        // INFORMAÇÕES DO GRÁFICO
        plugins: {

            legend: {
                display: false
            },

            tooltip: {

                backgroundColor: "#233142",

                borderColor: "#3c4c60",

                borderWidth: 1,

                padding: 12,

                titleColor: "#4FC3F7",

                bodyColor: "#ffffff",

                callbacks: {

                    title: (items) => {
                        return datahorasCompletas[
                            items[0].dataIndex
                        ] || "";
                    },

                    label: (item) => {
                        return `Precipitação: ${item.formattedValue} mm`;
                    }

                }

            }

        }

    }

});

// ==========================================
// HISTÓRICO DE PRECIPITAÇÃO
// ==========================================

onValue(historicoRef, (snapshot) => {

    const dadosHistorico = snapshot.val();

    if (!dadosHistorico) {
        return;
    }

    // Ordena os registros pelas chaves do Firebase
    const leituras = Object.entries(dadosHistorico)

        .sort(([chaveA], [chaveB]) =>
            chaveA.localeCompare(chaveB)
        )

        .map(([chave, leitura]) => {

            if (
                leitura.chuva === undefined ||
                !leitura.datahora
            ) {
                return null;
            }

            const valor = Number(leitura.chuva);

            if (!Number.isFinite(valor)) {
                return null;
            }

            const partes = leitura.datahora.split(" ");

            const data = partes[0];
            const hora = (partes[1] || "").substring(0, 5);

            return {
                chave,
                data,
                hora,
                valor,
                datahora: leitura.datahora
            };

        })

        .filter(Boolean);

    if (leituras.length === 0) {
        return;
    }

    // Identifica o dia mais recente
    const dataMaisRecente =
        leituras[leituras.length - 1].data;

    // Seleciona somente as leituras desse dia
    const leiturasDoDia = leituras.filter(
        leitura => leitura.data === dataMaisRecente
    );

    // Monta os dados
    const labels = leiturasDoDia.map(
        leitura => leitura.hora
    );

    const valores = leiturasDoDia.map(
        leitura => leitura.valor
    );

    datahorasCompletas = leiturasDoDia.map(
        leitura => `${leitura.data} às ${leitura.hora}`
    );

    // Atualiza o gráfico sem recriá-lo
    meuGrafico.data.labels = labels;

    meuGrafico.data.datasets[0].data = valores;

    meuGrafico.update("none");

    // Atualiza a data exibida
    if (metaEl) {

        const [dia, mes, ano] = dataMaisRecente.split("-");

        metaEl.innerHTML =
            `<i class="fa-solid fa-calendar-days"></i>
            Dados de ${dia}/${mes}/${ano} ·
            Atualiza automaticamente sempre que a estação envia um novo dado
            (o intervalo entre leituras pode variar)`;

    }

});

// ==========================================
// VALOR ATUAL DA PRECIPITAÇÃO
// ==========================================

onValue(chuvaAtualRef, (snapshot) => {

    const valor = snapshot.val();

    if (valorDestaque) {

        valorDestaque.innerText =
            valor !== null &&
            valor !== undefined &&
            Number.isFinite(Number(valor))
                ? Number(valor).toFixed(1)
                : "--";

    }

});

console.log("Gráfico de precipitação iniciado com sucesso.");

