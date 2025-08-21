"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div>
      <h1>Portfolio SaaS (Dev)</h1>
      {status === "authenticated" ? (
        <div>
          <p>Signed in as {session.user?.email ?? "(no email)"}.</p>
          <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          <p><a href="/protected">Go to protected page</a></p>
        </div>
      ) : (
        <div>
          <p>You are not signed in.</p>
          <button onClick={() => signIn("keycloak", { callbackUrl: "/protected" })}>
            Sign in with Keycloak
          </button>
        </div>
      )}
    </div>
  );
}
