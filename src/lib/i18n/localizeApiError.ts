import { translate } from "@/lib/i18n/dictionaries";
import type { SiteLocale } from "@/lib/sitePreferences";

/** Maps API `error` codes or known Korean messages to dictionary keys. */
const ERROR_KEY_MAP: Record<string, string> = {
  login_required: "api.err.login_required",
  invalid_session: "api.err.invalid_session",
  bad_body: "api.err.bad_body",
  not_found: "api.err.not_found",
  db_error: "api.err.db_error",
  "로그인이 필요합니다.": "api.err.loginRequired",
  "세션이 유효하지 않습니다. 다시 로그인해 주세요.": "api.err.sessionInvalid",
  "제목을 입력해 주세요.": "api.err.titleRequired",
  "카테고리를 선택해 주세요.": "api.err.categoryRequired",
  "가격은 100원 이상으로 입력해 주세요.": "api.err.priceMin",
  "동영상 파일을 올려 주세요.": "api.err.videoRequired",
  "권리·제3자 권리 확인에 모두 동의해 주세요.": "api.err.rightsRequired",
  "한정 판매일 때는 판매 가능 수량(1 이상)을 입력해 주세요.": "api.err.limitedQty",
  "요청 본문을 읽을 수 없습니다.": "api.err.readBody",
  "지원하는 형식은 MP4, MOV, WebM, AVI 계열입니다.": "api.err.videoFormat",
  "썸네일은 JPEG, PNG, WebP만 가능합니다.": "sellForm.errPosterType",
  "썸네일은 2MB 이하로 올려 주세요.": "sellForm.errPosterTooLarge",
  "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.": "api.err.smsRateLimit",
  "휴대폰 번호 형식을 확인해 주세요.": "api.err.phoneFormat",
  "인증번호 형식을 확인해 주세요.": "api.err.smsCodeFormat",
  "인증번호가 올바르지 않거나 만료되었습니다.": "api.err.smsInvalid",
  "SMS 인증 토큰 생성에 실패했습니다.": "api.err.smsTokenFail",
  "보안을 위해 휴대폰 번호와 SMS 인증이 필요합니다.": "api.err.findEmailSmsRequired",
  "보안을 위해 휴대폰 SMS 인증을 먼저 완료해 주세요.": "api.err.findEmailSmsFirst",
  "SMS 인증이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.": "api.err.findEmailSmsExpired",
  "인증번호 발송에 실패했습니다.": "password.smsSendFail",
  "휴대폰 인증번호 발송에 실패했습니다.": "password.smsSendFail",
  "요청을 처리하지 못했습니다.": "api.err.generic",
  "네트워크 오류가 발생했습니다.": "findId.errNetwork",
  "올바른 이메일 형식을 입력해 주세요.": "forgot.errEmailFormat",
  "메일 발송에 실패했습니다.": "forgot.errMailFail",
  "일치하는 정보가 없습니다.": "findId.notFound",
};

export function localizeApiError(
  locale: SiteLocale,
  raw: string | undefined | null,
): string {
  const msg = (raw ?? "").trim();
  if (!msg) return translate(locale, "api.err.generic");
  const key = ERROR_KEY_MAP[msg];
  if (key) return translate(locale, key);
  if (locale === "en" && /[\uac00-\ud7a3]/.test(msg)) {
    return translate(locale, "api.err.generic");
  }
  return msg;
}
