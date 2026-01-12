use async_trait::async_trait;
use anyhow::{Result, anyhow};
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use serde::Deserialize;
use crate::domain::ai::provider::{
    AiProvider, ChatCompletionRequest, ChatMessage,
};
use crate::domain::ai::chat::repository::message_repository::MessageRepository;
use crate::domain::ai::chat::repository::chat_repository::ChatRepository;
use crate::domain::prompt_preset::repository::PromptPresetRepository;
use crate::domain::ai::chat::entity::message::Message;
use crate::domain::ai::chat::service::{
    chat_service::{ChatService, ChatServiceRequest, AIProviderType},
};
use crate::domain::user::repository::user_api_key_repository::UserApiKeyRepository;
use crate::domain::calendar::usecase::create_event::CreateEventUseCase;
use crate::domain::notion::usecase::create_page::CreatePageUseCase;

use crate::domain::config::repository::ConfigRepository;

#[derive(Deserialize)]
struct AiCalendarEvent {
    summary: String,
    description: Option<String>,
    start_time: String,
    end_time: String,
}

#[derive(Deserialize)]
struct NotionPageRequest {
    title: String,
    content: String,
    parent_id: Option<String>,
}

#[derive(Deserialize)]
struct AiResponse {
    answer: String,
    follow_ups: Vec<String>,
    calendar_event: Option<AiCalendarEvent>,
    notion_page: Option<NotionPageRequest>,
}

#[derive(Deserialize, Debug)]
struct MessageAnalysis {
    summary: String,
    importance: i32,
    message_type: String,
}

pub struct ChatServiceImpl {
    config_repo: Arc<dyn ConfigRepository>,
    user_api_key_repo: Arc<dyn UserApiKeyRepository>,
    message_repo: Arc<dyn MessageRepository>,
    chat_repo: Arc<dyn ChatRepository>,
    prompt_preset_repo: Arc<dyn PromptPresetRepository>,
    gemini_provider: Arc<dyn AiProvider>,
    openai_provider: Arc<dyn AiProvider>,
    openrouter_provider: Arc<dyn AiProvider>,
    create_event_usecase: Arc<CreateEventUseCase>,
    create_page_usecase: Arc<CreatePageUseCase>,
}

impl ChatServiceImpl {
    pub fn new(
        config_repo: Arc<dyn ConfigRepository>,
        user_api_key_repo: Arc<dyn UserApiKeyRepository>,
        message_repo: Arc<dyn MessageRepository>,
        chat_repo: Arc<dyn ChatRepository>,
        prompt_preset_repo: Arc<dyn PromptPresetRepository>,
        gemini_provider: Arc<dyn AiProvider>,
        openai_provider: Arc<dyn AiProvider>,
        openrouter_provider: Arc<dyn AiProvider>,
        create_event_usecase: Arc<CreateEventUseCase>,
        create_page_usecase: Arc<CreatePageUseCase>,
    ) -> Self {
        Self {
            config_repo,
            user_api_key_repo,
            message_repo,
            chat_repo,
            prompt_preset_repo,
            gemini_provider,
            openai_provider,
            openrouter_provider,
            create_event_usecase,
            create_page_usecase,
        }
    }

