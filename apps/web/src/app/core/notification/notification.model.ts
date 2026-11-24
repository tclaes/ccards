export interface Notification {
  readonly id: number;
  readonly message: string;
  readonly severity: 'error' | 'success';
}
