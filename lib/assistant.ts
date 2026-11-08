// What the server sends the model. The browser only supplies the conversation: the instructions, the
// tool list and the model are fixed here, so a page can't widen what the assistant may do.

import { INSTRUCTIONS, TOOL_SCHEMAS, TOOLS } from './exchange/tools';

export const DEFAULT_MODEL = 'gpt-5.4-mini';

// Bound the cost of one call, whatever the browser sends.
const MAX_COMPLETION_TOKENS = 4000;
// Low reasoning costs about half as much per answer; the tools enforce the budget and the secrecy.
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || 'low';
const MAX_MESSAGES = 80;
const MAX_CHARS = 200_000;

export const BUDGET_USED_UP = "The demo's AI budget has run out for now. You can still run the exchange without me, with the button below.";

type ToolCall = { id?: string; type?: string; function?: { name?: string; arguments?: string } };
export type ChatMessage = { role: string; content?: unknown; tool_calls?: ToolCall[]; tool_call_id?: string };

/** Keeps what a conversation can hold, and refuses one that has grown absurd. Null means refuse. */
export function cleanConversation(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  if (JSON.stringify(messages).length > MAX_CHARS) return null;
  const clean: ChatMessage[] = [];
  for (const message of messages as ChatMessage[]) {
    if (message?.role === 'user' && typeof message.content === 'string') clean.push({ role: 'user', content: message.content });
    else if (message?.role === 'assistant') clean.push({ role: 'assistant', content: message.content ?? null, ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}) });
    else if (message?.role === 'tool' && typeof message.tool_call_id === 'string') clean.push({ role: 'tool', tool_call_id: message.tool_call_id, content: String(message.content ?? '') });
    else return null; // Including any "system" message: those come from here.
  }
  return clean;
}

export const requestFor = (messages: ChatMessage[], model: string) => ({
  model,
  messages: [{ role: 'system', content: INSTRUCTIONS }, ...messages],
  tools: TOOL_SCHEMAS,
  max_completion_tokens: MAX_COMPLETION_TOKENS,
  reasoning_effort: REASONING_EFFORT,
});

export const assistantSays = (content: string) => ({
  id: 'tinsel-notice',
  object: 'chat.completion',
  choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
});

type ModelAnswer = { choices?: { finish_reason?: string; message?: { content?: string | null; tool_calls?: ToolCall[] } }[] };

/** Holds a model to the tools it was offered: a call to anything else never reaches the browser. */
export function dropUnknownCalls<T extends ModelAnswer>(answer: T): T {
  for (const choice of answer.choices ?? []) {
    const calls = choice.message?.tool_calls;
    if (!choice.message || !calls) continue;
    const known = calls.filter((call) => Object.hasOwn(TOOLS, call.function?.name ?? ''));
    if (known.length === calls.length) continue;
    if (known.length > 0) {
      choice.message.tool_calls = known;
    } else {
      delete choice.message.tool_calls;
      choice.message.content = choice.message.content || "I can't do that from here.";
      choice.finish_reason = 'stop';
    }
  }
  return answer;
}
