export interface ExecuteTemplateMessage {
  type: 'execute-template';
  templateId: string;
  text: string;
  overrides?: ExecuteTemplateOverrides;
}

export type ExecuteTemplateFailureReason =
  | 'hard-limit-exceeded'
  | 'not-found'
  | 'unexpected-error'
  | (string & {});

export interface ExecuteTemplateRuntimeOverrides {
  hintsSearch?: boolean;
  temporaryChat?: boolean;
  model?: string;
}

export interface ExecuteTemplateOverrides {
  runtime?: ExecuteTemplateRuntimeOverrides;
}

export interface ExecuteTemplateResponse {
  success: boolean;
  reason?: ExecuteTemplateFailureReason;
}

export type RuntimeMessage = ExecuteTemplateMessage;

export interface AlertMessage {
  type: 'alert';
  message: string;
}

export interface GetSelectionMessage {
  type: 'get-selection';
}

export type ContentScriptMessage = AlertMessage | GetSelectionMessage;

export interface SelectionResponsePayload {
  text?: string;
}

export type SendResponse<T = unknown> = (response: T) => void;
