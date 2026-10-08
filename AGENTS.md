# 운영 명령어

- 의존성 설치와 모든 스크립트 실행에는 Bun만 사용한다. `npm`, `yarn`, `pnpm`으로 lockfile이나 의존성을 변경하지 않는다.
- 개발 서버: `bun run dev`
- API 서버만 실행: `bun run server`
- 전체 테스트: `bun run test`
- 린트: `bun run lint`
- 프로덕션 빌드: `bun run build`

# Golden Rules

- 생성된 코드는 `react-live`의 `noInline` 실행 규약을 지켜야 한다. import나 TypeScript 문법을 넣지 않고 마지막에 `render(<Component />)`를 보장한다. 서버 프롬프트가 이 제약을 지정하고(`server/index.ts:9-20`), `ensureRenderCall`이 누락된 호출을 보완한다(`server/generator.ts:16-23`), 프런트엔드는 `noInline`으로 실행한다(`src/components/LivePreview.tsx:14-18`).
- 빈 프롬프트 차단은 클라이언트와 서버 모두 유지한다. UI는 빈 입력에서 제출을 막고(`src/components/PromptInput.tsx:20-24, 50-54`), API도 요청 본문을 검증한다(`server/index.ts:176-181`). 한쪽만 제거하지 않는다.
- API 키 값은 서버 경계를 넘겨 응답이나 설정 API에 노출하지 않는다. 환경 키는 서버에서만 읽고(`server/index.ts:59-66`), `/api/config`은 존재 여부만 반환한다(`server/index.ts:147-156`). `.env`는 Git에 추가하지 않는다(`.gitignore:32`).
- Google 모델 호출은 선언된 순서대로 폴백하도록 유지한다. Google 경로만 `withModelFallback`을 사용하고(`server/index.ts:4-5, 134-136`), 실패 시 마지막 오류를 보존한다(`server/fallback.ts:11-19`). 해당 동작을 바꾸면 폴백 테스트도 갱신한다(`server/fallback.test.ts:15-40`).

# TDD Rule

> **이 규칙은 Rigid — 상황에 맞게 변형하지 마라.**

하위 디렉터리의 `AGENTS.md`에 별도 TDD 규칙이 있으면 **그 규칙을 우선**한다. 이 섹션은 전역 기본값(fallback)이다.

## 적용 기준

- **TDD 필수:** 비즈니스 로직, API, 유틸리티, 버그 수정
- **TDD 불필요:** 타입 정의, 설정 파일, 순수 UI, SQL

## RED-GREEN-REFACTOR

1. **RED:** 하나의 동작마다 테스트 하나를 작성한다. 반드시 실행해 실패를 확인하고, 실패 이유는 **기능 미구현**이어야 한다.
2. **GREEN:** 테스트를 통과시키는 최소한의 코드만 작성한다. **YAGNI**를 지키고, 신규·기존 테스트가 모두 통과하는지 확인한다.
3. **REFACTOR:** 중복 제거, 이름 개선, 헬퍼 추출만 수행한다. green 상태를 유지하며 **새 동작을 추가하지 않는다.**
4. **반복:** 다음 동작에 대한 RED로 돌아간다.

## 삭제 강제 규칙

테스트 전에 프로덕션 코드를 먼저 작성했다면 해당 코드를 **삭제하고 RED부터 재시작**한다. "참고용"으로 남기는 것도 **금지**한다.

## 변명 차단표

| 변명 | 반론 |
| --- | --- |
| 너무 단순해서 테스트 불필요 | 단순한 동작도 요구사항을 고정하고 회귀를 막는다. |
| 나중에 추가하겠다 | 나중은 보장되지 않는다. 지금 RED를 작성한다. |
| 시간이 없다 | 테스트 없는 수정은 재작업 비용을 키운다. |
| 삭제하면 낭비 | 잘못된 순서는 매몰비용이 아니다. 삭제 후 RED로 재시작한다. |
| 프로토타입이다 | 프로토타입도 검증 가능한 동작부터 만든다. |

# 프로젝트 컨텍스트

프롬프트로 독립형 React 컴포넌트를 생성하고 코드와 실행 미리보기를 제공한다.

React 19, TypeScript, Vite, Bun, react-live, Vitest, Testing Library.

# Standards & References

- 프런트엔드 또는 미리보기 변경은 [src 규칙](./src/AGENTS.md)을 먼저 읽는다.
- AI 제공자, API 요청, 응답 정규화 변경은 [server 규칙](./server/AGENTS.md)을 먼저 읽는다.
- 커밋은 `$commit` 스킬을 사용하고 `feat`, `fix`, `refactor`, `chore: 한국어 요약` 형식을 따른다.
- 규칙과 코드가 어긋나면 관련 AGENTS.md의 근거 라인과 규칙 갱신을 함께 제안한다.

# Context Map

- **[React UI, 상태, 미리보기, Vite 프록시](./src/AGENTS.md)** — `src`의 컴포넌트·훅·스타일·테스트 수정 시.
- **[Bun API, AI 제공자, 응답 정규화](./server/AGENTS.md)** — `server`의 라우트·모델·폴백·단위 테스트 수정 시.
