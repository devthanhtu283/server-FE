export class User {
    id: number;
    username: string;
    password: string;
    userType: number;
    email: string;
    created: string;
    status: number;
    securityCode: string;
}

export class CreateUser {
    username: string;
    password: string;
    userType: number;
    email: string;
    created: string;
    status: number;
    securityCode: string;
}

export class UserUpdatePassword {
    password: string;
}


export class Employee {
    id: number;
    userId: number;
    companyName: string;
    companyProfile: string;
    rating: number;
    contactInfo: string;
    logo: string;
    coverImg: string;
    teamMember: number
    address: string;
    mapLink: string;
    amount: number;
    status: number;
    description: string;
    foundedIn: string;
    companyField: string;
    companyLink: string;
}

export class Seeker {
    id: number;
    fullName: string;
    phone: string;
    address: string;
    dob: string;
    status: number;
    updatedAt: string;
    gender: string;
    avatar: string;
}

export class Chat {
    id: number;
    senderId: number;
    receiverId: number;
    senderRole: string;
    receiverRole: string;
    message: string;
    created: string;
}