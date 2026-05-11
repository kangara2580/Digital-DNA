# Next Backend Execution Plan

작성일: 2026-05-01  
목표: Supabase PostgreSQL 기준으로 백엔드 핵심 리스크를 제거하고, Admin에서 운영 가능한 구조까지 연결한다.

---

## 1. 현재 완료된 것

| 항목 | 상태 |
| --- | --- |
| 기준 DB를 Supabase PostgreSQL로 확정 | 완료 |
| SQLite fallback 제거 | 완료 |
| Admin 이메일 설정 | 완료: `youngho940701@gmail.com` |
| 신규 테이블 생성 | 완료: `purchases`, `generation_jobs`, `admin_audit_logs`, `reports` |
| AI Job DB 저장화 | 완료 |
| Admin MVP 화면 | 완료 |
| API/DB 인벤토리 문서화 | 완료 |

현재 가장 큰 변화는 AI 생성 작업 상태가 더 이상 메모리 `Map`에만 있지 않고, Supabase `generation_jobs` 테이블에 저장된다는 점이다.

---

## 2. 다음 전체 작업 묶음

앞으로의 백엔드 안정화 작업은 아래 5개 덩어리로 진행한다.

1. 구매/리뷰 권한 정리
2. Admin Audit Log 연결
3. 판매자/관리자 권한 강화
4. 영상 승인/반려 운영 플로우
5. Admin 데이터 화면 확장

이 순서대로 가면 데이터 기반이 단단해지고, Admin 화면도 실제 운영 도구가 된다.

---

## 3. Phase 1: 구매/리뷰 권한 정리

### 목적

리뷰는 실제로 구매한 사람만 작성할 수 있어야 한다. 현재는 구매 테이블 기준 검증이 약하므로 `purchases` 테이블을 기준으로 바꾼다.

### 작업 목록

| 작업 | 파일/영역 | 설명 |
| --- | --- | --- |
| 구매 기록 helper 추가 | `src/lib/purchases.ts` | 구매 여부 확인, 구매 생성, 구매 목록 조회 |
| 리뷰 작성 API 수정 | `src/app/api/reviews/[videoId]/route.ts` | `purchases`에 paid 구매 기록이 있어야 리뷰 작성 가능 |
| 데모 구매와 실제 구매 분리 | `src/lib/supabaseUserSync.ts` 주변 | 기존 `user_demo_purchases`와 새 `purchases` 책임 구분 |
| Admin에 구매 수 표시 | `src/lib/adminDashboard.ts` | 총 구매 수, 최근 구매 수 KPI 추가 |

### 완료 기준

- 구매 기록이 없는 유저는 리뷰 작성 불가
- 구매 기록이 있는 유저만 리뷰 작성 가능
- Admin 대시보드에서 `purchases` 카운트 확인 가능
- 빌드 성공

### 주의점

지금 실제 결제 기능이 완성되어 있지 않으면, 먼저 “구매 기록 생성 API”를 내부 테스트/데모 용도로만 만든다. 결제 붙이기 전까지는 실제 돈 흐름과 분리한다.

---

## 4. Phase 2: Admin Audit Log 연결

### 목적

관리자가 중요한 상태를 바꾸면 누가, 언제, 무엇을 바꿨는지 남겨야 한다.

### 작업 목록

| 작업 | 파일/영역 | 설명 |
| --- | --- | --- |
| Audit helper 추가 | `src/lib/adminAudit.ts` | 관리자 액션 기록 공통 함수 |
| Admin API 공통 권한 함수 정리 | `src/lib/adminAuth.ts` | `requireAdmin()` 형태로 API에서도 재사용 |
| 가격 제안 수락 로그 | `/api/notifications/[id]/accept` | 가격 변경 전/후 기록 |
| 향후 승인/반려 로그 기반 준비 | Admin video action API | 상태 변경 시 audit 기록 |
| Admin 화면에 최근 로그 표시 | `/admin` | 최근 Admin Audit Log 패널 추가 |

### 완료 기준

- Admin 액션이 `admin_audit_logs`에 저장됨
- Admin 화면에서 최근 로그 확인 가능
- 로그에는 actor, action, target, before/after가 들어감

---

## 5. Phase 3: 판매자/관리자 권한 강화

### 목적

API가 사용자가 보내는 `sellerId`를 그대로 믿지 않도록 한다. 서버에서 로그인 유저를 확인하고, 본인 데이터인지 검사한다.

### 작업 목록

| 작업 | 파일/영역 | 설명 |
| --- | --- | --- |
| `requireUser()` 추가 | `src/lib/serverAuth.ts` | Supabase Bearer token 또는 cookie에서 유저 확인 |
| `requireSellerOwner()` 추가 | `src/lib/serverAuth.ts` | 영상의 sellerId와 로그인 유저 비교 |
| 알림 목록 API 보강 | `/api/notifications` | query sellerId 의존 제거 또는 검증 |
| 알림 수락 API 보강 | `/api/notifications/[id]/accept` | body sellerId 대신 로그인 유저 기준 |
| 판매자 API 검토 | `/api/sell/*` | 중복 인증 로직 공통화 |

### 완료 기준

- 타인의 sellerId를 넣어도 데이터 접근 불가
- 인증 실패 시 일관된 `401`
- 권한 없음은 일관된 `403`
- 기존 판매자 업로드/수정/삭제 기능 유지

