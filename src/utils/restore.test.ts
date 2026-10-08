import { describe, expect, it } from 'vitest';
import { restoreComponents, restorePromptHistory, restoreProvider } from './restore';

describe('restoreProvider', () => {
  it('지원하지 않는 저장 Provider는 기본값으로 복원한다', () => {
    expect(restoreProvider('unknown')).toBe('google');
  });

  it('저장된 Provider를 복원한다', () => {
    expect(restoreProvider('anthropic')).toBe('anthropic');
  });
});

describe('restorePromptHistory', () => {
  it('유효한 최근 프롬프트만 중복 없이 최대 20개 복원한다', () => {
    const history = [
      '카드',
      '카드',
      42,
      '',
      ...Array.from({ length: 21 }, (_, index) => `프롬프트 ${index}`),
    ];

    expect(restorePromptHistory(history)).toEqual([
      '카드',
      ...Array.from({ length: 19 }, (_, index) => `프롬프트 ${index}`),
    ]);
  });
});

describe('restoreComponents', () => {
  it('필수 필드와 유효한 날짜가 있는 컴포넌트만 복원하며 미리보기를 잠근다', () => {
    const restored = restoreComponents([
      {
        id: 'valid',
        prompt: '프로필 카드',
        code: 'render(<div />)',
        createdAt: '2026-10-08T00:00:00.000Z',
      },
      {
        id: 'invalid-date',
        prompt: '잘못된 날짜',
        code: 'render(<div />)',
        createdAt: 'not-a-date',
      },
      { id: 'missing-code', prompt: '누락', createdAt: '2026-10-08T00:00:00.000Z' },
    ]);

    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      id: 'valid',
      prompt: '프로필 카드',
      restored: true,
    });
    expect(restored[0].createdAt).toBeInstanceOf(Date);
  });
});
