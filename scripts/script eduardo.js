import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDq0D0kz59B3nkMMyIwW5SeHG01_wJPTcM",
    authDomain: "lecitech-78671.firebaseapp.com",
    databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com",
    projectId: "lecitech-78671",
    storageBucket: "lecitech-78671.firebasestorage.app",
    messagingSenderId: "693126140232",
    appId: "1:693126140232:web:943dfc132719f9904ba37d"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Cria uma referência para a pasta 'estacao' no banco de dados
const estacaoRef = ref(database, 'estacao');

// O 'onValue' fica escutando o banco de dados em tempo real
onValue(estacaoRef, (snapshot) => {
    const dados = snapshot.val();

    if (dados) {
        // Pega os dados do banco e injeta nos IDs corretos do HTML
        // Usamos o .toFixed(1) para deixar apenas 1 casa decimal e ficar mais bonito
        document.getElementById('temp').innerText = parseFloat(dados.temperatura).toFixed(1);
        document.getElementById('umid').innerText = parseFloat(dados.umidade).toFixed(1);
        document.getElementById('chuva').innerText = parseFloat(dados.chuva).toFixed(1);
        document.getElementById('vento').innerText = parseFloat(dados.vento).toFixed(1);
        document.getElementById('pressao').innerText = parseFloat(dados.pressao).toFixed(1);
        
        // CO2 e NH3 geralmente são números inteiros
        document.getElementById('co2').innerText = parseInt(dados.co2);
        document.getElementById('nh3').innerText = parseInt(dados.nh3);
        
        // Textos
        document.getElementById('qualidade').innerText = dados.qualidadeAr;

        console.log("Dados atualizados com sucesso!");
    } else {
        console.log("Nenhum dado encontrado no nó 'estacao'.");
    }
}, (error) => {
    console.error("Erro ao ler os dados:", error);
});

// ---------------------------------------------------------
// RELÓGIO EM TEMPO REAL (Painel)
// ---------------------------------------------------------
const relogioElemento = document.getElementById('relogio-tempo-real');

function atualizarRelogio() {
    const agora = new Date();
    
    // O padStart(2, '0') garante que os números fiquem com 2 casas (ex: 09 em vez de 9)
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    
    relogioElemento.innerText = `${horas}:${minutos}:${segundos}`;
}

// Executa a função imediatamente ao carregar a página
atualizarRelogio();

// Atualiza o relógio a cada 1000 milissegundos (1 segundo)
setInterval(atualizarRelogio, 1000);