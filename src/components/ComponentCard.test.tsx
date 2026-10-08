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

it('생성 중 코드 탭을 표시하고 완료 시 미리보기로 전환한다', () => {
  const component = { id: 'stream', prompt: '카드', code: 'const Card', createdAt: new Date() };
  const props = { component, onRemove: vi.fn(), onRegenerate: vi.fn(), isLoading: true };
  const { rerender } = render(<ComponentCard {...props} isStreaming />);
  expect(screen.getByRole('button', { name: '코드' })).toHaveClass('tab--active');
  expect(screen.getByText('const Card')).toBeVisible();
  expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();
  rerender(<ComponentCard {...props} component={{ ...component, code: 'render(<div>완성!</div>)' }} isStreaming={false} isLoading={false} />);
  expect(screen.getByRole('button', { name: '미리보기' })).toHaveClass('tab--active');
});
