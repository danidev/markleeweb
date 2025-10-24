import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, password, registrationMethod, isPaired, googleId, creationDate } = body;

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select()
      .eq("email", email);

    if (existingError) {
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        _id: crypto.randomUUID(), // use a valid UUID
        email,
        firstName,
        lastName,
        password: hashedPassword,
        registrationMethod: registrationMethod || "credentials",
        isPaired: isPaired ?? false,
        googleId: googleId ?? null,
        creationDate: creationDate ? new Date(creationDate) : new Date(),
        role: "user",
        emailVerified: false,
      });

    if (insertError) {
      console.log(insertError);
      return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
