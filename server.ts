import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Service Logic moved to Server
  const getAiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    return new GoogleGenAI({ apiKey: key });
  };

  app.post("/api/analyze", async (req, res) => {
    try {
      const { beforeImage, afterImage, category, area, checklist, modelId } = req.body;
      
      const ai = getAiClient();

      const prompt = `
        당신은 기업 운영 및 직원 업무 성과 분석 전문 AI입니다. 
        업무 수행 전(기준 상태, 좌측)과 수행 후(결과 상태, 우측) 사진을 비교하여 **최대한 객관적이고 명확한** 성과 분석 리포트를 작성하세요.
        **모든 응답은 반드시 한국어로 작성해야 합니다.**
        
        카테고리: ${category}
        구역: ${area}
        체크리스트 준수 사항: ${checklist.join(', ')}

        응답은 다음 JSON 형식을 엄격히 지키세요:
        {
          "score": 0~100 (업무 준수도를 바탕으로 한 성과 점수),
          "feedback": "한 문장으로 요약된 운영 표준 준수 피드백 (한국어)",
          "improvements": ["업무 품질 향상을 위한 핵심 제언 1개 (한국어)"],
          "risks": ["표준 미준수나 잠재적 운영 리스크 1개 (없으면 빈 리스트) (한국어)"]
        }
      `;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: beforeImage.split(',')[1] } },
              { inlineData: { mimeType: "image/jpeg", data: afterImage.split(',')[1] } },
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Server AI Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "AI Analysis failed" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
