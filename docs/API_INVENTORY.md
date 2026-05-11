# API Inventory

작성일: 2026-05-01

이 문서는 현재 백엔드 API를 기능별로 정리한 운영용 지도입니다.

## 핵심 원칙

- 공개 API와 로그인 API를 구분한다.
- 판매자 API는 반드시 로그인 유저와 `sellerId`를 서버에서 비교해야 한다.
- Admin API는 반드시 관리자 권한을 확인해야 한다.
- 오래 걸리는 AI 작업은 요청 안에서 끝내지 않고 Job으로 관리한다.

## 공개/탐색 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/videos` | GET | 배경/영상 검색 통합 | 외부 API 의존 |
| `/api/video` | GET | `/api/videos`와 유사한 검색 | 중복 API |
| `/api/category/feed` | GET | 카테고리 피드 | DB 실패 fallback 필요 |
| `/api/category/latest` | GET | 최신 영상 | DB 실패 fallback 필요 |
| `/api/search` | GET | 마켓 검색 | 정적 데이터/DB 혼합 확인 필요 |
| `/api/leaderboard` | GET | 랭킹 | raw SQL 사용 |
| `/api/trending/rank` | GET | 트렌딩 랭킹 | DB/정적 데이터 혼합 |
| `/api/videos/flash-sale` | GET | 할인/플래시세일 | Prisma 의존 |

## 인증/회원 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/auth/find-email` | POST | 이메일 찾기 | Service Role 필요 |
| `/api/auth/forgot-password` | POST | 비밀번호 재설정 메일 | Supabase 설정 필요 |
| `/api/auth/google/start` | GET | Google OAuth 시작 | redirect 설정 확인 필요 |
| `/api/auth/sms/send` | POST | SMS 인증 발송 | rate limit 메모리 기반 |
| `/api/auth/sms/verify` | POST | SMS 인증 확인 | Twilio 설정 필요 |
| `/api/auth/tiktok/login` | GET | TikTok OAuth 시작 | 외부 설정 필요 |
| `/api/auth/tiktok/callback` | GET | TikTok OAuth 콜백 | 토큰 저장 보안 확인 필요 |
| `/api/auth/tiktok/logout` | GET | TikTok 로그아웃 | 세션 삭제 확인 필요 |
| `/auth/callback` | GET | Supabase OAuth 콜백 | fallback key 제거 검토 |

## 판매자 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/sell/upload` | POST | 판매자 영상 업로드 | 핵심 API, 인증/Storage/DB 모두 의존 |
| `/api/sell/my-videos` | GET | 내 판매 영상 | 토큰 확인 필요 |
| `/api/sell/video/[id]` | GET | 내 영상 상세 | 소유권 확인 있음 |
| `/api/sell/video/[id]` | PATCH | 내 영상 수정 | 소유권 확인 있음, 더 정리 필요 |
| `/api/sell/video/[id]` | DELETE | 내 영상 삭제 | 소유권 확인 있음 |
| `/api/seller/videos` | GET | 판매자 영상 목록 | 공개/내부 목적 구분 필요 |
| `/api/sellers/feed-profile` | GET/PATCH | 판매자 프로필 | Service Role 의존 |
| `/api/sellers/social-links` | GET | 판매자 소셜 링크 | Service Role 의존 |

## 사용자 활동 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/video/likes` | GET/POST/DELETE | 좋아요/위시리스트 | Supabase timeout fallback |
| `/api/reviews/[videoId]` | GET/POST | 리뷰 목록/작성 | 구매 여부 검증 미흡 |
| `/api/mypage/seller-analytics` | GET | 판매자 분석 | 실제 판매 데이터 모델 필요 |
| `/api/mypage/seller-analytics/video/[videoId]` | GET | 영상별 분석 | 소유권 확인 있음 |
| `/api/notifications` | GET | 판매자 알림 | query sellerId 기반, 보강 필요 |
| `/api/notifications/[id]/accept` | POST | 가격 제안 수락 | body sellerId 기반, 보강 필요 |

## AI/영상 생성 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/reels/generate` | POST/GET | AI 생성 Job 생성/조회 | Job이 메모리 저장 |
| `/api/transform` | POST | Replicate 변환 | 외부 API 비용/실패 처리 필요 |
| `/api/preview/video-background-composite` | POST | 배경 합성 미리보기 | Replicate 의존 |
| `/api/background-image` | POST | Gemini 배경 이미지 | Gemini 모델/키 의존 |
| `/api/fuse-dna` | POST | 이미지 합성 | Gemini 의존 |
| `/api/generate-angles` | POST | 각도 이미지 생성 | Gemini 의존 |
| `/api/kling/motion-control` | POST | Kling 모션 제어 | 로컬 JSON 저장 |
| `/api/kling/history` | GET | Kling 작업 히스토리 | 파일 저장 기반 |
| `/api/kling/task/[taskId]` | GET | Kling 작업 조회 | 외부 API 의존 |

## 운영/관리 API

| API | Method | 역할 | 현재 위험 |
| --- | --- | --- | --- |
| `/api/cron/scan-stale` | GET | 오래된 판매글 가격 제안 | CRON_SECRET 필요 |
| `/api/notices` | GET/POST | 공지 목록/작성 | 작성 권한 확인 필요 |
| `/api/support` | POST | 고객지원 요청 | 저장/알림 정책 필요 |
| `/api/analytics/behavior` | GET/POST | 행동 이벤트 | 메모리 저장 |

## 다음 정리 대상

1. `/api/video`와 `/api/videos` 중복 정리
2. 판매자 API 인증 방식 통일
3. 알림 API에서 `sellerId` body/query 의존 제거
4. 리뷰 작성 전 구매 기록 확인
5. AI Job 메모리 저장 제거
6. Admin API namespace 추가: `/api/admin/*`
