## **1️⃣ Domain Layer (`src/domain`)**

Aqui fica toda a **lógica de negócio**, independente de como os dados são armazenados ou servidos.

### Estrutura atual:

* **`user`**: CRUD de usuários e autenticação

  * `entity/` → entidades como `User`, `UserDevice`
  * `repository/` → interfaces de repositório, ex: `UserRepo`
  * `service/` → lógica auxiliar, ex: `PasswordHasher`, `TokenGenerator`
  * `usecase/` → casos de uso: `login`, `register`, `update_profile`, `delete_account`
* **`ai`**: Chat com IA, recursos de áudio e visão

  * `chat/` → core do chat

    * `entity/` → `Chat`, `ChatMessage`, `Attachment`
    * `repository/` → interfaces para chat e message
    * `service/` → `ChatService`, `ContextManager`
    * `usecase/` → `send_message`, `create_chat`, `backup_chat`, `sync_messages`
  * `audio/` → gravação e transcrição (`Whisper`)
  * `provider/` → integração com APIs externas: `OpenAI`, `Gemini`, `Claude`
  * `vision/` → processamento de imagens
* **`notification/email`**: envio de emails

  * `entity/` → `EmailMessage`
  * `repository/` → interface `EmailSender`
  * `service/` → `EmailService`
  * `templates/` → templates de email HTML
  * `usecase/` → `send_email`

---

## **2️⃣ Infrastructure Layer (`src/infrastructure`)**

Implementa **interfaces externas** (repositórios, APIs, banco de dados) usadas pela Domain Layer.

* **`database/`** → conexão com SQLite ou Postgres (`database.rs`)
* **`user/sql_user_repository.rs`** → implementa `UserRepo` usando banco
* **`ai/chat/chat_repository_impl.rs`** e `message_repository_impl.rs` → CRUD de chat/messages
* **`ai/audio/whisper_client.rs`** → cliente de transcrição
* **`ai/provider/`** → implementa provider externo (OpenAI, etc.)
* **`notification/email/smtp_email_sender.rs`** → envia email real

> Tudo que é infraestrutura pode ser trocado sem mexer na Domain Layer (por exemplo, trocar SQLite por Supabase).

---

## **3️⃣ Interfaces Layer (`src/interfaces`)**

Ponto de entrada do **backend para o frontend ou APIs externas**.

* **`dto/`** → estruturas de dados transferidas entre frontend e backend
* **`http/`** → controllers HTTP (ou no seu caso, comandos Tauri):

  * `user_controller.rs` → login, registro, etc.
  * `chat_controller.rs` → enviar mensagem, criar chat, backup
  * `notification_controller.rs` → enviar email

> No Tauri, você provavelmente vai trocar o HTTP por **Tauri Commands** (`tauri::invoke`), mas a lógica dos controllers pode ser reaproveitada.

---

## **4️⃣ Server (`src/server`)**

* `router.rs` → monta rotas HTTP (ou Tauri commands)
* `mod.rs` → inicializa servidor

---

## **5️⃣ Shared (`src/shared`)**

* Helpers e utilitários:

  * `errors.rs` → tipos de erro
  * `logger.rs` → logging
  * `middleware.rs` → middleware HTTP
  * `utils.rs` → funções genéricas

---

## **💡 Como o MVP se encaixa**

Para o seu app desktop (Tauri + SQLite + backup opcional Supabase):

1. **SQLite local** → implementado nos repositórios (`chat_repository_impl.rs`, `message_repository_impl.rs`, `sql_user_repository.rs`)
2. **Supabase backup** → você pode criar um `SupabaseRepository` que implementa a mesma interface de repositório do Domain Layer (`ChatRepository`, `MessageRepository`)
3. **Tauri Commands** → no lugar de HTTP, você cria funções que chamam os **usecases** do Domain Layer

   * Exemplo: `create_chat`, `send_message`, `backup_chat`
4. **Stealth mode / click-through** → implementado no frontend (Tauri + TS), não depende do backend
