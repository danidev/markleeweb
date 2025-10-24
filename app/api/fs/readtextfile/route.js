import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "marklee"; // <-- set your bucket name here

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");
  if (!filePath) {
    return new Response(JSON.stringify({ error: "Missing filePath" }), { status: 400 });
  }

  // Download file from bucket
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Read as text
  const text = await data.text();
  return new Response(JSON.stringify({ content: text }), { status: 200 });
}
