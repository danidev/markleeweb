import { useState, useEffect } from "react";
import { rename } from '../lib/fsUtils';
import { Folder, FileText, Image, File, RefreshCw, FolderOpen } from 'lucide-react';

function Sidebar({ width, onFileSelect, selectedFile, files, currentFolder, onOpenFolder, onReload }) {
  const [expanded, setExpanded] = useState(new Set());
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleExpanded = (path) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') {
      return expanded.has(file.path || file.name) ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    switch (file.extension) {
      case 'md': return <FileText size={16} />;
      case 'txt': return <FileText size={16} />;
      case 'csv': return <FileText size={16} />;
      case 'png':
      case 'jpg':
      case 'jpeg': return <Image size={16} />;
      default: return <File size={16} />;
    }
  };

  const handleRename = async (file) => {
    if (!file || !renameValue.trim()) return;
    try {
      const oldPath = file.path;
      const newPath = oldPath.replace(/[^/]+$/, renameValue.trim());
      await rename(oldPath, newPath);
      setRenameTarget(null);
      window.location.reload();
    } catch (err) {
      alert("Rename failed: " + err);
    }
  };

  const renderFile = (file, level = 0) => {
    const isExpanded = expanded.has(file.path || file.name);
    const isSelected = selectedFile?.path === file.path;
    const isRenaming = renameTarget?.path === file.path;

    return (
      <div key={file.path || file.name}>
        <div 
          className={`flex items-center py-2 px-3 cursor-pointer select-none text-sm transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleExpanded(file.path || file.name);
            } else {
              onFileSelect(file);
            }
          }}
          onDoubleClick={() => {
            setRenameTarget(file);
            setRenameValue(file.name);
          }}
        >
          <span className="mr-4 text-sm">
            {getFileIcon(file)} {/* Updated to use lucide-react icons */}
          </span>
          {isRenaming ? (
            <input
              className="border px-2 py-1 text-xs rounded flex-1"
              value={renameValue}
              autoFocus
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => handleRename(file)}
              onKeyDown={e => {
                if (e.key === "Enter") handleRename(file);
                if (e.key === "Escape") setRenameTarget(null);
              }}
            />
          ) : (
            <span className="truncate text-xs flex-1">{file.name}</span>
          )}
        </div>
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-r border-gray-200 flex flex-col overflow-hidden" style={{ width: `${width}px` }}>
      <div className="p-3 border-b border-gray-200 bg-gray-50 h-14 min-h-[56px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-gray-600 truncate" title={currentFolder}>
            {currentFolder ? currentFolder.split('/').pop() : 'No folder selected'}
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={onReload}
              className="text-xs text-gray-500 hover:text-blue-700 border border-gray-300 rounded px-2 py-1 bg-white"
              title="Reload"
            >
              <RefreshCw size="16"/>
            </button>
            {/*<button
              onClick={onOpenFolder}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              {currentFolder ? 'Change' : 'Open Folder'}
            </button>*/}
          </div>
        </div>
      </div>
      {currentFolder && (<div className="flex-1 overflow-y-auto py-2">
        {files.map(file => renderFile(file))}
      </div>)}
    </div>
  );
}

export default Sidebar;