export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  pagination: Pagination | null;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
  };
}

export class ApiResponse {
  static success<T>(
    data: T,
    message = 'Success',
    pagination: Pagination | null = null,
  ): SuccessResponse<T> {
    return { success: true, data, message, pagination };
  }

  static error(code: string, message: string, details: ErrorDetail[] = []): ErrorResponse {
    return { success: false, error: { code, message, details } };
  }

  static paginated<T>(
    data: T,
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ): SuccessResponse<T> {
    const totalPages = Math.ceil(total / limit);
    return ApiResponse.success(data, message, { page, limit, total, totalPages });
  }
}