---

## 6. Phase 4: 영상 승인/반려 운영 플로우

### 목적

판매자가 올린 영상이 바로 공개되지 않고, Admin 검수 후 공개되도록 만든다.

### 필요한 DB 변경

`videos` 테이블에 아래 컬럼 추가 추천:

| 컬럼 | 목적 |
| --- | --- |
| `status` | `draft`, `pending`, `approved`, `rejected`, `hidden` |
| `moderation_reason` | 반려/숨김 사유 |
| `approved_at` | 승인 시간 |
| `approved_by` | 승인한 관리자 |

### 작업 목록

| 작업 | 파일/영역 | 설명 |
| --- | --- | --- |
| Prisma Video 모델 확장 | `prisma/schema.prisma` | status 관련 필드 추가 |
| Supabase SQL 작성/적용 | `supabase/video_moderation.sql` | 컬럼/인덱스 추가 |
| 업로드 기본 상태 변경 | `/api/sell/upload` | 새 업로드는 `pending` |
| 공개 피드 필터링 | 공개 영상 조회 API | `approved`만 노출 |
| Admin 승인/반려 API | `/api/admin/videos/[id]/*` | approve/reject/hide |
| Admin 화면 버튼 추가 | `/admin` 또는 `/admin/videos` | 승인/반려/숨김 |
| Audit Log 연결 | `admin_audit_logs` | 상태 변경 기록 |

### 완료 기준

- 새 업로드 영상은 기본 `pending`
- 공개 화면에는 `approved`만 노출
- Admin에서 승인/반려 가능
- 반려 사유 저장 가능
- 모든 상태 변경이 Audit Log에 기록됨

---

## 7. Phase 5: Admin 데이터 화면 확장

### 목적

Admin을 단순 대시보드에서 실제 운영 화면으로 확장한다.

### 화면 목록

| 화면 | URL | 우선순위 |
| --- | --- | --- |
| Dashboard | `/admin` | 완료, 계속 확장 |
| Videos | `/admin/videos` | 높음 |
| AI Jobs | `/admin/generation-jobs` | 높음 |
| Purchases | `/admin/purchases` | 중간 |
| Reports | `/admin/reports` | 중간 |
| Audit Logs | `/admin/audit-logs` | 중간 |
| Users | `/admin/users` | 중간 |
| Settings | `/admin/settings` | 낮음 |

### 완료 기준

- 각 화면은 검색/필터/상태 배지를 갖는다.
- 위험 액션은 즉시 실행하지 않고 확인 단계를 둔다.
- 테이블 UI는 모바일보다 데스크톱 운영에 최적화한다.

---

## 8. 한 번에 진행할 추천 작업 순서

아래 순서가 가장 안전하다.

1. `purchases` helper와 리뷰 권한 검증
2. Admin 대시보드에 구매/AI Job DB 지표 추가
3. `adminAudit` helper 추가
4. 알림 수락 API에 Audit Log 연결
5. `serverAuth` 공통 유저 인증 helper 추가
6. 알림 API의 sellerId 검증 강화
7. 영상 moderation 컬럼 추가 SQL 작성
8. 영상 업로드 기본 상태를 `pending`으로 변경
9. Admin 영상 승인/반려 API 추가
10. `/admin/videos` 화면 생성

이 10개를 완료하면 백엔드는 “운영 가능한 마켓플레이스 기본기”에 상당히 가까워진다.

---

## 9. 사용자 확인이 필요한 결정

개발 중간에 아래 결정만 필요하다.

| 결정 | 추천값 |
| --- | --- |
| 구매 기능은 실제 결제 전까지 데모 구매로 둘지 | 예, 먼저 데모 구매로 흐름 완성 |
| 새 판매자 업로드를 바로 공개할지 | 아니오, `pending` 후 Admin 승인 |
| Admin 반려 사유를 사용자에게 보여줄지 | 예, 판매자 마이페이지에 표시 |
| AI 실패 Job을 자동 재시도할지 | 처음에는 수동 재시도 |
| Admin 권한은 이메일 allowlist로 유지할지 | 초기에는 유지, 이후 DB role로 확장 |

---

## 10. 이번 묶음의 최종 완료 기준

전체 작업이 끝났다고 볼 수 있는 기준:

- `npm run build` 성공
- Supabase `purchases`에 테스트 구매 기록 생성 가능
- 구매한 유저만 리뷰 작성 가능
- `generation_jobs`는 계속 DB 기준으로 동작
- Admin에서 AI Job/구매/최근 로그가 보임
- Admin 액션이 `admin_audit_logs`에 남음
- 판매자 알림 API가 타인 sellerId로 접근되지 않음
- 새 업로드 영상이 검수 상태로 관리됨

---

## 11. 바로 다음 작업

다음 개발 턴에서는 아래를 바로 구현한다.

1. `src/lib/purchases.ts` 추가
2. 리뷰 작성 API에 구매 검증 연결
3. Admin 대시보드에 `purchases` KPI 추가
4. 테스트 구매 생성용 내부 helper 또는 API 설계
5. 빌드 및 Supabase Table Editor 확인

이 작업은 DB에 이미 `purchases` 테이블이 있으므로 바로 진행 가능하다.