    async fn analyze_message(
        provider: Arc<dyn AiProvider>,
        api_key: String,
        model: String,
        message: Message,
        message_repo: Arc<dyn MessageRepository>
    ) -> Result<()> {
        // --- LAYER 1 & 2: Heuristic Filters (Cheap) ---
        if !Self::should_analyze_message(&message) {
            log::info!("Skipping analysis for message {} (filtered by heuristics)", message.id);
            return Ok(());
        }

        // --- LAYER 3: AI Classification (Smart) ---
        let system_prompt = r#"
            You are a background analyzer for a developer's chat assistant.
            Your goal is to identify if this message contains persistent value (decisions, preferences, project context).
            
            Analyze the message and return a JSON object:
            
            Rules for "importance" (0-100):
            - 0: Trivial, chit-chat, general knowledge questions (e.g., "What is Rust?", "Hi"), greetings.
            - 1-30: Temporary context, clarifications.
            - 31-70: User preferences, specific project details, code explanations worth remembering.
            - 71-100: Critical architectural decisions, permanent user instructions, "I will use X", "My stack is Y".

            Return JSON:
            1. "summary": A concise 1-sentence summary (max 20 words) in Portuguese. IF IMPORTANCE IS 0, RETURN EMPTY STRING "".
            2. "importance": Integer 0-100.
            3. "message_type": One of ['chat', 'decision', 'code', 'summary', 'meeting'].

            Example JSON:
            {
                "summary": "Decisão de usar Rocket como framework web.",
                "importance": 80,
                "message_type": "decision"
            }
        "#;

        let request = ChatCompletionRequest {
            model,
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                    image: None,
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: message.content.clone(),
                    image: None,
                }
            ],
            temperature: Some(0.1), // Lower temperature for classification
            max_tokens: Some(500),
        };

        match provider.chat_completion(&api_key, request).await {
            Ok(response) => {
                 if let Some(choice) = response.choices.first() {
                     let content = &choice.message.content;
                     
                     // Robust JSON extraction
                     let clean_content = if let Some(start) = content.find('{') {
                         if let Some(end) = content.rfind('}') {
                             if start <= end {
                                 &content[start..=end]
                             } else {
                                 content.trim()
                             }
                         } else {
                             content.trim()
                         }
                     } else {
                         content.trim()
                     };

                     log::debug!("Analysis raw content: {:?}", content);
                     log::debug!("Analysis clean content: {:?}", clean_content);

                     match serde_json::from_str::<MessageAnalysis>(clean_content) {
                         Ok(analysis) => {
                             // Only update if importance > 0 or it's not empty
                             if analysis.importance > 0 && !analysis.summary.is_empty() {
                                 let mut updated_message = message;
                                 updated_message.summary = Some(analysis.summary.clone());
                                 updated_message.importance = analysis.importance;
                                 updated_message.message_type = analysis.message_type;
                                 
                                 if let Err(e) = message_repo.update(updated_message).await {
                                     log::error!("Failed to update message analysis: {}", e);
                                 } else {
                                     log::info!("Message analyzed successfully: Importance {}, Summary: {:?}", analysis.importance, analysis.summary);
                                 }
                             }
                         },
                         Err(e) => log::error!("Failed to parse analysis JSON: {}. Content: {}", e, clean_content),
                     }
                 }
            },
            Err(e) => log::error!("Failed to call AI for analysis: {}", e),
        }

        Ok(())
    }

    fn should_analyze_message(message: &Message) -> bool {
        let content = message.content.trim();
        let content_lower = content.to_lowercase();
        let len = content.chars().count();

        // 1. Trivial Short Messages (Layer 1)
        if len < 10 {
            return false;
        }

        // 2. Role-specific Logic
        // For 'assistant', we rely on the fact that if the user asked a 'bad' question,
        // we probably skipped the user message. But here we check the assistant reply itself.
        // We only want to index Assistant replies that look like explanations or code.
        if message.role == "assistant" {
            // If it's short, it's likely just "Okay" or "I can't do that"
            if len < 50 { return false; }
            // If it contains code blocks, it's likely valuable
            if content.contains("```") { return true; }
        }

        // 3. Keyword Heuristics (Layer 2)
        
        // Indicators of MEMORY (Value)
        let memory_indicators = [
            // PT
            "gosto", "prefiro", "decidi", "vamos usar", "meu projeto", "meu app", 
            "minha aplicação", "importante", "lembre", "salvar", "contexto", 
            "padrão", "stack", "tecnologia", "arquitetura", "agora",
            // EN
            "like", "prefer", "decided", "will use", "my project", "my app", 
            "important", "remember", "save", "context", "rule", "pattern", 
            "stack", "technology", "architecture", "now"
        ];

        // Indicators of TRIVIALITY/SEARCH (Trash)
        let trash_indicators = [
            // PT
            "o que é", "quem é", "qual é", "explique", "significado", "traduz", 
            "traduza", "como faz", "exemplo de", "bom dia", "ola", "olá", "tchau",
            // EN
            "what is", "who is", "explain", "meaning", "translate", "how to", 
            "example of", "hello", "hi", "bye"
        ];

        // Check for Memory indicators first (Override trash)
        // E.g. "What is the architecture of my project?" -> Contains "what is" but also "my project"
        if memory_indicators.iter().any(|&s| content_lower.contains(s)) {
            return true;
        }

        // Check for Trash indicators
        if trash_indicators.iter().any(|&s| content_lower.contains(s)) {
            return false;
        }

        // 4. Default Fallback
        // If it's a User message, long enough, and passed trash filter -> Analyze (conservative)
        if message.role == "user" && len > 30 {
            return true;
        }
        
        // If Assistant message, long enough -> Analyze
        if message.role == "assistant" && len > 100 {
            return true;
        }

        false
    }
}



