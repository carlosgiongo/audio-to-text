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

  if (!fileUrl) {
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  try {
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
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