// 프론트엔드와 백엔드에서 공통으로 사용하는 에러 코드 및 메시지 정의
export const ERROR_CODES = {
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  DUPLICATE_USERNAME: "DUPLICATE_USERNAME",
  DUPLICATE_NICKNAME: "DUPLICATE_NICKNAME",
  UNAUTHORIZED: "UNAUTHORIZED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.MISSING_FIELDS]: "필수 입력 항목을 모두 작성해주세요.",
  [ERROR_CODES.INVALID_CREDENTIALS]: "아이디 혹은 비밀번호가 틀립니다.",
  [ERROR_CODES.DUPLICATE_USERNAME]: "이미 사용 중인 아이디입니다.",
  [ERROR_CODES.DUPLICATE_NICKNAME]: "이미 사용 중인 닉네임입니다.",
  [ERROR_CODES.UNAUTHORIZED]: "로그인이 필요합니다.",
  [ERROR_CODES.USER_NOT_FOUND]: "사용자를 찾을 수 없습니다.",
  [ERROR_CODES.INVALID_PASSWORD]: "기존 비밀번호가 일치하지 않습니다.",
  [ERROR_CODES.SERVER_ERROR]: "서버에 일시적인 문제가 발생했습니다.",
};