#[async_trait]
impl ChatService for ChatServiceImpl {
    async fn send_message_to_ai(&self, request: ChatServiceRequest) -> Result<(Message, Vec<String>)> {
        // 1. Get user's API key
        let user_api_keys = self.user_api_key_repo.find_by_user_id(request.user_id).await?;
        let provider_type = request.provider_name.parse::<AIProviderType>() // Changed from AIProviderType::from_str
            .map_err(|e| anyhow!("Unsupported AI provider: {}", e))?; // Handle error from parse

        let api_key_entry = user_api_keys.iter()
            .find(|key| key.provider == provider_type.to_string_key())
            .ok_or_else(|| anyhow!("API key not found for provider: {}", request.provider_name))?;
        
        let api_key = &api_key_entry.api_key;

        // 2. Select AI provider early (to use for analysis)
        let ai_provider = match provider_type {
            AIProviderType::Gemini => self.gemini_provider.clone(),
            AIProviderType::OpenAI => self.openai_provider.clone(),
            AIProviderType::OpenRouter => self.openrouter_provider.clone(),
        };

        // 3. Save user's message first
        let user_message = Message {
            id: Uuid::new_v4(),
            chat_id: request.chat_id,
            role: "user".to_string(),
            content: request.prompt.clone(),
            created_at: Utc::now(),
            summary: None,
            message_type: "chat".to_string(),
            importance: 0,
            follow_ups: None,
        };
        self.message_repo.create(user_message.clone()).await?;

        // 4. Spawn Background Analysis Agent for User Message
        let user_analysis_provider = ai_provider.clone();
        let user_analysis_api_key = api_key.clone();
        let user_analysis_model = request.model.clone();
        let user_analysis_message = user_message.clone();
        let user_analysis_repo = self.message_repo.clone();

        tokio::spawn(async move {
            if let Err(e) = Self::analyze_message(
                user_analysis_provider,
                user_analysis_api_key,
                user_analysis_model,
                user_analysis_message,
                user_analysis_repo
            ).await {
                log::error!("User message background analysis failed: {}", e);
            }
        });

        // 5. Fetch chat and preset
        let mut chat = self.chat_repo.find_by_id(request.chat_id).await?
            .ok_or_else(|| anyhow!("Chat not found"))?;
        
        let mut system_prompt = None;
        if let Some(preset_id) = &chat.prompt_preset_id {
             if let Some(preset) = self.prompt_preset_repo.find_by_id(preset_id).await? {
                 system_prompt = Some(preset.prompt);
             }
        }

        // 6. Fetch previous messages and build smart context
        let previous_messages = self.message_repo.find_by_chat_id(request.chat_id).await?;
        
        // 6.1 Check if Smart RAG is enabled
        let app_config = self.config_repo.get().await.unwrap_or_default();
        
        // 6.2 Fetch Global High-Importance Context (Last 50 chats, Top 6 items) ONLY if enabled
        let global_summaries = if app_config.enable_smart_rag {
            self.message_repo.find_high_importance_summaries(request.user_id, 50, 6).await
                .unwrap_or_default()
        } else {
            Vec::new()
        };
        
        let mut chat_messages: Vec<ChatMessage> = Vec::new();

        // 6.3. Add System Prompt with JSON instructions and Global Context
        let lang_instruction = match &request.output_language {
            Some(lang) => format!("\n- Responda OBRIGATORIAMENTE no idioma: {}", lang),
            None => "".to_string(),
        };

        // Build Global Context String
        let mut global_context_str = String::new();
        if !global_summaries.is_empty() {
            global_context_str.push_str("\n\n### CONTEXTO DE OUTROS CHATS RECENTES (MEMÓRIA):\n");
            for msg in global_summaries {
                // Skip if it belongs to current chat (already covered by local context)
                if msg.chat_id == request.chat_id { continue; }
                
                if let Some(s) = msg.summary {
                     global_context_str.push_str(&format!("- [Importância {}] {}\n", msg.importance, s));
                }
            }
        }

        let current_date = Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();

        let json_instruction = format!(
            "{}\n\nApós responder o usuário:\n- Gere de 3 a 4 perguntas de follow-up\n- As perguntas devem ajudar a avançar tecnicamente\n- Não repita informações já dadas\n- Se não houver follow-ups úteis, retorne uma lista vazia\n- As perguntas devem ser curtas e objetivas\n\nCALENDAR TOOL:\nSe o usuário pedir explicitamente para agendar/criar um evento, preencha o campo 'calendar_event'.\n- Use ISO 8601 para datas (Ex: 2024-12-30T15:00:00Z)\n- Converta termos relativos (amanhã, próxima terça) para datas absolutas baseadas em HOJE ({})\n- description é opcional\n\nNOTION TOOL:\nSe o usuário pedir para criar uma nota, página ou salvar algo no Notion, preencha o campo 'notion_page'.\n- 'title': Título da página.\n- 'content': Conteúdo da página (pode usar Markdown simples).\n- 'parent_id': Opcional. ID da página pai. Se não souber, deixe null (será usado o padrão).\n\nResponda em JSON no formato:\n{{\n  \"answer\": string,\n  \"follow_ups\": string[],\n  \"calendar_event\": {{\n    \"summary\": string,\n    \"description\": string | null,\n    \"start_time\": string,\n    \"end_time\": string\n  }} | null,\n  \"notion_page\": {{\n    \"title\": string,\n    \"content\": string,\n    \"parent_id\": string | null\n  }} | null\n}}\n{}",
            global_context_str,
            current_date,
            lang_instruction
        );

        if let Some(prompt) = system_prompt {
             chat_messages.push(ChatMessage {
                 role: "system".to_string(),
                 content: format!("{}{}", prompt, json_instruction),
                 image: None,
             });
        } else {
             chat_messages.push(ChatMessage {
                 role: "system".to_string(),
                 content: json_instruction,
                 image: None,
             });
        }

        // 6.3. Split messages into Recent (last 4) and Past
        let recent_count = 4;
        let mut all_msgs = previous_messages;
        
        let recent_msgs = if all_msgs.len() > recent_count {
            all_msgs.split_off(all_msgs.len() - recent_count)
        } else {
            let m = all_msgs.clone();
            all_msgs.clear();
            m
        };
        let past_msgs = all_msgs;

        // 6.3. Process Past Messages (Summaries + Importance)
        if !past_msgs.is_empty() {
            let mut highlights: Vec<_> = past_msgs.iter()
                .filter(|m| m.summary.is_some() && m.importance > 10)
                .collect();
            
            // Sort by importance DESC
            highlights.sort_by(|a, b| b.importance.cmp(&a.importance));
            
            // Take top 5 or 10 depending on history size
            let limit = if past_msgs.len() > 20 { 10 } else { 5 };
            let top_highlights = highlights.into_iter().take(limit);
            
            let mut history_context = String::from("### CONTEXTO RELEVANTE DO HISTÓRICO (RESUMIDO):\n");
            let mut found_any = false;

            for h in top_highlights {
                if let Some(s) = &h.summary {
                    history_context.push_str(&format!("- [{}] {}\n", h.message_type, s));
                    found_any = true;
                }
            }

            if found_any {
                chat_messages.push(ChatMessage {
                    role: "system".to_string(),
                    content: history_context,
                    image: None,
                });
            }
        }

        // 6.4. Add Recent Messages (Full Text)
        for msg in recent_msgs {
            let image = if msg.id == user_message.id {
                request.image.clone()
            } else {
                None
            };
            chat_messages.push(ChatMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
                image,
            });
        }

