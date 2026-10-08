# Module Context

`server`는 Bun API 프록시로서 환경 또는 요청 API 키를 사용해 Anthropic·Google에 요청하고, 결과를 react-live 실행 코드로 정규화한다.

# Tech Stack & Constraints

- 런타임은 Bun이며 서버 포트는 `3002`다(`index.ts`의 `Bun.serve`).
- 생성 코드는 import와 TypeScript 문법 없이 독립 실행 가능해야 하며, `render(...)` 호출이 필요하다(`index.ts`의 `SYSTEM_PROMPT`, `generator.ts`의 `ensureRenderCall`).

# Implementation Patterns

- 새 API 경로는 `CORS_HEADERS`를 일관되게 적용하고 OPTIONS 요청을 유지한다(`index.ts`의 `CORS_HEADERS`와 OPTIONS 분기).
- 환경 키는 `resolveApiKey`를 통해서만 선택한다(`index.ts`의 `resolveApiKey`). 설정 API에는 키 자체가 아니라 boolean 상태만 노출한다(`index.ts`의 `/api/config` 분기).
- Google 모델 추가·순서 변경은 `GOOGLE_MODELS`와 `withModelFallback` 경로를 함께 검토한다(`index.ts`의 `GOOGLE_MODELS`와 `callGoogle`).

- `/api/generate`는 NDJSON `delta`로 코드 조각을 전달하고, 정규화한 최종 코드를 `done`으로 전달한다. 실패는 `error` 이벤트로 전달한다.
- Google 폴백은 코드 조각 전달 전에만 수행한다. 전달 후 실패하면 마지막 오류를 보존하고 스트림을 종료해 서로 다른 모델의 코드가 섞이지 않게 한다.

# Testing Strategy

- 코드 펜스 제거 또는 렌더 호출 정규화 변경은 `generator.test.ts`를 갱신하고 `bun run test`를 실행한다.
- 모델 재시도 정책 변경은 첫 성공, 중간 실패 뒤 성공, 전체 실패, 빈 목록을 모두 검증한다(`fallback.test.ts:4-41`).

# Local Golden Rules

- 생성 결과는 `stripCodeFences` 후 `ensureRenderCall`을 거쳐 응답한다(`stream.ts`의 `createCodeStream`). 정규화 단계를 건너뛰면 `react-live` 미리보기가 깨질 수 있다.
- 빈 프롬프트나 누락된 키를 공급자 API로 전달하지 않는다. 서버 검증을 클라이언트 검증으로 대체하지 않는다(`index.ts`의 `/api/generate` 검증).
- API 키는 오류 문자열, 성공 응답, 설정 응답에 포함하지 않는다. 서버 내부에서만 사용한다(`index.ts`의 `resolveApiKey`, `/api/config`, `stream.ts`의 오류 이벤트).
