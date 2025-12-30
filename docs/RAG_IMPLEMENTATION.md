# 🧠 RAG & Smart Memory Architecture (Retrieval-Augmented Generation)

This document details the **Smart Memory** system implemented in the application. It transforms the AI from a stateless chatbot into a context-aware assistant that remembers critical decisions, code snippets, and preferences across sessions.

---

## 🏗️ Architecture Philosophy

The system is built on a **"Passive Collection, Active Retrieval"** philosophy:

1.  **Always Learning (Passive):** Every interaction is analyzed, summarized, and scored for importance in the background. This happens regardless of settings.
2.  **On-Demand Intelligence (Active):** The user decides when to "activate" this memory (Smart Context) to save tokens or focus on specific tasks.

---

## ⚙️ Layer 1: The "Intelligent Filter" Memory Generator

Every time a message is sent (by User or AI), a parallel process (`tokio::spawn`) is triggered. However, unlike standard logging, **we do not memorize everything**. The system uses a **3-Layer Funnel** to filter out noise and capture only valuable context.

### The 3-Layer Funnel

#### 1. 🛡️ Layer 1: Heuristics & Triviality (Code-Level)
Before calling any AI model, the system checks basic heuristics:
*   **Length Check:** Discards extremely short messages (< 10 chars).
*   **Trash Indicators:** Automatically ignores Google-like queries or casual chit-chat (e.g., *"What is X?"*, *"Translate Y"*, *"Hi"*, *"Good morning"*).
*   **Outcome:** If a message fails here, it is ignored immediately. **Cost: 0 tokens.**

#### 2. 🔍 Layer 2: Value Heuristics (Code-Level)
If a message passes Layer 1, we check for **"Gold Keywords"** that imply long-term value:
*   **Indicators:** *"My project"*, *"I decided"*, *"We prefer"*, *"Architecture"*, *"Stack"*.
*   **Effect:** Presence of these keywords forces the message into Layer 3, overriding other filters.

#### 3. 🧠 Layer 3: The AI Judge (Strict Classification)
The message is sent to a background AI agent with a **strict instruction** to act as a memory filter. It assigns an `importance` score:

*   **`0` (TRIVIAL):** General knowledge, definitions, small talk. **Result:** Data is **discarded** (not saved to DB).
*   **`1-30` (TEMPORARY):** Clarifications, specific but transient context.
*   **`31-70` (CONTEXT):** User preferences, specific project details ("My app uses React").
*   **`71-100` (CRITICAL):** Architecture decisions, permanent constraints ("Use Clean Architecture", "Never use libraries").

**Result:** The database (`messages` table) is only updated if `importance > 0`. This ensures the memory bank contains high-signal, low-noise data.

---

## 🧠 Layer 2: Context Construction Strategy

When sending a prompt to the AI, we don't just send "the chat history". We construct a **Smart Context** using a 3-tier strategy to maximize IQ while minimizing Token usage.

### Tier 1: The Immediate Buffer (Raw)
*   **Scope:** The last **4 messages**.
*   **Format:** Full, raw text.
*   **Purpose:** Ensures the AI understands immediate references like "rewrite **this**" or "change the color".

### Tier 2: Local History (Summarized)
*   **Scope:** All previous messages in the **current chat**.
*   **Logic:**
    *   Instead of sending full text, we look for messages with `importance > 10`.
    *   We send their **Summaries**.
    *   **Benefit:** Compresses thousands of tokens into a few lines of bullet points.

### Tier 3: Global Context (Smart RAG)
*   **Trigger:** Controlled by the **"Smart Context (RAG)"** toggle in *Settings > Resources*.
*   **Scope:** The user's last **50 chats**.
*   **Logic:**
    1.  The system scans the summaries of the last 50 chats.
    2.  It filters for high importance (High-value memories).
    3.  It selects the **Top 6** highest-scoring memories.
    4.  It injects them into the System Prompt as:
        > `### CONTEXTO DE OUTROS CHATS RECENTES (MEMÓRIA):`
        > `- [Importância 95] User defined that the project uses PostgreSQL.`
        > `- [Importância 80] Architecture pattern must follow Clean Architecture.`

---

## 🕹️ User Control (The Toggle)

Located in **Settings > Resources**.

*   **OFF (Default):**
    *   The AI uses only the current chat context.
    *   Fastest response, lowest token cost.
    *   *Note:* Background analysis **still runs**, saving data for the future.
*   **ON (Smart Context):**
    *   The AI "remembers" facts from up to 50 past conversations.
    *   Ideal for complex projects where context continuity is key.

---

## 💾 Database Schema

### `messages` Table (Updated)
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `summary` | `TEXT` | The generated 1-sentence summary. |
| `importance` | `INT` | 0-100 score of content value. |
| `message_type` | `TEXT` | Classification (chat, code, decision). |

### `app_config` Table
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `enable_smart_rag` | `BOOLEAN` | Persists the user's preference for Global Context. |

---

## 🚀 Future Roadmap (Layer 3: Semantic Search)

Currently, the Global Context selects based on **Importance** (Recency + Score).
The next evolution is to solve the *"Cake vs. Steak"* problem using **Embeddings**:

1.  **Vector Store:** Store embedding vectors for every summary in `rag_entities`.
2.  **Semantic Search:** Instead of "Top 6 Important", fetch "Top 6 Relevant to the current question".
    *   *Example:* If talking about "Database", fetch high-importance memories about "SQL" from last month, ignoring high-importance memories about "CSS".
