import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const authOptions = {
  providers: [
    Keycloak({
      issuer: process.env.KEYCLOAK_ISSUER,     // e.g. http://localhost:8080/realms/myrealm
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      // No clientSecret for public PKCE clients in dev
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      // First login: copy email/name from ID token/profile
      if (profile) {
        if (typeof profile.email === "string") token.email = profile.email;
        if (typeof profile.preferred_username === "string") {
          token.preferred_username = profile.preferred_username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email) session.user.email = token.email as string;
      if (token?.preferred_username) {
        (session.user as any).username = token.preferred_username as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
