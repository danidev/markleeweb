import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "marklee"; // <-- set your bucket name here

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dirPath = searchParams.get("dirPath");
  if (!dirPath) {
    return new Response(JSON.stringify({ error: "Missing dirPath" }), { status: 400 });
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(dirPath);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}