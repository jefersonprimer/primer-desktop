---

# 🟦 **SCHEMA COMPLETO DO SQLITE (offline-first)**

> ⚠️ **Pode copiar e colar direto no SQLite**.
> Tudo adaptado para TEXT/INTEGER, sem timezone, sem constraints remotas.

---

# 📌 **1. Tabela de sessão**

Sempre 1 linha, guarda tokens localmente.

```sql
CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id TEXT NOT NULL,             -- uuid vindo do Supabase
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER NOT NULL        -- epoch timestamp
);
```

---

# 📌 **2. Users (somente cache local)**

Armazenamos apenas para mostrar dados localmente se offline.

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- uuid em texto
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,       -- epoch
  updated_at INTEGER NOT NULL
);
```

> No login, você salva o user que veio do Supabase localmente também.

---

# 📌 **3. Chats (igual ao Supabase, mas adaptado)**

```sql
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,               -- uuid
  user_id TEXT NOT NULL,             -- uuid
  title TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Índice recomendado:

```sql
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats (user_id);
```

---

# 📌 **4. Messages (mensagens locais do chat)**

```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,               -- uuid
  chat_id TEXT NOT NULL,             -- uuid
  role TEXT NOT NULL,                -- system, user, assistant
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

Índice:

```sql
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id, created_at);
```

---

# 📌 **5. User API Keys (opcional localmente)**

Se quer deixar o usuário usar chave OpenAI, Anthropic, etc.

```sql
CREATE TABLE IF NOT EXISTS user_api_keys (
  id TEXT PRIMARY KEY,               -- uuid
  user_id TEXT NOT NULL,             -- uuid
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,             -- criptografar depois
  created_at INTEGER NOT NULL
);
```

Índice:

```sql
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys (user_id);
```

---

# 🟩 **Resumo rápido do SQLite final**

| Tabela          | Finalidade                                                   |
| --------------- | ------------------------------------------------------------ |
| `session`       | Tokens localmente, login offline.                            |
| `users`         | Cache local do usuário.                                      |
| `chats`         | Chats locais, sincronizados com a nuvem se o usuário quiser. |
| `messages`      | Mensagens locais.                                            |
| `user_api_keys` | Chaves de IA locais (criptografar).                          |

---

# 🟧 Diferenças do SQLite vs Supabase

| Recurso     | Supabase      | SQLite                                         |
| ----------- | ------------- | ---------------------------------------------- |
| UUID        | `uuid`        | `TEXT`                                         |
| timestamp   | `timestamptz` | `INTEGER` (epoch)                              |
| foreign key | usado         | **não usar** (sincronização fica mais simples) |
| sync        | automático    | manual (opcional)                              |

---