        let chat_req = ChatCompletionRequest {
            model: request.model.clone(),
            messages: chat_messages,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
        };

        // 7. Call AI provider
        let ai_response = ai_provider.chat_completion(api_key, chat_req).await?;

        // 8. Extract AI response content
        let ai_response_message_content = ai_response.choices.first() 
            .map(|choice| choice.message.content.clone()) 
            .ok_or_else(|| anyhow!("No response from AI"))?;
        
        let ai_response_message_role = ai_response.choices.first() 
            .map(|choice| choice.message.role.clone()) 
            .unwrap_or_else(|| "assistant".to_string()); 

        // Parse JSON response
        let (mut answer, follow_ups, calendar_event, notion_page) = match serde_json::from_str::<AiResponse>(&ai_response_message_content) {
            Ok(parsed) => (parsed.answer, parsed.follow_ups, parsed.calendar_event, parsed.notion_page),
            Err(_) => {
                    // Try to strip markdown code blocks if present ```json ... ```
                    let clean_content = ai_response_message_content.trim();
                    let clean_content = if clean_content.starts_with("```json") {
                        clean_content.trim_start_matches("```json").trim_end_matches("```").trim()
                    } else if clean_content.starts_with("```") {
                        clean_content.trim_start_matches("```").trim_end_matches("```").trim()
                    } else {
                        clean_content
                    };
                    
                    match serde_json::from_str::<AiResponse>(clean_content) {
                        Ok(parsed) => (parsed.answer, parsed.follow_ups, parsed.calendar_event, parsed.notion_page),
                        Err(_) => (ai_response_message_content.clone(), vec![], None, None) // Fallback to original
                    }
            }
        };

