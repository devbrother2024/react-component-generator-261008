# Module Context

`src`는 프롬프트 입력, API 요청 상태, 생성 코드의 react-live 실행과 표시를 담당한다. `/api` 요청은 Vite 프록시를 통해 Bun 서버로 전달된다(`vite.config.ts:8-14`).

# Tech Stack & Constraints

- React 19와 TypeScript를 사용한다.
- `react-live` 미리보기는 `noInline` 모드다(`components/LivePreview.tsx:14-18`). 생성 코드를 실행하는 방식은 서버 규칙과 함께 변경한다.
- API 요청은 절대 서버 URL이 아닌 `/api/...` 상대 경로를 사용한다. 개발 프록시 대상은 `localhost:3002`다(`../vite.config.ts:8-14`).

# Implementation Patterns

- 생성 요청 상태와 컴포넌트 목록은 `useComponentGenerator`에 둔다. 새 결과는 최신순으로 추가한다(`hooks/useComponentGenerator.ts:35-42`).
- 프로바이더를 바꾸면 직접 입력한 API 키를 비운다(`App.tsx:41-44`). 이 동작을 유지해 다른 공급자 키를 재사용하지 않는다.
- 미리보기 새로고침은 `previewKey`로 리마운트한다(`components/ComponentCard.tsx:16-17, 31-35`). 새로고침을 전역 상태 초기화로 바꾸지 않는다.

# Testing Strategy

- 입력 동작을 바꾸면 `components/PromptInput.test.tsx`에 빈 입력, 제출, 로딩 상태를 함께 검증한다(`components/PromptInput.test.tsx:6-29`).
- 실행: `bun run test`. Vite 설정은 `src/**/*.test.{ts,tsx}`와 `server/**/*.test.ts`를 모두 수집한다(`../vite.config.ts:16-21`).

# Local Golden Rules

- 빈 프롬프트의 클라이언트 차단을 제거하지 않는다. 제출 핸들러와 버튼 disabled 조건이 함께 이를 보장한다(`components/PromptInput.tsx:20-24, 50-54`).
- API 키를 localStorage나 컴포넌트 목록에 저장하지 않는다. 현재 키는 `App`의 메모리 상태이며(`App.tsx:14-20`), 요청 시에만 훅으로 전달된다(`App.tsx:33-39`, `hooks/useComponentGenerator.ts:23-27`).
- `GeneratedComponent.createdAt`은 `Date`로 사용하므로 표시·저장 방식 변경 시 카드의 시간 형식화도 함께 검토한다(`types/index.ts:3-8`, `components/ComponentCard.tsx:18-21`).
