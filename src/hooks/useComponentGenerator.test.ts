import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../utils/storage';
import { useComponentGenerator } from './useComponentGenerator';

describe('useComponentGenerator', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('성공한 생성 결과와 프롬프트를 localStorage에 저장한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'render(<div />)' }),
    }));
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('프로필 카드', undefined, 'google');
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components) ?? '[]')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory) ?? '[]')).toEqual(['프로필 카드']);
  });

  it('생성 중 코드를 표시하고 완료된 결과만 저장한다', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new ReadableStream({ start(c) { controller = c; } }), {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })));
  const { result } = renderHook(() => useComponentGenerator());
  let pending!: Promise<void>;
  await act(async () => { pending = result.current.generate('카드', undefined, 'google'); });
  expect(result.current.streamingComponent?.code).toBe('');
  await act(async () => { controller.enqueue(new TextEncoder().encode('{"type":"delta","text":"const Card"}\n')); });
  expect(result.current.streamingComponent?.code).toBe('const Card');
  expect(result.current.components).toHaveLength(0);
  await act(async () => {
    controller.enqueue(new TextEncoder().encode('{"type":"done","code":"render(<div />)"}\n'));
    controller.close();
    await pending;
  });
  expect(result.current.streamingComponent).toBeNull();
  expect(result.current.components[0].code).toBe('render(<div />)');
});

});
