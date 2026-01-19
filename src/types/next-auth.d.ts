import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role: "PM" | "Developer";
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: "PM" | "Developer";
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "PM" | "Developer";
    }
}
