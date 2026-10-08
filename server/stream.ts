import { ensureRenderCall, stripCodeFences } from './generator';
import { readLines } from '../shared/lines';

export async function readProviderStream(response: Response, provider: 'google' | 'anthropic', onText: (text: string) => void): Promise<string> {
  if (!response.body) throw new Error('응답 스트림이 없습니다.');
  let text = '';
  let complete = false;
  let data: string[] = [];
  function consume() {
    if (!data.length) return;
    const event = JSON.parse(data.join('\n'));
    data = [];
    if (event.error || event.type === 'error') throw new Error('코드 생성 중 API 오류가 발생했습니다.');
    let delta = '';
    if (provider === 'google') {
      const candidate = event.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error('코드 생성이 완료되지 않았습니다. 더 간단한 컴포넌트를 요청해주세요.');
      }
      complete ||= candidate?.finishReason === 'STOP';
      delta = candidate?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    } else {
      if (event.type === 'message_delta' && event.delta?.stop_reason === 'max_tokens') throw new Error('생성된 코드가 너무 길어 잘렸습니다.');
      complete ||= event.type === 'message_stop';
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') delta = event.delta.text;
    }
    if (delta) { text += delta; onText(delta); }
  }
  for await (const line of readLines(response.body)) {
    if (!line) consume();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  consume();
  if (!complete || !text.trim()) throw new Error('코드 생성이 완료되기 전에 연결이 종료되었습니다.');
  return text;
}

export function createCodeStream(generate: (emit: (text: string) => void) => Promise<string>, abort?: () => void) {
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        if (!cancelled) controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
      };
      try {
        const text = await generate(text => send({ type: 'delta', text }));
        const code = ensureRenderCall(stripCodeFences(text));
        send({ type: 'done', code });
      } catch {
        send({ type: 'error', error: '코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' });
      } finally {
        if (!cancelled) controller.close();
      }
    },
    cancel() { cancelled = true; abort?.(); },
  });
}
