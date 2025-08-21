import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      issuer: process.env.KEYCLOAK_ISSUER as string,
      clientId: process.env.KEYCLOAK_CLIENT_ID as string,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      // First login: copy email/name from ID token/profile
      if (profile) {
        if (typeof profile.email === "string") token.email = profile.email;
        const preferredUsername = (profile as any).preferred_username;
        if (typeof preferredUsername === "string") {
          token.preferred_username = preferredUsername;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user ?? {};
      if (token?.email) session.user.email = token.email as string;
      if (token?.preferred_username) {
        (session.user as any).username = token.preferred_username as string;
      }
      return session;
    },
  },
};

export function getSessionServer() {
  return getServerSession(authOptions);
}
