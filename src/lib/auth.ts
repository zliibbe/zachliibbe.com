import { getServerSession } from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { kv } from "@vercel/kv";

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(kv),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Restrict to single user (zliibbe@gmail.com)
      const allowedEmail = "zliibbe@gmail.com";

      if (user.email === allowedEmail) {
        return true;
      }

      return false;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 180 * 60, // 180 minutes as per PRD
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
