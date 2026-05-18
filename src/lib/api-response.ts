// API 공통 응답 형식을 정의하는 유틸리티
// 명세서(docs/api_specification.md)의 1.1 기본 응답 형식을 준수함

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * 성공 응답을 생성하는 헬퍼 함수
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 에러 응답을 생성하는 헬퍼 함수
 */
export function errorResponse(code: string, message: string): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
