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
});
