'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error === "CredentialsSignin") {
        setError("User not found or invalid credentials.");
      } else if (res?.error) {
        setError(res.error);
      } else {
        setError("");
      }
    } catch(err) {
      setError("An unexpected error occurred.");
      console.log(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded shadow-md flex flex-col items-center">
        {session ? (
          <>
            <p className="mb-4 text-zinc-800 dark:text-zinc-100">
              Signed in as {session.user.email}
            </p>
            <button
              className="px-4 py-2 rounded bg-black text-white dark:bg-zinc-700 dark:text-zinc-50"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-zinc-800 dark:text-zinc-100">
              You are not signed in.
            </p>
            <form className="flex flex-col gap-4 w-64" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                className="px-3 py-2 rounded border"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="px-3 py-2 rounded border"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded bg-black text-white dark:bg-zinc-700 dark:text-zinc-50"
              >
                Sign in
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
