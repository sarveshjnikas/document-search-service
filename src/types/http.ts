export interface ApiErrorBody {
  error: true;
  message: string;
  details?: string;
}

export interface ApiSuccessBody<T> {
  error: false;
  data: T;
}
