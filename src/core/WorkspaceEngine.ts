import * as FileSystem from 'expo-file-system';

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  lastModified?: number;
}

export interface FileSystemOperation {
  type: 'read' | 'write' | 'delete' | 'create' | 'move' | 'copy';
  path: string;
  content?: string;
  destination?: string;
}

/**
 * WorkspaceEngine - Physical filesystem sync from bolt.diy
 * Manages physical filesystem operations in React Native environment
 */
export class WorkspaceEngine {
  private workspacePath: string;
  private fileCache: Map<string, FileNode> = new Map();

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.initializeWorkspace();
  }

  /**
   * Initialize workspace directory
   */
  private async initializeWorkspace(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.workspacePath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.workspacePath, { intermediates: true });
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<string> {
    try {
      const fullPath = this.resolvePath(path);
      const content = await FileSystem.readAsStringAsync(fullPath);
      
      // Update cache
      this.fileCache.set(path, {
        path,
        name: this.getFileName(path),
        type: 'file',
        content,
        lastModified: Date.now()
      });
      
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  /**
   * Write file content
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      await FileSystem.writeAsStringAsync(fullPath, content);
      
      // Update cache
      this.fileCache.set(path, {
        path,
        name: this.getFileName(path),
        type: 'file',
        content,
        lastModified: Date.now()
      });
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error}`);
    }
  }

  /**
   * Delete file or directory
   */
  async delete(path: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fullPath, { idempotent: true });
        this.fileCache.delete(path);
      }
    } catch (error) {
      throw new Error(`Failed to delete ${path}: ${error}`);
    }
  }

  /**
   * Create directory
   */
  async createDirectory(path: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
      
      this.fileCache.set(path, {
        path,
        name: this.getFileName(path),
        type: 'directory',
        children: [],
        lastModified: Date.now()
      });
    } catch (error) {
      throw new Error(`Failed to create directory ${path}: ${error}`);
    }
  }

  /**
   * Move file or directory
   */
  async move(oldPath: string, newPath: string): Promise<void> {
    try {
      const fullOldPath = this.resolvePath(oldPath);
      const fullNewPath = this.resolvePath(newPath);
      await FileSystem.moveAsync({
        from: fullOldPath,
        to: fullNewPath
      });
      
      // Update cache
      const cached = this.fileCache.get(oldPath);
      if (cached) {
        this.fileCache.delete(oldPath);
        this.fileCache.set(newPath, { ...cached, path: newPath });
      }
    } catch (error) {
      throw new Error(`Failed to move ${oldPath} to ${newPath}: ${error}`);
    }
  }

  /**
   * Copy file or directory
   */
  async copy(sourcePath: string, destPath: string): Promise<void> {
    try {
      const fullSourcePath = this.resolvePath(sourcePath);
      const fullDestPath = this.resolvePath(destPath);
      await FileSystem.copyAsync({
        from: fullSourcePath,
        to: fullDestPath
      });
      
      // Cache the copy
      const cached = this.fileCache.get(sourcePath);
      if (cached) {
        this.fileCache.set(destPath, { ...cached, path: destPath });
      }
    } catch (error) {
      throw new Error(`Failed to copy ${sourcePath} to ${destPath}: ${error}`);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileNode[]> {
    try {
      const fullPath = this.resolvePath(path);
      const files = await FileSystem.readDirectoryAsync(fullPath);
      
      const nodes: FileNode[] = [];
      for (const fileName of files) {
        const filePath = this.joinPath(path, fileName);
        const fileInfo = await FileSystem.getInfoAsync(this.resolvePath(filePath));
        
        if (fileInfo.exists) {
          const node: FileNode = {
            path: filePath,
            name: fileName,
            type: fileInfo.isDirectory ? 'directory' : 'file'
          };
          
          if (node.type === 'directory') {
            node.children = await this.listDirectory(filePath);
          }
          
          nodes.push(node);
        }
      }
      
      return nodes;
    } catch (error) {
      throw new Error(`Failed to list directory ${path}: ${error}`);
    }
  }

  /**
   * Get file tree structure
   */
  async getFileTree(rootPath: string = ''): Promise<FileNode> {
    try {
      const path = rootPath || this.workspacePath;
      const fileName = this.getFileName(path);
      
      const fileInfo = await FileSystem.getInfoAsync(this.resolvePath(path));
      if (!fileInfo.exists) {
        throw new Error(`Path does not exist: ${path}`);
      }
      
      if (fileInfo.isDirectory) {
        const children = await this.listDirectory(path);
        return {
          path,
          name: fileName,
          type: 'directory',
          children
        };
      } else {
        const content = await this.readFile(path);
        return {
          path,
          name: fileName,
          type: 'file',
          content
        };
      }
    } catch (error) {
      throw new Error(`Failed to get file tree: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(path);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      return fileInfo.exists;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(path: string): Promise<{ size: number; modified: number }> {
    try {
      const fullPath = this.resolvePath(path);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (fileInfo.exists) {
        return {
          size: (fileInfo as any).size || 0,
          modified: (fileInfo as any).modificationTime || Date.now()
        };
      }
      
      throw new Error(`File does not exist: ${path}`);
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * Batch operations
   */
  async batchOperations(operations: FileSystemOperation[]): Promise<void> {
    for (const op of operations) {
      switch (op.type) {
        case 'read':
          await this.readFile(op.path);
          break;
        case 'write':
          if (op.content) {
            await this.writeFile(op.path, op.content);
          }
          break;
        case 'delete':
          await this.delete(op.path);
          break;
        case 'create':
          await this.createDirectory(op.path);
          break;
        case 'move':
          if (op.destination) {
            await this.move(op.path, op.destination);
          }
          break;
        case 'copy':
          if (op.destination) {
            await this.copy(op.path, op.destination);
          }
          break;
      }
    }
  }

  /**
   * Watch for file changes (simulated polling)
   */
  async watchFile(
    path: string,
    callback: (content: string) => void,
    interval: number = 1000
  ): Promise<() => void> {
    let lastContent = await this.readFile(path);
    
    const intervalId = setInterval(async () => {
      try {
        const currentContent = await this.readFile(path);
        if (currentContent !== lastContent) {
          lastContent = currentContent;
          callback(currentContent);
        }
      } catch (error) {
        console.error('Error watching file:', error);
      }
    }, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  /**
   * Search files by pattern
   */
  async searchFiles(
    pattern: string,
    rootPath: string = '',
    maxResults: number = 100
  ): Promise<FileNode[]> {
    const results: FileNode[] = [];
    const regex = new RegExp(pattern, 'i');
    
    const search = async (path: string) => {
      if (results.length >= maxResults) return;
      
      const nodes = await this.listDirectory(path);
      for (const node of nodes) {
        if (results.length >= maxResults) break;
        
        if (regex.test(node.name)) {
          results.push(node);
        }
        
        if (node.type === 'directory' && node.children) {
          await search(node.path);
        }
      }
    };
    
    await search(rootPath || this.workspacePath);
    return results;
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(): Promise<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
  }> {
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    
    const traverse = async (path: string) => {
      const nodes = await this.listDirectory(path);
      for (const node of nodes) {
        if (node.type === 'file') {
          totalFiles++;
          try {
            const info = await this.getFileInfo(node.path);
            totalSize += info.size;
          } catch {}
        } else if (node.type === 'directory') {
          totalDirectories++;
          await traverse(node.path);
        }
      }
    };
    
    await traverse(this.workspacePath);
    
    return { totalFiles, totalDirectories, totalSize };
  }

  /**
   * Resolve path relative to workspace
   */
  private resolvePath(path: string): string {
    if (path.startsWith(this.workspacePath)) {
      return path;
    }
    return this.joinPath(this.workspacePath, path);
  }

  /**
   * Join path segments
   */
  private joinPath(...segments: string[]): string {
    return segments
      .map(s => s.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  /**
   * Get filename from path
   */
  private getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  /**
   * Clear file cache
   */
  clearCache(): void {
    this.fileCache.clear();
  }

  /**
   * Export workspace as JSON
   */
  async exportWorkspace(): Promise<Record<string, string>> {
    const exportData: Record<string, string> = {};
    const tree = await this.getFileTree();
    
    const traverse = async (node: FileNode) => {
      if (node.type === 'file') {
        try {
          exportData[node.path] = await this.readFile(node.path);
        } catch {}
      } else if (node.children) {
        for (const child of node.children) {
          await traverse(child);
        }
      }
    };
    
    await traverse(tree);
    return exportData;
  }

  /**
   * Import workspace from JSON
   */
  async importWorkspace(data: Record<string, string>): Promise<void> {
    for (const [path, content] of Object.entries(data)) {
      const dirPath = path.substring(0, path.lastIndexOf('/'));
      if (dirPath) {
        await this.createDirectory(dirPath);
      }
      await this.writeFile(path, content);
    }
  }
}