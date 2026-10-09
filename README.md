# 소안도의 노래 — AI 작사 코치

초등학교 6학년 『소안도』 독서 후 가사 발전 활동. React + TypeScript, Vinext, Cloudflare Workers / D1, OpenAI Chat Completions. 숫자 점수 없이 형식·내용·운율 피드백과 최소 수정 제안을 제공한다.

## 현재 상태 (2026-10-09)

**학생용 AI는 잠겨 있다. 실제 API 키와 ZDR 승인을 확인하지 못했다. 실제 모델 평가와 OCR 정확도를 성공했다고 주장하지 않는다.** UI와 실제 모델 호출 코드는 구현되어 있다. 가짜 평가 폴백은 없다. 승인 없이 AI 엔드포인트는 본문 읽기 전에 503으로 차단한다.

GitHub public 저장소: https://github.com/frommars-teacher/soando-song. 전체 소스와 GitHub Pages 워크플로를 이 저장소로 관리한다. AI 서버의 비밀값은 저장소에 넣지 않는다.

## 사용자 흐름

직접 입력 / 손글씨 사진 → 인식 텍스트 학생 확인 → 실제 모델 평가 → 세 기준 독립 카드 → 원본·추천본 비교 → 원문 유지/추천본 선택/표현별 적용/직접 수정 → 재평가 → 편집·복사. Suno 링크는 공식 홈페이지를 새 탭으로 열 뿐 가사를 자동 전송하지 않는다.

초안은 각 탭의 sessionStorage에만 보관한다. 서버에 작품이나 이미지를 저장하지 않는다. 새로 시작 시 작품을 지운다. 서버는 독립 요청이며 세션 ID는 임의 UUID이다. 다른 학생의 가사/평가에 접근하는 API는 없다.

## AI 활성화 준비

