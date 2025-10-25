import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "marklee";

export async function GET(req, context) {
  const params = await context.params;
  const method = params.method;
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");
  const dirPath = searchParams.get("dirPath");

  if (method === "readtextfile") {
    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const content = await data.text();
    return NextResponse.json({ content, error: null });
  }

  if (method === "readdir") {
    if (!dirPath) {
      return NextResponse.json({ error: "Missing dirPath" }, { status: 400 });
    }
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(dirPath);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown method" }, { status: 400 });
}

export async function POST(req, context) {
  const params = await context.params;
  const method = params.method;
  const body = await req.json();

  if (method === "writetextfile") {
    const { filePath, content } = body;
    if (!filePath || typeof content !== "string") {
      console.error("writetextfile: Missing filePath or content", { filePath, content });
      return NextResponse.json({ error: "Missing filePath or content", filePath, content }, { status: 400 });
    }
    try {
      const uploadBuffer = Buffer.from(content, "utf8");
      console.log("writetextfile: uploading", { filePath, contentLength: uploadBuffer.length });
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, uploadBuffer, { upsert: true, contentType: "text/plain" });
      console.log("writetextfile: supabase response", { data, error });
      if (error) {
        let rlsHint = undefined;
        if (
          error.message?.toLowerCase().includes("row-level security") ||
          error.status === 400 || error.statusCode === "403"
        ) {
          rlsHint = "Supabase Storage row-level security (RLS) is blocking this upload. Check your bucket policies in Supabase dashboard.";
        }
        console.error("writetextfile: upload error", error, rlsHint);
        return NextResponse.json({ error: error.message, supabaseError: error, rlsHint }, { status: 500 });
      }
      return NextResponse.json({ error: null, data });
    } catch (err) {
      console.error("writetextfile: unexpected error", err);
      return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
  }

  if (method === "rename") {
    const { oldPath, newPath } = body;
    if (!oldPath || !newPath) {
      return NextResponse.json({ error: "Missing oldPath or newPath" }, { status: 400 });
    }
    const { error: copyError } = await supabase.storage
      .from(BUCKET_NAME)
      .copy(oldPath, newPath);
    if (copyError) {
      return NextResponse.json({ error: copyError.message }, { status: 500 });
    }
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldPath]);
    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }
    return NextResponse.json({ error: null });
  }

  return NextResponse.json({ error: "Unknown method" }, { status: 400 });
}
