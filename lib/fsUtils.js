/**
 * Reads the content of a file.
 * @param {string} filePath - The path of the file to read.
 * @returns {Promise<string>} - The content of the file.
 */
export const readTextFile = async (filePath) => {
  const res = await fetch(`/api/fs/readtextfile?filePath=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error("Failed to read file");
  const { content, error } = await res.json();
  if (error) throw new Error(error);
  return content;
};

/**
 * Writes content to a file.
 * @param {string} filePath - The path of the file to write.
 * @param {string} content - The content to write to the file.
 * @returns {Promise<void>}
 */
export const writeTextFile = async (filePath, content) => {
  const res = await fetch("/api/fs/writetextfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath, content }),
  });
  if (!res.ok) throw new Error("Failed to write file");
  const { error } = await res.json();
  if (error) throw new Error(error);
};

/**
 * Renames a file or folder.
 * @param {string} oldPath - The current path of the file or folder.
 * @param {string} newPath - The new path of the file or folder.
 * @returns {Promise<void>}
 */
export const rename = async (oldPath, newPath) => {
  const res = await fetch("/api/fs/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPath, newPath }),
  });
  if (!res.ok) throw new Error("Failed to rename");
  const { error } = await res.json();
  if (error) throw new Error(error);
};

/**
 * Reads the contents of a directory from an API endpoint.
 * @param {string} dirPath - The path of the directory to read.
 * @returns {Promise<Array>} - The contents of the directory.
 */
export const readDir = async (dirPath) => {
  const res = await fetch(`/api/fs/readdir?dirPath=${encodeURIComponent(dirPath)}`);
  if (!res.ok) throw new Error("Failed to read directory");

  const r = await res.json();

  const mapped = r.map(d => {
    if (!d.metadata) {
      d.isDirectory = true;
    } else {
      d.isFile = true;
    }
    return d;
  })

  return r;
};

/**
 * Converts a file path to a Supabase public file URL.
 * @param {string} path - The path of the file to convert.
 * @returns {string} - The public file URL.
 */
export function convertFileSrc(path) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const BUCKET_NAME = "marklee";
  // Remove leading slash if present
  const cleanPath = path.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}