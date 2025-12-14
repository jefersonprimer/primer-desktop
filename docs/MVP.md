cluely like

MVP
Requisitos funcionais:
1- Stealth Mode (nao ficar visivel em compartilhamento de tela).
2- integracao com ia (OpenAi, gemini, claude code, qualquer api key).
3- click-throught (como e um janela que fica acima de outras, o app nao pode roubar o foco das outras janelas).
4- esconder o app da dock do so, DOCK/ALT+TAB não mostra: App oculto

futuro:
4- screenshot automatico.
5- modelo local.
6- suporta MCPs (Google Calendar, Drive, Slack).

* os chats vao ser salvos no sqlite, e o usuario pode fazer backups no supabase.
- frontend tauri 2, vite, ts.
- backend rust.

Como penso o app, login, signup, pede sua api key: openai, gemini, claude code, chat que voce conversa com a ia, e ela da a resposta para voce, como se voce estar conversando com alguem, futuramente, voce pode tirar screenshot e mandar para ela analisar, e ela dar resposta, audio com o whispper, mas no futuro, agora no comeco apenas chat, mas o projeto deve estar preparado para conseguir integrar com essas features.Audio, screenshot sao recursos para o chat com a ia, nao necessariamente sao dominios diferentes, sao recursos do chat. Tem o dominio do user, aonde fica o crud de login, registro etc...,o dominio do notification que fica responsavel por enviar emails, e o ai que e o chat, chat de mensagem, envio de screenshot, audio com o whispper (whispper transforma o audio em texto e manda para a ai).
