export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  type: string;
  jobId: number;
}

export interface ApiResponse {
  status: boolean;
  message: string;
  data: Notification[];
}