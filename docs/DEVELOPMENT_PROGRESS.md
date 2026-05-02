# Development Progress

작성일: 2026-05-01

이 문서는 지금까지 실제로 적용된 백엔드 변경사항과 다음 개발 순서를 한눈에 보기 위한 작업판입니다.

## 현재 완료된 작업

| 영역 | 상태 | 설명 |
| --- | --- | --- |
| Supabase PostgreSQL 기준 DB | 완료 | 운영 기준 DB를 Supabase PostgreSQL로 고정했습니다. SQLite fallback은 제거했습니다. |
| 핵심 운영 테이블 | 완료 | `purchases`, `generation_jobs`, `admin_audit_logs`, `reports` 테이블을 생성했습니다. |
| AI 생성 작업 저장 | 완료 | AI 작업 상태가 서버 메모리가 아니라 `generation_jobs` DB 테이블에 저장됩니다. |
| Admin MVP | 완료 | `/admin`에서 기본 운영 지표를 볼 수 있는 화면을 만들었습니다. |
| Admin 이메일 | 완료 | `youngho940701@gmail.com`을 관리자 이메일 allowlist에 넣었습니다. |
| 구매 기록 DB화 | 완료 | 데모 구매도 `purchases` 테이블에 기록되도록 연결했습니다. |
| 리뷰 권한 검증 | 완료 | 리뷰 작성 API가 `purchases` 테이블의 `paid` 구매 기록을 확인합니다. |

## 오늘 적용한 핵심 변경

1. `src/lib/serverAuth.ts`
   - API에서 Supabase 로그인 토큰을 확인하는 공통 함수를 추가했습니다.
   - 개발 환경에서는 테스트용 JWT payload의 `sub` 값으로 빠르게 API 검증을 할 수 있습니다.

2. `src/lib/purchases.ts`
   - 구매 여부 확인 함수 `hasPaidPurchase`를 추가했습니다.
   - 데모 구매 기록 생성 함수 `upsertDemoPurchase`를 추가했습니다.

3. `src/app/api/purchases/demo/route.ts`
   - 프론트에서 데모 구매 버튼을 누르면 Supabase DB의 `purchases` 테이블에 기록합니다.

4. `src/context/PurchasedVideosContext.tsx`
   - 기존 로컬/데모 구매 흐름을 유지하면서 서버 구매 기록도 같이 남기도록 연결했습니다.

5. `src/app/api/reviews/[videoId]/route.ts`
   - 리뷰 작성 전에 로그인 여부를 확인합니다.
   - 리뷰 작성 전에 `purchases` 테이블에 `paid` 구매 기록이 있는지 확인합니다.
   - 구매 기록이 없으면 `403 purchase_required`로 차단합니다.

## 검증 결과

| 검증 | 결과 |
| --- | --- |
| Prisma schema validate | 성공 |
| Prisma Client generate | 성공 |
| Production build | 성공 |
| 구매 전 리뷰 작성 | 정상 차단: `403 purchase_required` |
| 데모 구매 생성 | 성공 |
| 구매 후 리뷰 작성 | 성공 |
| 현재 DB 카운트 | `purchases`: 1, `video_reviews`: 0, `generation_jobs`: 1, `reports`: 0 |

테스트 중 생성한 임시 리뷰/구매 데이터는 검증 후 정리했습니다.

## 다음 개발 순서

| 순서 | 작업 | 목적 |
| --- | --- | --- |
| 1 | Admin Audit Log 연결 | 관리자가 중요한 액션을 했을 때 기록을 남깁니다. |
| 2 | Seller/Admin 권한 강화 | 다른 판매자의 데이터에 접근하지 못하게 막습니다. |
| 3 | 영상 승인/반려 플로우 | 판매자 업로드 영상을 Admin이 검수 후 공개하게 만듭니다. |
| 4 | Admin 상세 페이지 확장 | 구매, AI 작업, 신고, 감사 로그를 각각 보기 쉽게 나눕니다. |
| 5 | 운영 알림/리포트 정리 | 신고와 알림을 관리자가 처리할 수 있게 만듭니다. |

## 용어 설명

| 용어 | 쉬운 설명 |
| --- | --- |
| API | 화면과 서버가 대화하는 통로입니다. 버튼을 누르면 API를 통해 서버에 요청합니다. |
| JWT | 로그인한 사용자인지 확인하는 디지털 출입증입니다. |
| Prisma | 코드에서 DB를 안전하게 다루기 위한 도구입니다. |
| Schema | DB 테이블 구조를 코드로 적어둔 설계도입니다. |
| Migration | DB 구조를 실제로 변경하는 작업입니다. |
| Audit Log | 관리자가 무엇을 바꿨는지 남기는 운영 기록입니다. |
