'use client';

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import { buildFileTreeRecursive } from "@/lib/fileTree";
import { writeTextFile } from '@/lib/fsUtils';
import { useSession } from "next-auth/react";

export default function App() {
  const { data: session, status } = useSession();

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

  useEffect(() => {
    // Listen for menu events
  }, []);

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
          onFileSelect={setSelectedFile}
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