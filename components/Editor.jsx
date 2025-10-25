import { useState, useEffect } from "react";
import { readTextFile, writeTextFile, convertFileSrc } from '../lib/fsUtils';
import { marked } from "marked";

function Editor({ file, fontSize, isPreviewGlobal, setIsPreviewGlobal }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [isEdited, setIsEdited] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (file && file.path) {
      setContent(""); // Clear content immediately to avoid flicker
      setIsLoading(true); // Set loading state immediately
      if (isImageFile(file)) {
        let imagePath = file.path.replace(/^\/+/, "");
        setImageSrc(convertFileSrc(imagePath));
        setIsLoading(false);
      } else {
        setImageSrc(null);
        loadFileContent(file.path);
      }
    } else {
      setContent("");
      setImageSrc(null);
    }
    setIsEdited(false);
  }, [file]);

  // Customize the marked renderer to handle image paths
  const renderer = new marked.Renderer();
  renderer.image = (href, title, text) => {
    const altText = text || "Image";
    const imageTitle = title || "";

    // Resolve relative image path against the current file's directory
    let imagePath = href.href || href;
    if (file && file.path) {
      const fileDir = file.path.replace(/\/[^/]+$/, "/");
      if (!imagePath.startsWith("/")) {
        imagePath = fileDir + imagePath;
      }
    }
    // Remove leading slash if present
    imagePath = imagePath.replace(/^\/+/, "");

    const publicUrl = convertFileSrc(imagePath);
    return `<img src="${publicUrl}" alt="${altText}" title="${imageTitle}" />`;
  };

  // Use the customized renderer
  const renderMarkdown = (markdown) => {
    return marked.parse(markdown, { renderer });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        if (file && !isImageFile(file)) {
          setIsPreviewGlobal(prev => !prev);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [file]);

  const isImageFile = (file) => {
    return file && ['png', 'jpg', 'jpeg'].includes(file.extension);
  };

  const loadFileContent = async (filePath) => {
    console.log('loadFileContent');
    try {
      setIsLoading(true);
      const fileContent = await readTextFile(filePath);
      setContent(fileContent);
      setOriginalContent(fileContent);
    } catch (error) {
      setContent("Error loading file: " + error.message);
      setOriginalContent("Error loading file: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsEdited(e.target.value !== originalContent);
  };

  const handleSave = async () => {
    if (!file || !file.path) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      await writeTextFile(file.path, content);
      await loadFileContent(file.path); // <-- reload from storage after save
      setIsEdited(false);
      setSaveMessage("Saved!");
    } catch (err) {
      setSaveMessage("Failed to save file: " + err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    setIsEdited(false);
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500 text-center bg-white">
        <h2 className="text-xl font-medium mb-4 m-0 text-gray-900">Select a file to start editing</h2>
        <p className="text-sm m-0">Choose a markdown file from the sidebar or open a folder.</p>
      </div>
    );
  }

  const header = (
    <div className="flex items-center justify-between px-3 border-b border-gray-200 bg-gray-50 h-14 min-h-[56px]">
      <span className="text-xs text-gray-600 truncate font-semibold flex items-center h-14 min-h-[56px]" title={file.name}>
        {file.name}
      </span>
      {!isImageFile(file) ? (
        <div className="flex gap-2 items-center h-14 min-h-[56px]">
          <button 
            className={`px-3 py-1.5 border rounded text-xs font-medium cursor-pointer transition-colors ${
              !isPreviewGlobal 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setIsPreviewGlobal(false)}
          >
            Edit
          </button>
          <button 
            className={`px-3 py-1.5 border rounded text-xs font-medium cursor-pointer transition-colors ${
              isPreviewGlobal 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setIsPreviewGlobal(true)}
          >
            Preview
          </button>
        </div>
      ) : (
        <div className="h-14 min-h-[56px] flex items-center" />
      )}
    </div>
  );

  if (isImageFile(file)) {
    return (
      <div className="flex flex-col h-full bg-white">
        {header}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading image...</div>
            </div>
          ) : imageSrc ? (
            <img 
              src={imageSrc}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded shadow-lg bg-white p-2"
            />
          ) : (
            <div className="text-center text-gray-500 p-8 bg-white rounded shadow">
              <p>Unable to display image</p>
              <p className="text-xs mt-2">{file.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {header}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : isPreviewGlobal ? (
          <div 
            className="prose prose-sm prose-blue p-6 h-full min-h-full text-gray-900 max-w-none"
            style={{
              fontSize: `${fontSize}rem`,
              fontFamily: `'Georgia', 'Times New Roman', Times, serif`,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <div className="relative h-full min-h-full">
            <textarea
              className="w-full h-full border-none outline-none p-6 font-mono text-sm leading-relaxed resize-none bg-white text-gray-900 placeholder-gray-500"
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing..."
              style={{ minHeight: "100%" }}
            />
            {isEdited && (
              <div className="absolute top-4 right-6 flex gap-2 items-center">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"/>
                    </svg>
                    <span className="text-xs text-blue-500">Saving...</span>
                  </div>
                ) : (
                  <button
                    className="px-4 py-1.5 bg-blue-500 text-white text-xs rounded shadow hover:bg-blue-600 transition"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                )}
                <button
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs rounded shadow hover:bg-gray-300 transition"
                  onClick={handleRevert}
                  disabled={isSaving}
                >
                  Revert
                </button>
                {saveMessage && (
                  <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">{saveMessage}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Editor;