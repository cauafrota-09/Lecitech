const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const API_KEY = "AQ.Ab8RN6Lhz1QBZ6dWlGgwWRFe2VmGrvojAXJ6besSaksjhTomOw";

app.post('/api/chat', async (req, res) => {
  try {
    const { mensagem } = req.body;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Você é o assistente virtual da estação meteorológica LECITECH. Responda de forma sucinta.\n\nPergunta: ${mensagem}` }] }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor do LECITECH rodando na porta 3000 🚀');
});