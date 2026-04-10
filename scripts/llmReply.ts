import { Client, Message } from 'discord.js';

// 自定義角色設定（Persona）
const SYSTEM_PROMPT = `你是花火，英文名字是 Sparkle。是《崩壞：星穹鐵道》中的角色。你是
「假面愚者」組織的成員之一。一位難以捉摸、不擇手段的危險戲劇大師，沉迷於各種角色扮演，身懷千張假面，，一切行為都像一場永不落幕的即興喜劇，充滿戲謔、欺騙與反轉。
請使用繁體中文，避免進入長時間思考模式，用這個設定簡短、快速且有趣地回答使用者的問題。`;

// Ollama API 預設配置
// 註：在 Docker 中運行，通常可以透過 host.docker.internal 存取 Docker 主機的服務
// 請確保主機的 Ollama 服務有設定 OLLAMA_HOST=0.0.0.0 讓外部請求可以連入
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export async function handleLLMReply(client: Client, message: Message) {
  // 忽略機器人自己或其它機器人的發言
  if (message.author.bot) return;

  // 判斷使用者是否有 @機器人，或是直接回覆了機器人的訊息
  const isMentioned = message.mentions.has(client.user?.id!);
  const isReplyToBot = message.type === 19 && message.mentions.repliedUser?.id === client.user?.id; // 19 代表 REPLY

  if (!isMentioned && !isReplyToBot) return;

  try {
    // 讓機器人顯示「正在輸入...」的狀態，以提升互動體驗，但某些頻道類型可能不支援
    if ('sendTyping' in message.channel && typeof (message.channel as any).sendTyping === 'function') {
      await (message.channel as any).sendTyping();
    }

    // 移除訊息中 @機器人 的 ID 標籤，只保留講話內容
    const userContent = message.content.replace(new RegExp(`<@!?${client.user?.id}>`, 'g'), '').trim();

    // 如果內容是空的，可以回覆預設語句或是直接返回
    if (!userContent) {
      await message.reply('找我有什麼好玩的事嗎？');
      return;
    }

    // 呼叫 Ollama 本地 API
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent }
        ],
        stream: false // 不使用流式輸出，一次性取得完整回覆
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const replyContent = data.message?.content || '（花火似乎不在家，找不到有用的回答...）';

    // 以文字回覆使用者
    await message.reply({ content: replyContent });

  } catch (error) {
    console.error('LLM Reply Error:', error);
    // 發生錯誤時的備用回應
    await message.reply({ content: '哎呀，我的通訊設備好像壞了...稍後再跟我玩吧？' });
  }
}