'use client';

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import { buildFileTreeRecursive } from "@/lib/fileTree";
import { writeTextFile } from '@/lib/fsUtils';
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load preferences from localStorage
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem('marklee-showSidebar');
      return stored === null ? true : stored === "true";
    }
    return true;
  });
  const [isPreviewGlobal, setIsPreviewGlobal] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem('marklee-isPreviewGlobal');
      return stored === null ? true : stored === "true";
    }
    return true;
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [fontSizeTrigger, setFontSizeTrigger] = useState(0); // Trigger for re-rendering Editor
  const [globalFontSize, setGlobalFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return parseFloat(localStorage.getItem("marklee-fontSize")) || 1;
    }
    return 1;
  });

  // Load saved folder on app start
  useEffect(() => {
    if (session) {
      loadFolder(session.user._id);
    }

  }, [session]);

  // Persist showSidebar and isPreviewGlobal changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('marklee-showSidebar', showSidebar);
    }
  }, [showSidebar]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('marklee-isPreviewGlobal', isPreviewGlobal);
    }
  }, [isPreviewGlobal]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("marklee-fontSize", globalFontSize);
    }
  }, [globalFontSize]);

  const loadFolder = async (folderPath) => {
    try {
      const fileTree = await buildFileTreeRecursive(folderPath);
      setFiles(fileTree);
      setCurrentFolder(folderPath); // This sets currentFolder
      if (typeof window !== "undefined") {
        localStorage.setItem('marklee-folder', folderPath);
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      // Clear invalid folder from localStorage
      localStorage.removeItem('marklee-folder');
      setCurrentFolder(null); // This sets currentFolder to null on error
      setFiles([]);
    }
  };

  const openFolder = async () => {
    try {
      const selected = await openFolderDialog({
        directory: true,
        multiple: false,
        title: 'Select Notes Folder',
        defaultPath: currentFolder || undefined
      });

      if (selected) {
        await loadFolder(selected);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const newFile = async () => {
    let folder;
    if (typeof window !== "undefined") {
      folder = localStorage.getItem('marklee-folder');
    }
    if (!folder) return;
    // Generate a unique filename
    let baseName = "untitled.md";
    let name = baseName;
    let idx = 1;
    const existingNames = new Set(files.map(f => f.name));
    while (existingNames.has(name)) {
      name = `untitled-${idx}.md`;
      idx++;
    }
    const newPath = `${folder}/${name}`;
    console.log(newPath);

    try {
      await writeTextFile(newPath, "");
      await loadFolder(folder);
      setSelectedFile({ name, path: newPath, type: "file", extension: "md" });
    } catch (err) {
      alert("Failed to create file: " + err);
    }
  };

  // Helper to generate a hash for a file path
  function hashFilePath(path) {
    // Simple hash: base64 encode the path
    return btoa(encodeURIComponent(path));
  }

  // Helper to decode hash from query string
  function decodeHash(hash) {
    try {
      return decodeURIComponent(atob(hash));
    } catch {
      return null;
    }
  }

  // Helper to recursively find a file by path in a nested file tree
  function findFileByPath(files, filePath) {
    for (const file of files) {
      if (file.path === filePath) return file;
      if (file.children && file.children.length > 0) {
        const found = findFileByPath(file.children, filePath);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to recursively find a file by path in a nested file tree and return its parent folders
  function findFileAndParents(files, filePath, parents = []) {
    for (const file of files) {
      if (file.path === filePath) return { file, parents };
      if (file.children && file.children.length > 0) {
        const result = findFileAndParents(file.children, filePath, [...parents, file]);
        if (result) return result;
      }
    }
    return null;
  }

  // Select file by hash from query string on mount or files change
  useEffect(() => {
    const fileHash = searchParams.get("file");
    if (fileHash && files.length > 0) {
      const filePath = decodeHash(fileHash);
      const result = findFileAndParents(files, filePath);
      if (result) {
        handleFileSelect(result.file);
        // Optionally, pass opened folders to Sidebar via prop or context
        // For example: setOpenedFolders(result.parents.map(f => f.path));
      }
    }
  }, [files, searchParams]);

  // Update query string when selecting a file
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (file && file.path) {
      const hash = hashFilePath(file.path);
      router.replace(`?file=${hash}`);
    }
  };

  // Add a reload handler
  const handleReload = () => {
    if (currentFolder) {
      loadFolder(currentFolder);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white">
      {showSidebar && (
        <Sidebar 
          width={sidebarWidth}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          files={files}
          currentFolder={currentFolder}
          onOpenFolder={openFolder}
          onReload={handleReload}
        />
      )}
      <div className="flex-1 overflow-hidden">
        <Editor 
          file={selectedFile}
          onFileChange={setSelectedFile}
          isPreviewGlobal={isPreviewGlobal}
          setIsPreviewGlobal={setIsPreviewGlobal}
          fontSize={globalFontSize} // Pass globalFontSize to Editor
          key={fontSizeTrigger} // Force re-render when fontSizeTrigger changes
        />
      </div>
    </div>
  );
}