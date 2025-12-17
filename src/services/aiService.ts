import type { ProviderType } from "../contexts/AiContext";

export async function generateActions(
  transcript: string,
  provider: ProviderType,
  apiKey: string,
  model: string
): Promise<string[]> {
  const systemPrompt = `You are a helpful AI assistant. The user has just spoken the following text: "${transcript}". 
  Based on this, suggest exactly 4 distinct, short, and relevant follow-up actions or questions the user might want to ask or do next. 
  Return ONLY a raw JSON array of strings, for example: ["Action 1", "Action 2", "Action 3", "Action 4"]. 
  Do not include markdown formatting like markdown code blocks.`;

  try {
    if (provider === "Google") {
      return await callGemini(apiKey, model, systemPrompt);
    } else if (provider === "OpenAI") {
      return await callOpenAI(apiKey, model, systemPrompt);
    } else if (provider === "OpenRouter") {
        return await callOpenRouter(apiKey, model, systemPrompt);
    }
    return [];
  } catch (error) {
    console.error("Error generating actions:", error);
    return ["Tell me more", "Explain this", "Summarize", "Related topics"]; // Fallbacks
  }
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseActions(text);
}

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  return parseActions(text);
}

async function callOpenRouter(apiKey: string, model: string, prompt: string): Promise<string[]> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://primer.ai", // Required by OpenRouter
        "X-Title": "Primer AI"
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });
  
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
  
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    return parseActions(text);
  }

function parseActions(text: string): string[] {
  if (!text) return [];
  try {
    // Clean up potential markdown code blocks
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 4) {
      return parsed.slice(0, 4);
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse actions JSON:", text);
    // Fallback parsing if JSON fails (e.g. newline separated)
    return text.split("\n").filter(line => line.trim().length > 0).map(l => l.replace(/^\d+\.\s*/, '').trim()).slice(0, 4);
  }
}

export async function transcribeAudio(base64Audio: string, apiKey: string): Promise<string> {
  // Convert base64 to Blob
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/wav" });
  const file = new File([blob], "audio.wav", { type: "audio/wav" });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");
  formData.append("language", "pt"); // Force Portuguese or auto-detect

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API Error: ${response.statusText} - ${err}`);
  }

  const data = await response.json();
  return data.text;
}
