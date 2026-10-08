import { describe, expect, it } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('500자 이하의 프롬프트는 유효하다', () => {
    expect(validatePromptLength('가'.repeat(MAX_PROMPT_LENGTH))).toBeNull();
  });

  it('500자를 초과한 프롬프트는 오류를 반환한다', () => {
    expect(validatePromptLength('가'.repeat(MAX_PROMPT_LENGTH + 1))).toBe(
      '프롬프트는 500자 이하로 입력해주세요.',
    );
  });
});
