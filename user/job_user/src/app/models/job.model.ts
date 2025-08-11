export class Job {
    id: number;
    employerId: number;
    experienceId: number;
    locationId: number;
    worktypeId: number;
    categoryId: number;
    categoryName: string;
    employerName: string;
    experienceName: string;
    locationName: string;
    worktypeName: string;
    title: string;
    description: string;
    descriptionJson: {
        job_description: {
          overview: string;
          responsibilities: string[];
        };
        benefits: {
          bonus: string;
          additional_benefits: string[];
        };
        work_hours: string;
    };
    required: string;
    address: string;
    salary: string;
    status: boolean;
    postedAt: string;
    postedExpired: string;
    requiredSkills: string;
    member: string;
    checkFavorited: boolean;
    employerLogo: string;
    applicantCount: number;
    required_skills: string;
    posted_expired: string;
}
export class Location{
    id: number;
    name: string;
    status: boolean;
}
export class Experience{
    id: number;
    name: string;
    status: boolean;
}
export class Worktype{
    id: number;
    name: string;
    status: boolean;
}

export class Category {
    id: number;
    categoryName: string;
    subcategoryName: string;
    status: boolean;
}

export class Review {
    id: number;
    seekerId: number;
    employerId: number;
    rating: number;
    satisfied: boolean;
    goodMessage: string;
    reason: string;
    improve: string;
    createAt: string;
    status: boolean;
}

export class JobMatch {
    id: number;
    cvId: number;
    seekerId: number;
    matchedSkill: string;
    accuracy: number;
    label: string;
    timeMatched: string;
    jobId: number;
    employerId: number;
    experienceId: number;
    locationId: number;
    worktypeId: number;
    categoryId: number;
    categoryName: string;
    employerName: string;
    experienceName: string;
    locationName: string;
    worktypeName: string;
    title: string;
    description: string;
    required: string;
    address: string;
    salary: string;
    status: boolean;
    postedAt: string;
    postedExpired: string;
    requiredSkills: string;
    member: string;
    checkFavorited: boolean;
    employerLogo: string;
}

export class Follow {
    id: number;
    seekerId: number;
    employerId: number;
    employerName: string;
    seekerName: string;
    address: string;
    logo: string;
    status: boolean;
    created: string;
}