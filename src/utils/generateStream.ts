import { readLines } from '../../shared/lines';

export async function readGeneratedCode(response: Response, onText: (text: string) => void): Promise<string> {
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || '컴포넌트 생성에 실패했습니다.');
  }
  // Keep compatibility with servers returning the original JSON response.
  if (!response.headers?.get('Content-Type')?.includes('ndjson')) return (await response.json()).code;
  if (!response.body) throw new Error('응답 스트림이 없습니다.');
  for await (const line of readLines(response.body)) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === 'delta' && typeof event.text === 'string') onText(event.text);
    else if (event.type === 'done' && typeof event.code === 'string' && event.code.trim()) return event.code;
    else if (event.type === 'error') throw new Error(event.error || '코드 생성에 실패했습니다.');
    else throw new Error('잘못된 스트림 응답입니다.');
  }
  throw new Error('코드 생성이 완료되기 전에 연결이 종료되었습니다.');
}
