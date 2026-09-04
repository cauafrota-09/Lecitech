// Função para abrir e fechar a janela do chat
function toggleChat() {
  const chatBox = document.getElementById("chat-box");
  if (chatBox) {
    chatBox.classList.toggle("ativo");
  }
}

// Função para enviar mensagem capturando dinamicamente os dados do painel da ESP32
async function enviarMensagemIA() {
  const inputEl = document.getElementById("chat-input");
  const messagesEl = document.getElementById("chat-messages");
  const textoUsuario = inputEl.value.trim();

  if (!textoUsuario) return;

  // Leitura dinâmica do painel (puxa o que a ESP32 atualizar na tela)
  const temperatura = document.querySelector(".card-temperatura")?.innerText || document.querySelector("#temperatura")?.innerText || "38.3 °C"; 
  const umidade = document.querySelector(".card-umidade")?.innerText || document.querySelector("#umidade")?.innerText || "37.2 %";
  const chuva = document.querySelector(".card-chuva")?.innerText || document.querySelector("#chuva")?.innerText || "0.0 mm";
  const vento = document.querySelector(".card-vento")?.innerText || document.querySelector("#vento")?.innerText || "18.8 km/h";
  const pressao = document.querySelector(".card-pressao")?.innerText || document.querySelector("#pressao")?.innerText || "1008.4 hPa";
  const co2 = document.querySelector(".card-co2")?.innerText || document.querySelector("#co2")?.innerText || "455 ppm";
  const amoniaVal = document.querySelector(".card-amonia")?.innerText || document.querySelector("#amonia")?.innerText || "56 ppm";
  const qualidade = document.querySelector(".card-qualidade")?.innerText || document.querySelector("#qualidade")?.innerText || "MODERADA";

  messagesEl.innerHTML += `
    <div class="msg user-msg">
      <b>Você:</b> ${textoUsuario}
    </div>
  `;

  inputEl.value = "";
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const loadingId = "loading-" + Date.now();
  messagesEl.innerHTML += `
    <div class="msg ia-msg" id="${loadingId}">
      <b>IA Lecitech:</b> Pensando<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  `;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const contextoDados = `
    [DADOS ATUAIS DA ESTAÇÃO ESP32]
    - Temperatura: ${temperatura}
    - Umidade: ${umidade}
    - Chuva: ${chuva}
    - Vento: ${vento}
    - Pressão: ${pressao}
    - CO2: ${co2}
    - Amônia: ${amoniaVal}
    - Qualidade do Ar: ${qualidade}
  `;

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        mensagem: `${contextoDados}\n\nPergunta do usuário: ${textoUsuario}` 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
    }

    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta.";

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = `<b>IA Lecitech:</b> ${respostaIA}`;
    }
  } catch (error) {
    console.error("Erro na comunicação com o servidor local:", error);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.className = "msg ia-msg error";
      loadingEl.innerHTML = `❌ Erro: ${error.message}`;
    }
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}