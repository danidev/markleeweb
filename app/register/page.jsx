'use client';
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password !== retypePassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          password,
          registrationMethod: "credentials",
          isPaired: false,
          googleId: null,
          creationDate: new Date(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Registration successful! You can now log in.");
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setRetypePassword("");
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded shadow-md flex flex-col items-center">
        <h2 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">Register</h2>
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        <form className="flex flex-col gap-4 w-64" onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            className="px-3 py-2 rounded border"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="First Name"
            className="px-3 py-2 rounded border"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="px-3 py-2 rounded border"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
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
          <input
            type="password"
            placeholder="Retype Password"
            className="px-3 py-2 rounded border"
            value={retypePassword}
            onChange={e => setRetypePassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white dark:bg-zinc-700 dark:text-zinc-50"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <a
          href="/login"
          className="mt-4 px-4 py-2 rounded bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50 text-center w-full"
        >
          Login
        </a>
      </div>
    </div>
  );
}
