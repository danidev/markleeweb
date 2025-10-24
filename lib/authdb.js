import { supabase } from "./supabase";

const AUTH_SERVICE = process.env.AUTH_SERVICE || "supabase";

// Supabase implementation
async function supabaseGetUserByEmail(email) {
  if (typeof window !== "undefined") throw new Error("Supabase calls must be server-side.");
  const r = await supabase.from("users").select().eq("email", email);
  if (r.data && r.data.length === 1) return r.data[0];
  return null;
}

async function supabaseRegisterUser(user) {
  if (typeof window !== "undefined") throw new Error("Supabase calls must be server-side.");
  return await supabase.from("users").insert(user);
}

async function supabaseUpdateUser(id, data) {
  if (typeof window !== "undefined") throw new Error("Supabase calls must be server-side.");
  return await supabase.from("users").update(data).eq("_id", id);
}

// Auth API implementation (example)
async function apiGetUserByEmail(email) {
  const res = await fetch(`${process.env.AUTH_API_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function apiRegisterUser(user) {
  const res = await fetch(`${process.env.AUTH_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return await res.json();
}

async function apiUpdateUser(id, data) {
  const res = await fetch(`${process.env.AUTH_API_URL}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  return await res.json();
}

// Unified interface
export async function getUserByEmail(email) {
  if (AUTH_SERVICE === "supabase") return await supabaseGetUserByEmail(email);
  if (AUTH_SERVICE === "authapi") return await apiGetUserByEmail(email);
  throw new Error("AUTH_SERVICE not supported");
}

export async function registerUser(user) {
  if (AUTH_SERVICE === "supabase") return await supabaseRegisterUser(user);
  if (AUTH_SERVICE === "authapi") return await apiRegisterUser(user);
  throw new Error("AUTH_SERVICE not supported");
}

export async function updateUser(id, data) {
  if (AUTH_SERVICE === "supabase") return await supabaseUpdateUser(id, data);
  if (AUTH_SERVICE === "authapi") return await apiUpdateUser(id, data);
  throw new Error("AUTH_SERVICE not supported");
}
