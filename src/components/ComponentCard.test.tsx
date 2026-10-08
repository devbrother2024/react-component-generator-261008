import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComponentCard } from './ComponentCard';

describe('ComponentCard', () => {
  it('복원된 컴포넌트의 미리보기는 사용자가 실행할 때까지 잠긴다', async () => {
    const user = userEvent.setup();
    render(
      <ComponentCard
        component={{
          id: 'restored',
          prompt: '프로필 카드',
          code: 'render(<div>미리보기</div>)',
          createdAt: new Date('2026-10-08T00:00:00.000Z'),
          restored: true,
        }}
        onRemove={vi.fn()}
        onRegenerate={vi.fn()}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: '미리보기' }));

    expect(screen.getByRole('button', { name: '미리보기 실행' })).toBeVisible();
  });
});
