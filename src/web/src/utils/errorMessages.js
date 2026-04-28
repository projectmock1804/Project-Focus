/**
 * Error message translator
 * Converts technical error codes to user-friendly Korean messages
 */

export const errorCodeMap = {
  // Network errors
  'NETWORK_ERROR': '인터넷 연결을 확인해주세요',
  'TIMEOUT_ERROR': '요청 시간이 초과되었습니다. 다시 시도해주세요',

  // Server errors
  'SERVER_ERROR': '서버에 일시적 문제가 발생했습니다',
  'SERVICE_UNAVAILABLE': '서비스를 일시적으로 이용할 수 없습니다',

  // Task-related errors
  'TASK_NOT_FOUND': '작업을 찾을 수 없습니다',
  'TASK_CREATION_FAILED': '작업을 만들 수 없습니다. 다시 시도해주세요',
  'TASK_UPDATE_FAILED': '작업을 저장할 수 없습니다. 다시 시도해주세요',
  'TASK_DELETE_FAILED': '작업을 삭제할 수 없습니다. 다시 시도해주세요',
  'TASK_RESTORE_FAILED': '작업을 복구할 수 없습니다. 다시 시도해주세요',

  // Validation errors
  'VALIDATION_ERROR': '입력값을 확인해주세요',
  'INVALID_TITLE': '작업 제목을 입력해주세요',
  'INVALID_DEADLINE': '유효한 마감일을 선택해주세요',
  'INVALID_OUTPUT': '결과물 설명을 입력해주세요',

  // Parsing/AI errors
  'PARSE_ERROR': 'AI가 작업을 분석하지 못했습니다. 다시 시도해주세요',
  'ESTIMATE_ERROR': '작업 예상치를 계산할 수 없습니다',
  'QUOTE_ERROR': '명언을 불러올 수 없습니다',

  // Form errors
  'FORM_SUBMISSION_FAILED': '양식 제출에 실패했습니다. 다시 시도해주세요',
  'FORM_VALIDATION_FAILED': '양식의 필수 항목을 확인해주세요',

  // Session/Auth errors
  'SESSION_EXPIRED': '세션이 만료되었습니다. 다시 시작해주세요',
  'UNAUTHORIZED': '권한이 없습니다',

  // Generic fallback
  'UNKNOWN_ERROR': '알 수 없는 오류가 발생했습니다. 다시 시도해주세요',
};

/**
 * Translate HTTP status code to error message
 */
export const httpStatusMap = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'UNAUTHORIZED',
  404: 'TASK_NOT_FOUND',
  408: 'TIMEOUT_ERROR',
  429: 'TOO_MANY_REQUESTS',
  500: 'SERVER_ERROR',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
  504: 'TIMEOUT_ERROR',
};

/**
 * Parse error from various sources and return user-friendly message
 */
export function getUserFriendlyErrorMessage(error) {
  // If it's already an error code in our map
  if (typeof error === 'string' && errorCodeMap[error]) {
    return errorCodeMap[error];
  }

  // If it's an object with an HTTP status
  if (error?.status && httpStatusMap[error.status]) {
    const code = httpStatusMap[error.status];
    return errorCodeMap[code] || errorCodeMap.UNKNOWN_ERROR;
  }

  // If it's a Response object from fetch
  if (error?.status) {
    const code = httpStatusMap[error.status] || 'SERVER_ERROR';
    return errorCodeMap[code];
  }

  // If it has an error property
  if (error?.error) {
    // Try to find it in the map
    const msg = error.error.toUpperCase().replace(/\s+/g, '_');
    if (errorCodeMap[msg]) {
      return errorCodeMap[msg];
    }
    // Otherwise, for known patterns, map them
    if (error.error.includes('not found') || error.error.includes('not exist')) {
      return errorCodeMap.TASK_NOT_FOUND;
    }
    if (error.error.includes('validation') || error.error.includes('required')) {
      return errorCodeMap.VALIDATION_ERROR;
    }
  }

  // If it's a network error (TypeError from fetch)
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      return errorCodeMap.NETWORK_ERROR;
    }
  }

  // If it's already a human-readable message and reasonably short, use it
  if (typeof error === 'string' && error.length < 100) {
    return error;
  }

  // Last resort
  return errorCodeMap.UNKNOWN_ERROR;
}

/**
 * Classify error type for different handling
 */
export function getErrorType(error) {
  if (error instanceof TypeError) {
    return 'network';
  }
  if (error?.status === 404) {
    return 'not_found';
  }
  if (error?.status >= 400 && error?.status < 500) {
    return 'client_error';
  }
  if (error?.status >= 500) {
    return 'server_error';
  }
  return 'unknown';
}
