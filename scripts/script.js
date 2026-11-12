
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ---------------------------------------------------------
// CONFIGURAÇÃO DO FIREBASE
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

// Inicialização
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Fuso horário oficial do projeto
const FUSO_HORARIO = "America/Manaus";

// ---------------------------------------------------------
// FUNÇÕES DE DATA E HORÁRIO
// ---------------------------------------------------------

// Formata o horário sempre no fuso de Manaus
function formatarHorario(data = new Date()) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: FUSO_HORARIO,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(data);
}

// Formata data e horário no fuso de Manaus
function formatarDataHora(data) {
    if (data === null || data === undefined || data === "") {
        return "--";
    }

    let dataConvertida;

    if (typeof data === "number") {
        // Aceita timestamp em segundos ou milissegundos
        dataConvertida = new Date(
            data < 100000000000 ? data * 1000 : data
        );
    } else if (typeof data === "string") {

        // Se já estiver no formato DD-MM-AAAA HH:mm:ss,
        // sem informação de fuso, não é possível converter
        // com segurança. Mantemos o valor original.
        const formatoLocal = /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}$/;

        if (formatoLocal.test(data)) {
            return data;
        }

        // ISO sem fuso: considera que o servidor gravou UTC.
        let valor = data;

        if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(valor)
        ) {
            valor += "Z";
        }

        dataConvertida = new Date(valor);
    } else {
        return "--";
    }

    if (isNaN(dataConvertida.getTime())) {
        return String(data);
    }

    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: FUSO_HORARIO,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(dataConvertida);
}

// ---------------------------------------------------------
// REFERÊNCIAS HTML
// ---------------------------------------------------------

function atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
    }
}

function formatarNumero(valor, casas = 1) {
    const numero = parseFloat(valor);

    return Number.isFinite(numero)
        ? numero.toFixed(casas)
        : "--";
}

// ---------------------------------------------------------
// DADOS DA ESTAÇÃO METEOROLÓGICA
// ---------------------------------------------------------

const estacaoRef = ref(database, "estacao");

onValue(estacaoRef, (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
        console.log("Nenhum dado encontrado na estação.");
        return;
    }

    atualizarElemento("temp", formatarNumero(dados.temperatura));
    atualizarElemento("umid", formatarNumero(dados.umidade));
    atualizarElemento("chuva", formatarNumero(dados.chuva));
    atualizarElemento("vento", formatarNumero(dados.vento));
    atualizarElemento("pressao", formatarNumero(dados.pressao));

    atualizarElemento("co2", formatarNumero(dados.co2, 0));
    atualizarElemento("nh3", formatarNumero(dados.nh3, 0));

    atualizarElemento("qualidade", dados.qualidadeAr ?? "--");

    console.log("Dados da estação atualizados com sucesso!");
}, (error) => {
    console.error("Erro ao ler os dados:", error);
});

// ---------------------------------------------------------
// ÚLTIMA ATUALIZAÇÃO
// ---------------------------------------------------------

const historicoRef = ref(database, "historico");

onValue(historicoRef, (snapshot) => {
    const dados = snapshot.val();

    if (!dados) {
        atualizarElemento(
            "ultima-atualizacao",
            "Última atualização: --"
        );
        return;
    }

    // Organiza os registros pela chave do Firebase
    const chaves = Object.keys(dados).sort();

    const ultimaChave = chaves[chaves.length - 1];
    const ultimaLeitura = dados[ultimaChave];

    if (ultimaLeitura && ultimaLeitura.datahora) {
        const horarioFormatado = formatarDataHora(
            ultimaLeitura.datahora
        );

        atualizarElemento(
            "ultima-atualizacao",
            `Última atualização: ${horarioFormatado}`
        );
    }
}, (error) => {
    console.error("Erro ao consultar histórico:", error);
});

// ---------------------------------------------------------
// RELÓGIO EM TEMPO REAL - HORÁRIO DE MANAUS
// ---------------------------------------------------------

function atualizarRelogio() {
    atualizarElemento(
        "relogio-tempo-real",
        formatarHorario()
    );
}

// Atualiza imediatamente
atualizarRelogio();

// Atualiza a cada segundo
setInterval(atualizarRelogio, 1000);

console.log("Sistema Lecitec iniciado com fuso horário de Manaus (UTC-4).");
