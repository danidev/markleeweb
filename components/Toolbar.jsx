'use client';

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Toolbar() {
  const { data: session } = useSession();

  // Get user info
  const user = session?.user;
  const avatar = user?.image;
  const name = user?.name || "";

  return (
    <div className="w-full px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        Marklee
      </Link>
      <div className="flex items-center">
        <Link href="/me">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-9 h-9 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-base border border-gray-300">
              {name ? name[0].toUpperCase() : "?"}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
