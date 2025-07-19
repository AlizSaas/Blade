import { $Enums, UserRole } from "@/generated/prisma";

export type Code = {
    id: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    used: boolean;
    companyId: string | null;
};

export type CodesResponse = {
    codes: Code[];
    nextCursor: string | null;
};



export type UsersResponse = {
    users: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clerkId: string;
        firstname: string;
        lastname: string | null;
        email: string;
        image: string | null;
        role: $Enums.UserRole;
        companyId: string;
    }[];
    nextCursor: string | null;
};

export type BikeRequestResponse = {
    bikeRequests: ({
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            clerkId: string;
            firstname: string;
            lastname: string | null;
            email: string;
            image: string | null;
            role: $Enums.UserRole;
           
             company: {
            id: string;
            name: string;
            logo: string | null;
            website: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        };
        seller: {
            firstname: string;
            lastname: string | null;
            email: string;
            companyId: string;
            companyName: string;

        };
        status: $Enums.BikeStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        buyerId: string;
        sellerId: string;
        url: string;
        bikeModel: string;
        reason: string;
        notes?: string;
    })[];
    nextCursor: string | null;
};

export type BikeRequest = ({
    buyer: {
        company: {
            id: string;
            name: string;
            logo: string | null;
            website: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        image: string | null;
        role: $Enums.UserRole;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        clerkId: string;
        firstname: string;
        lastname: string | null;
        companyId: string;
    };
    seller: {
        id: string;
        image: string | null;
        role: $Enums.UserRole;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        clerkId: string;
        firstname: string;
        lastname: string | null;
        companyId: string;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    buyerId: string;
    sellerId: string;
    url: string;
    bikeModel: string;
    reason: string;
    notes?: string;
    status: $Enums.BikeStatus;
}) | null;

export type IndividualBikeRequest = BikeRequestResponse["bikeRequests"][0]


export type BikeRequestWithRelations = {
  id: string
  createdAt: Date
  updatedAt: Date
  status: "PENDING" | "APPROVED" | "REJECTED"
  bikeModel: string
  reason: string
  notes?: string | null
  url?: string | null
  buyer: {
    id: string
    createdAt: Date
    updatedAt: Date
    clerkId: string
    firstname: string
    lastname: string | null
    email: string
    image: string | null
    role: UserRole
    companyId: string
    company: {
      name: string
      id: string
      logo: string | null
      website: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
  seller: {
    id: string
    createdAt: Date
    updatedAt: Date
    clerkId: string
    firstname: string
    lastname: string | null
    email: string
    image: string | null
    role: UserRole
    companyId: string
  }
}