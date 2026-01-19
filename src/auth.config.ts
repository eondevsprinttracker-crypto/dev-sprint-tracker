import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");
            const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

            if (isAuthRoute && isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            if (isProtectedRoute && !isLoggedIn) {
                return Response.redirect(new URL("/login", nextUrl));
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "PM" | "Developer";
            }
            return session;
        },
    },
    providers: [], // Providers are added in auth.ts (not Edge-compatible)
    session: {
        strategy: "jwt",
    },
};