        // Execute Calendar Tool if present
        if let Some(event) = calendar_event {
            let start = chrono::DateTime::parse_from_rfc3339(&event.start_time)
                .map(|dt| dt.with_timezone(&Utc));
            let end = chrono::DateTime::parse_from_rfc3339(&event.end_time)
                .map(|dt| dt.with_timezone(&Utc));

            match (start, end) {
                (Ok(s), Ok(e)) => {
                    match self.create_event_usecase.execute(
                        request.user_id, 
                        event.summary, 
                        event.description, 
                        s, 
                        e, 
                        Some(request.chat_id)
                    ).await {
                        Ok(saved_event) => {
                             answer.push_str(&format!("\n\n✅ Evento agendado: **{}** ({})", saved_event.title, saved_event.start_at.format("%d/%m %H:%M")));
                        },
                        Err(err) => {
                             answer.push_str(&format!("\n\n❌ Falha ao agendar evento: {}", err));
                             log::error!("Failed to create calendar event from AI: {}", err);
                        }
                    }
                },
                _ => {
                    answer.push_str("\n\n❌ Falha ao agendar: Formato de data inválido gerado pela IA.");
                }
            }
        }

        // Execute Notion Tool if present
        if let Some(page) = notion_page {
            match self.create_page_usecase.execute(
                request.user_id,
                page.title,
                page.content,
                page.parent_id
            ).await {
                Ok(page_id) => {
                    // We don't have the URL easily unless we reconstruct it or fetch it, but usually ID is enough for confirmation
                    answer.push_str(&format!("\n\n✅ Página criada no Notion! (ID: {})", page_id));
                },
                Err(err) => {
                    answer.push_str(&format!("\n\n❌ Falha ao criar página no Notion: {}", err));
                    log::error!("Failed to create Notion page from AI: {}", err);
                }
            }
        }

        // 9. Save AI response to message repository (only content)
        let ai_message = Message {
            id: Uuid::new_v4(),
            chat_id: request.chat_id,
            role: ai_response_message_role,
            content: answer.clone(), // Clone here to use in spawn
            created_at: Utc::now(),
            summary: None,
            message_type: "chat".to_string(),
            importance: 0,
            follow_ups: if follow_ups.is_empty() { None } else { Some(follow_ups.clone()) },
        };

        self.message_repo.create(ai_message.clone()).await?;

        // 10. Spawn Background Analysis Agent for AI Response
        let analysis_provider = ai_provider.clone();
        let analysis_api_key = api_key.clone();
        let analysis_model = request.model.clone();
        let analysis_message = ai_message.clone();
        let analysis_repo = self.message_repo.clone();

        tokio::spawn(async move {
            if let Err(e) = Self::analyze_message(
                analysis_provider,
                analysis_api_key,
                analysis_model,
                analysis_message,
                analysis_repo
            ).await {
                log::error!("AI response background analysis failed: {}", e);
            }
        });

        // Update chat timestamp
        chat.updated_at = Utc::now();
        if let Err(e) = self.chat_repo.update(chat).await {
            log::warn!("Failed to update chat timestamp: {}", e);
        }

        Ok((ai_message, follow_ups))
    }
}