1. OpenAI Developers 플러그인을 연결하고 전용 API 프로젝트를 준비한다. ChatGPT Plus와 API 요금은 별개다.
2. [Under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)를 검토한다. 13세 미만 또는 적용되는 디지털 동의 연령 미만 아동의 개인정보 처리 전 ZDR가 필요하다. 이름을 요구하지 않아도 작품/사진에 개인정보가 들어갈 수 있으므로 모든 학생 AI를 보수적으로 잠근다.
3. [데이터 제어](https://developers.openai.com/api/docs/guides/your-data)에서 ZDR 사전 승인, 선택 프로젝트/모델/엔드포인트/이미지 적용 범위를 확인한다. `store:false`는 ZDR 승인과 다르다. 이미지 CSAM 분류 시 보관 예외가 있다.
4. 학교의 개인정보 처리, 필요한 동의·보호 절차를 확인한다. 본 앱만으로 법률 준수 완료를 보증할 수 없다.
5. 서버 비밀 설정에 API 키와 수업 코드 등록, 승인 증빙 확인 후 활성화 값 설정 및 재배포.
6. 교사가 만든 비개인정보 가사·손글씨로 실제 모델과 교실 기기·동시 접속 리허설을 한다.

| 서버 환경변수 | 설정 |
|---|---|
| OPENAI_API_KEY | 비밀 API 키; 클라이언트에 절대 전달하지 않는다 |
| OPENAI_MODEL | 기본 gpt-4.1-mini; 변경 시 이미지·JSON Schema·ZDR 지원 재검토 |
| CLASSROOM_CODE | 비밀 공용 수업 코드; 개별 계정/회원가입 아님 |
| ZDR_VERIFIED | 제공업체 승인·프로젝트 적용을 증빙 확인한 뒤 true |
| POLICY_REVIEWED | 학교 미성년자·개인정보 검토 완료 뒤 true |
| STUDENT_AI_ENABLED | 모든 준비 완료 후 true; 수업 후 false로 끄고 재배포 |
| DAILY_REQUEST_LIMIT | 기본 100, 범위 1~200 |

`.env` 파일은 버전 관리에서 제외한다. `NEXT_PUBLIC_` 키에 비밀값을 넣지 않는다. Sites 환경변수 관리로 비밀을 등록하고 재배포한다. 위 검증 플래그는 운영자의 확인 기록이지 앱이 제공업체 승인을 자동 조회한다는 뜻이 아니다.

## 사용량 및 비용

전체 기본 100 요청/UTC일(최대 200), 임시 세션당 12/UTC일, 전체 30/분. 한국시각 09:00에 날짜가 바뀐다. 사진 인식과 재평가도 각각 1회. D1 조건부 UPSERT가 전체 한도를 원자적으로 적용한다. 한도가 일부 예약된 뒤 다른 한도에서 거절되거나 제공업체 요청이 실패하면 예약은 환불되지 않는다(과금 중복 방지 및 보수적 예산 제한). 임시 세션 ID를 새로 만드는 남용은 전체 한도와 비밀 수업 코드로 추가 제한한다. 코드는 완전한 사용자 인증을 대체하지 않는다.

가사 3,000자, 입력 요청 4.3MB, 사진 기기 선택 8MB / 전송 전 최대 1,600px로 축소·메타데이터 제거, 출력 최대 5,000토큰, 서버 55초 타임아웃, 프런트 65초. 제공업체 원문 오류는 클라이언트에 노출하지 않는다.

[공식 모델 가격](https://developers.openai.com/api/docs/models/gpt-4.1-mini) 확인일 2026-10-09: 입력 $0.40/100만 토큰, 출력 $1.60/100만 토큰. 예를 들어 입력 3,000 + 출력 2,000 토큰이면 1회 약 $0.0044, 100회 약 $0.44. 실제 이미지 토큰·가사 길이·응답 길이·모델/가격 변경에 따라 달라진다. 이미지 사용료는 해당 모델의 이미지 토큰 산정이 적용된다. 출력 5,000토큰의 비용은 기본 모델 기준 1회 최대 $0.008이며 입력 비용은 별도다. 호스팅·DB 비용은 플랫폼 요금에 따라 별도 확인한다. 금액을 고정 보장하는 과금 차단은 아니다. 전용 API 프로젝트의 예산 알림을 추가하고 한도를 작게 유지한다. API 프로젝트 예산 알림이 반드시 하드 차단은 아니다.

## 개인정보·안전 설계

- 학생 이름/학번/이메일/회원가입 없음; 얼굴·개인정보가 담긴 사진 금지 안내.
- 광고, 추적 SDK, 외부 폰트 없음. React의 텍스트 렌더링으로 응답 HTML 실행 금지.
- 가사·사진·결과는 D1에 저장하지 않음. 콘텐츠 로그를 쓰지 않음. D1에는 임의 요청 ID·세션 ID별 카운터·만료 시각만 저장; 24시간 뒤 다음 요청에서 삭제. 호스팅 운영 로그는 플랫폼 정책 별도.
- 동일 출처 요청만 허용. 입력/출력 Zod 검증, 엄격한 JSON Schema, 원문 인용 일치 검증. 자유 채팅·도구·검색 없음.
- 학생 텍스트/이미지 내 지시는 데이터로 취급하는 시스템 지침. 이메일·전화·주민번호 패턴 차단. 프롬프트 인젝션이나 개인정보의 모든 유형을 완벽히 탐지한다고 주장하지 않음.
- OCR은 불확실한 부분 표시 및 학생 확인이 필수. 사진에 개인 정보가 보이면 OCR 반환을 거절하도록 지시하나 이미지를 보내기 전 완벽한 자동 탐지는 아님. 따라서 ZDR/학교 검토 게이트가 필수.
- AI 첨삭본이 정답이 아님. 책 내용/역사적 사실 임의 추가 금지. 확인 필요 목록 제공.

## 개발 / 검증

의존성: Node 22.13 이상. `pnpm install`, `pnpm dev`, `pnpm build`. 서버는 Cloudflare Worker 환경과 DB 바인딩 필요. `node node_modules/typescript/bin/tsc --noEmit` / `node tests/server.mjs`.

D1 스키마는 db/schema.ts, 마이그레이션은 drizzle/*.sql. Sites 배포 시 적용된다. 별도 Cloudflare로 이동할 경우 바인딩과 마이그레이션을 해당 프로젝트에 설정해야 한다. GitHub Pages 단독으로 비밀 API 호출 서버를 운영할 수 없다.

## 테스트 결과

| 항목 | 결과 |
|---|---|
| TypeScript | 통과 |
| 서버 미설정 게이트, 본문 미열람 | 자동 검증 통과 |
| 잘못된 코드·입력 길이·개인정보 패턴·이미지 형식 | 자동 검증 통과 |
| JSON 응답/원문 인용 근거 검증 | 모의 응답으로 통과 |
| 중복 요청·세션 한도 | 모의 DB로 통과 |
| 20 동시 요청, 전체 한도 8개만 성공 | 모의 DB·모의 AI로 통과; 실제 D1 부하 시험과 다름 |
| AI 오류 / 네트워크 오류 | 모의 오류로 502 처리 통과 |
| 실제 가사 평가·세 기준 품질·수정 제안 | 미검증(API/ZDR 미설정) |
| 실제 손글씨 OCR·불확실성 정확도 | 미검증 |
| 원본 비교·학생 선택·재평가 UI | 구현, 브라우저 조작 미검증 |
| 복사·Suno 새 탭 이동 | 구현, 실기기 미검증 |
| 모바일·태블릿·키보드·동시 학생 | 반응형 구현, 실기기 미검증 |

상세 운영 안내는 배포 사이트 /teacher에도 있다. 실제 수업용 완성 상태로 안내할 수 있는 단계는 아직 아니다.

## GitHub Pages + Cloudflare Worker 배포 경로

2026-10-09 수정: 숯색 진행 막대, 종이색 가사 편집면, 적갈색 액션 버튼, 원문 중심 타이포그래피로 화면을 재구성했다. 장식용 파형과 영문 표어를 없애고 실제 가사 글자·행·연 수를 보여 준다.

이 저장소는 두 배포 경로를 제공한다. 기존 Sites 배포는 기존 주소에서 제공되며, 새 GitHub Pages 경로는 `github-web/main.tsx`와 `vite.pages.config.ts`로 같은 React 화면을 정적 빌드한다. `.github/workflows/pages.yml`이 main 브랜치 변경 시 검증·빌드·Pages 배포를 수행한다. GitHub Pages에는 API 키와 서버 코드를 배포하지 않는다. AI 서버는 `worker/index.ts`를 Cloudflare Worker로 배포한다.

### GitHub 배포 준비

1. GitHub에 public 저장소를 만들고 전체 소스를 업로드한다.
2. 저장소 Settings → Pages → Source를 GitHub Actions로 설정한다.
3. Cloudflare에 전용 D1 데이터베이스를 만든 뒤 `worker/wrangler.jsonc`의 database_id 자리표시자를 실제 ID로 바꾼다.
4. `pnpm exec wrangler d1 migrations apply soando-song-quota --remote --config worker/wrangler.jsonc`로 마이그레이션을 적용한다.
5. `pnpm exec wrangler deploy --config worker/wrangler.jsonc`로 비활성 상태 Worker를 배포한다.
6. GitHub Settings → Secrets and variables → Actions → Variables에 `COACH_API_ORIGIN`을 실제 Worker HTTPS origin으로 설정한다(끝에 / 없이). 이것은 공개 서버 주소이며 API 키가 아니다.
7. Actions에서 Pages 워크플로를 실행한다. 프런트엔드는 `/api/status`와 `/api/coach`를 위 서버 주소로 호출한다.
8. ZDR 및 학교 검토 완료 뒤 Cloudflare secrets에 OPENAI_API_KEY, CLASSROOM_CODE를 등록하고 승인 플래그를 설정·재배포한다. 서버 `APP_ORIGIN`은 실제 GitHub Pages 계정 origin과 정확히 일치해야 한다. 기본값은 `https://frommars-teacher.github.io`이다.

로컬 Pages 빌드: `pnpm exec vite build --config vite.pages.config.ts`. 정적 출력은 `pages-dist/`이며 상대 경로 assets와 teacher.html을 사용하므로 저장소 하위 경로에 배포할 수 있다. 실제 Worker 주소가 설정되지 않은 Pages 화면은 AI가 준비되지 않았다고 안내한다. GitHub Actions/Cloudflare 계정 접근과 Pages 실제 게시 및 Worker 배포는 별도 검증 전까지 미완료이다.

검증: Pages 정적 빌드 및 TypeScript, 서버 모의 테스트 통과. 브라우저 시각·실기기 검증 및 실제 AI 호출은 미검증 상태를 유지한다.
