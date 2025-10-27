export interface TemplateOption {
  id: string;
  label: string;
}

export type ExecuteTemplateFailureReason =
  | 'hard-limit-exceeded'
  | 'not-found'
  | string;

export interface ExecuteTemplateResponse {
  success: boolean;
  reason?: ExecuteTemplateFailureReason;
}
