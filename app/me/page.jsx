'use client';

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function MePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return <div className="p-8 text-red-500">Not signed in.</div>;
  }

  const user = session.user;

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow">
      <div className="flex flex-col items-center">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover border border-gray-300 mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-3xl border border-gray-300 mb-4">
            {user.name ? user.name[0].toUpperCase() : "?"}
          </div>
        )}
        <h2 className="text-xl font-bold mb-2">{user.name}</h2>
        <p className="text-gray-600">{user.email}</p>
        <button
          onClick={() => signOut()}
          className="mt-6 px-4 py-2 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
