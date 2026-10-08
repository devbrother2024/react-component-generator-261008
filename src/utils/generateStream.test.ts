import { describe, expect, it } from 'vitest';
import { readGeneratedCode } from './generateStream';
function response(text: string) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(c) {
    for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3));
    c.close();
  }}), { headers: { 'Content-Type': 'application/x-ndjson' } });
}
describe('readGeneratedCode', () => {
  it('분할된 UTF-8과 마지막 개행 없는 done을 읽는다', async () => {
    const chunks: string[] = [];
    expect(await readGeneratedCode(response('{"type":"delta","text":"한글"}\n{"type":"done","code":"render(<div />)"}'), t => chunks.push(t))).toBe('render(<div />)');
    expect(chunks).toEqual(['한글']);
  });
  it('중간 연결 종료는 실패한다', async () => {
    await expect(readGeneratedCode(response('{"type":"delta","text":"partial"}\n'), () => {})).rejects.toThrow('연결이 종료');
  });
  it('스트림 오류를 사용자에게 전달한다', async () => {
    await expect(readGeneratedCode(response('{"type":"error","error":"과부하"}\n'), () => {})).rejects.toThrow('과부하');
  });
});
