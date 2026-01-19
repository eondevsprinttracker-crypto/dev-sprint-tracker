import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                googleId: { label: "Google ID", type: "text" },
                authType: { label: "Auth Type", type: "text" },
            },
            async authorize(credentials) {
                const authType = credentials?.authType as string;

                await dbConnect();

                // Google authentication for developers
                if (authType === "google") {
                    if (!credentials?.email || !credentials?.googleId) {
                        throw new Error("Email and Google ID are required");
                    }

                    const user = await User.findOne({
                        email: credentials.email,
                        googleId: credentials.googleId
                    });

                    if (!user) {
                        throw new Error("User not found");
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        image: user.photoURL,
                    };
                }

                // PM authentication with email/password
                if (authType === "pm") {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error("Email and password are required");
                    }

                    const user = await User.findOne({
                        email: credentials.email,
                        role: "PM"
                    }).select("+password");

                    if (!user) {
                        throw new Error("Invalid email or password");
                    }

                    if (!user.password) {
                        throw new Error("Invalid email or password");
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password");
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                }

                throw new Error("Invalid authentication type");
            },
        }),
    ],
});
