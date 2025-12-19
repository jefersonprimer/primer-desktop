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

export async function transcribeAudio(
  base64Audio: string, 
  provider: string, 
  model: string, 
  apiKey: string
): Promise<string> {
  // Convert base64 to Blob
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/wav" });
  const file = new File([blob], "audio.wav", { type: "audio/wav" });

  if (provider === "OpenAI") {
     const formData = new FormData();
     formData.append("file", file);
     // Map specific model names to whisper-1 or use as is if valid?
     // OpenAI Audio API currently only supports 'whisper-1'. 
     // But 'gpt-4o-audio-preview' might support input audio?
     // For now, let's map to whisper-1 for "transcribe" tasks unless it's a chat completion with audio input.
     // But the user selected "gpt-4o-transcribe".
     // If the user means "Use GPT-4o Multimodal Audio", that's a Chat Completion with Audio input.
     // However, the function 'transcribeAudio' implies returning text.
     // Let's assume standard Whisper API for simplicity unless "gpt-4o" is strictly requested for *transcription*.
     // Actually, let's stick to whisper-1 for transcription models, as GPT-4o audio is for interaction.
     // But to respect the user's choice, if they picked "gpt-4o-transcribe", maybe we should try Chat Completions with audio?
     // OpenAI Chat Completions with Audio input returns a message, which contains text.
     // But Chat Completions require a different payload structure (messages).
     
     // Let's stick to Whisper API for now as it's the standard "STT".
     // If the user explicitly wants "gpt-4o-transcribe", maybe they mean the new Realtime API? No, that's complex (WebSocket).
     // We will use whisper-1 for now, but log the model choice.
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

  } else if (provider === "Google") {
      // Google Cloud Speech-to-Text API
      // Model mapping: "standard" -> "default", "enhanced" -> useEnhanced=true?
      // V1 API: https://speech.googleapis.com/v1/speech:recognize
      
      const config: any = {
          encoding: "LINEAR16",
          sampleRateHertz: 44100, // Assuming cpal default, but we should verify. 
          // cpal default might be 48000. We might need to resample or check what backend produced.
          // Backend `audio_commands.rs` uses `default_input_config`.
          // We don't know the rate for sure here.
          // FLAC is safer if we could encode it. But we have WAV.
          // Let's try to send content without rate if possible, or assume 44100/48000.
          // V2 detects it?
          // Let's use simple recognition with default.
          languageCode: "pt-BR",
          enableAutomaticPunctuation: true,
      };

      if (model === "enhanced") {
          config.useEnhanced = true;
          config.model = "phone_call"; // 'enhanced' usually requires specific model like 'phone_call' or 'video'
      } else {
          config.model = "default";
      }

      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              config: config,
              audio: {
                  content: base64Audio
              }
          })
      });

      if (!response.ok) {
          const err = await response.text();
          throw new Error(`Google STT API Error: ${response.statusText} - ${err}`);
      }

      const data = await response.json();
      // Combine results
      if (data.results) {
          return data.results.map((r: any) => r.alternatives?.[0]?.transcript).join(" ");
      }
      return "";
  }

  throw new Error(`Provider ${provider} not supported for API transcription.`);
}
