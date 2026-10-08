import { describe, expect, it } from 'vitest';
import { createCodeStream, readProviderStream } from './stream';

function response(events: unknown[]) {
  const text = events.map(e => `data: ${JSON.stringify(e)}\r\n\r\n`).join('');
  return new Response(new ReadableStream({ start(c) {
    const bytes = new TextEncoder().encode(text);
    for (let i = 0; i < bytes.length; i += 7) c.enqueue(bytes.slice(i, i + 7));
    c.close();
  }}));
}
describe('provider streaming', () => {
  it('Google 코드 조각을 즉시 전달하고 완료를 확인한다', async () => {
    const chunks: string[] = [];
    const result = await readProviderStream(response([
      { candidates: [{ content: { parts: [{ text: 'const 카드' }] } }] },
      { candidates: [{ content: { parts: [{ text: ' = () => <div />;' }] }, finishReason: 'STOP' }] },
    ]), 'google', t => chunks.push(t));
    expect(chunks).toEqual(['const 카드', ' = () => <div />;']);
    expect(result).toBe(chunks.join(''));
  });
  it('Anthropic text delta를 전달한다', async () => {
    const chunks: string[] = [];
    await readProviderStream(response([
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'hello' } },
      { type: 'message_stop' },
    ]), 'anthropic', t => chunks.push(t));
    expect(chunks).toEqual(['hello']);
  });
  it.each([
    ['google', { candidates: [{ finishReason: 'MAX_TOKENS' }] }],
    ['anthropic', { type: 'message_delta', delta: { stop_reason: 'max_tokens' } }],
    ['anthropic', { type: 'error', error: { message: 'secret' } }],
  ] as const)('잘린 응답이나 오류를 성공으로 처리하지 않는다: %s', async (provider, event) => {
    await expect(readProviderStream(response([event]), provider, () => {})).rejects.toThrow();
  });
  it('완료 이벤트 없는 연결 종료는 실패한다', async () => {
    await expect(readProviderStream(response([]), 'google', () => {})).rejects.toThrow();
  });
});

it('생성 중 delta와 정규화한 done 응답을 내보낸다', async () => {
  const body = createCodeStream(async emit => {
    emit('const Card = () => <div />;');
    return '```jsx\nconst Card = () => <div />;\n```';
  });
  const events = (await new Response(body).text()).trim().split('\n').map(line => JSON.parse(line));
  expect(events[0]).toEqual({ type: 'delta', text: 'const Card = () => <div />;' });
  expect(events[1]).toEqual({ type: 'done', code: 'const Card = () => <div />;\n\nrender(<Card />);' });
});

it.each([
  ['429', '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'],
  ['503', 'API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.'],
])('provider의 %s 오류를 구분해 전달한다', async (status, message) => {
  const body = createCodeStream(async () => {
    throw new Error(`Provider error: ${status}`);
  });

  const [event] = (await new Response(body).text()).trim().split('\n').map(line => JSON.parse(line));

  expect(event).toEqual({ type: 'error', error: message });
});
