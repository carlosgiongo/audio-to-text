require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const app = express();
const port = 3035; 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.use(express.json());

app.post("/extract-text", async (req, res) => {
  const fileUrl = req.body.url;
  const fileBase64 = req.body.base64;
  const auth = req.headers["authorization"];

  if(auth !== process.env.AUTHORIZATION) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!fileUrl && !fileBase64) {
    return res.status(400).json({ error: "Missing 'url' or 'base64' in request body" });
  }

  try {
    let response;

    if (fileUrl) {
      response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    }

    if (fileBase64) {
      response = {
        data: Buffer.from(fileBase64, "base64"),
        headers: { "content-type": "audio/mpeg" },
      };
    }

    const audioData = Buffer.from(response.data, "binary");
    const mimeType = response.headers["content-type"];

    const audio = {
      inlineData: {
        data: audioData.toString("base64"),
        mimeType: mimeType,
      },
    };
    const prompt = "Extract text from this audio. This audio is in Portuguese.";

    const result = await model.generateContent([audio, prompt]);
    res.json({ content: result.response.text() });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to extract text" });
  }
});

app.listen(port, () => {
  console.log(`[Audio to Text] Rodando na porta ${port}`);
});