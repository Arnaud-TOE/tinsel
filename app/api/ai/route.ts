import { assistantSays, BUDGET_USED_UP, cleanConversation, DEFAULT_MODEL, dropUnknownCalls, requestFor } from '@/lib/assistant';
import { isSameOrigin, modelCallRefusal } from '@/lib/guard';

// The proxy behind the assistant. The browser sends the conversation; this adds the key, which never
// reaches it, and the instructions and tools, which it can't change.

const COMPLETIONS_URL = process.env.OPENAI_COMPLETIONS_URL ?? 'https://api.openai.com/v1/chat/completions';

const error = (status: number, message: string) => Response.json({ error: message }, { status });
const say = (message: string) => Response.json(assistantSays(message));

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return error(403, 'This endpoint only serves the Tinsel app.');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return say("I'm not set up on this server yet. You can still run the exchange without me, with the button below.");

  const refusal = modelCallRefusal(request);
  if (refusal) return say(refusal);

  const body = await request.json().catch(() => null);
  const messages = cleanConversation(body?.messages);
  if (!messages) return error(400, 'That is not a conversation this assistant can read.');

  const upstream = await fetch(COMPLETIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(requestFor(messages, process.env.OPENAI_MODEL ?? DEFAULT_MODEL)),
    signal: request.signal,
  }).catch(() => null);

  if (!upstream) return say("I couldn't reach the model just now. Please try again in a moment.");
  const answer = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const code = answer?.error?.code;
    if (code === 'insufficient_quota' || code === 'credit_balance_exhausted') return say(BUDGET_USED_UP);
    console.error('[assistant] the model request failed', upstream.status, answer?.error?.message);
    return say("The model didn't answer that one. Please try again in a moment.");
  }
  return Response.json(dropUnknownCalls(answer));
}
