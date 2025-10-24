import { readDir } from './fsUtils';

const supportedExtensions = ['.md', '.txt', '.csv', '.png', '.jpg', '.jpeg'];

const isSupportedFile = (filename) => {
  return supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

export async function buildFileTreeRecursive(dirPath) {
  async function readDirRecursive(currentPath) {
    try {
      const entries = await readDir(currentPath);

      const items = [];

      for (const entry of entries) {
        const fullPath = `${currentPath}/${entry.name}`;

        if (entry.isDirectory) {
          const children = await readDirRecursive(fullPath);
          if (children.length > 0) {
            items.push({
              name: entry.name,
              type: 'folder',
              path: fullPath,
              children: children
            });
          }
        } else if (entry.isFile && isSupportedFile(entry.name)) {
          items.push({
            name: entry.name,
            type: 'file',
            path: fullPath,
            extension: entry.name.split('.').pop().toLowerCase()
          });
        }
      }

      return items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
      return [];
    }
  }

  return await readDirRecursive(dirPath);
}
