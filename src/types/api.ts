export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface EmailResponse {
  messageId: string;
  status: 'sent' | 'failed';
} 