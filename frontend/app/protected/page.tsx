import { getSessionServer } from "@/lib/auth";
import Link from "next/link";

export default async function ProtectedPage() {
  const session = await getSessionServer();

  return (
    <div>
      <h1>Protected</h1>
      {session ? (
        <>
          <p>Email: <strong>{session.user?.email ?? "(none in token)"}</strong></p>
          <p><Link href="/">Back</Link></p>
        </>
      ) : (
        // If middleware is configured, unauthenticated users are redirected
        <p>Redirecting to login…</p>
      )}
    </div>
  );
}
