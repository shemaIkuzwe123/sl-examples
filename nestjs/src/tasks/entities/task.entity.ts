export enum TaskStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Done = 'done',
}

export class Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}
