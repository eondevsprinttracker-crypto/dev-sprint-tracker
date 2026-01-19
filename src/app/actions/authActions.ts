"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

interface GoogleAuthData {
    email: string;
    name: string;
    googleId: string;
    photoURL?: string;
}

// PM Login with email/password
export async function loginPM(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", {
            email,
            password,
            authType: "pm", // Flag to indicate PM auth
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password" };
                default:
                    return { success: false, error: "Something went wrong" };
            }
        }
        throw error;
    }
}

// Developer login with Google
export async function loginWithGoogle(data: GoogleAuthData) {
    try {
        await dbConnect();

        // Find existing user by email or googleId
        let user = await User.findOne({
            $or: [{ email: data.email }, { googleId: data.googleId }],
        });

        if (!user) {
            return { success: false, error: "No account found. Please register first." };
        }

        // Update googleId if not set (for migrating existing users)
        if (!user.googleId) {
            user.googleId = data.googleId;
            if (data.photoURL) user.photoURL = data.photoURL;
            await user.save();
        }

        // Create NextAuth session
        await signIn("credentials", {
            email: user.email,
            googleId: user.googleId,
            authType: "google",
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        console.error("Google login error:", error);
        return { success: false, error: "Failed to sign in" };
    }
}

// Developer registration with Google
export async function registerWithGoogle(data: GoogleAuthData) {
    try {
        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: data.email }, { googleId: data.googleId }],
        });

        if (existingUser) {
            // User exists - just sign them in
            await signIn("credentials", {
                email: existingUser.email,
                googleId: existingUser.googleId,
                authType: "google",
                redirect: false,
            });
            return { success: true };
        }

        // Create new user as Developer (mandatory role)
        const newUser = await User.create({
            name: data.name,
            email: data.email,
            googleId: data.googleId,
            photoURL: data.photoURL,
            role: "Developer", // Always Developer for Google sign-up
        });

        // Create NextAuth session
        await signIn("credentials", {
            email: newUser.email,
            googleId: newUser.googleId,
            authType: "google",
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        console.error("Google registration error:", error);
        return { success: false, error: "Failed to create account" };
    }
}

export async function logout() {
    await signOut({ redirectTo: "/login" });
}
