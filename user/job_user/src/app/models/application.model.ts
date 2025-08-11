export class Application {
    id: number;
    seekerId: number;
    jobId: number;
    employerId: number;
    status: number;
    appliedAt: string;
    seekerName: string;
    jobTitle: string;
    workType: string; // Sửa String thành string (TypeScript dùng string)
    employerName: string;
    address: string;
    phone: string;
    avatar: string;
    experience: string;
    salary: string;
    companyName: string;
    hasTestHistory: boolean;
    testHistory: TestHistory | null; // Thêm thuộc tính testHistory
  }

export class ApplicationUpdateStatus {
    id: number;
    status: number;
}

export class TestHistory {
    id: number;
    userID: number;
    testID: number;
    score: number | null;
    contentAnswer: string | null;
    timeSubmit: string | null; // Hoặc Date nếu bạn muốn parse thành Date
  }