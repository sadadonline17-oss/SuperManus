import diff from 'diff';

export interface DiffResult {
  original: string;
  modified: string;
  changes: DiffChange[];
  patch: string;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber?: number;
}

export interface PatchOperation {
  op: 'replace' | 'insert' | 'delete';
  path: string;
  value?: string;
  oldValue?: string;
}

/**
 * PatchDiffEngine - Surgical code editing system from bolt.diy
 * Enables precise, surgical edits to code files
 */
export class PatchDiffEngine {
  /**
   * Compute diff between two strings
   */
  computeDiff(original: string, modified: string): DiffResult {
    const changes: DiffChange[] = [];
    
    const diffResult = diff.diffLines(original, modified);
    let lineNumber = 1;

    for (const part of diffResult) {
      const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
      const lines = part.value.split('\n').filter(l => l !== '');
      
      for (const line of lines) {
        if (type !== 'unchanged' || line.trim() !== '') {
          changes.push({
            type,
            value: line + '\n',
            lineNumber: type === 'unchanged' ? lineNumber : undefined
          });
        }
        if (type !== 'removed') {
          lineNumber++;
        }
      }
    }

    return {
      original,
      modified,
      changes,
      patch: diffResult.map(part => {
        const prefix = part.added ? '+' : part.removed ? '-' : ' ';
        return part.value.split('\n').map(line => prefix + line).join('\n');
      }).join('\n')
    };
  }

  /**
   * Apply a patch operation to content
   */
  applyPatch(content: string, operation: PatchOperation): string {
    const lines = content.split('\n');
    
    switch (operation.op) {
      case 'replace':
        if (operation.oldValue && operation.value) {
          const index = lines.indexOf(operation.oldValue);
          if (index !== -1) {
            lines[index] = operation.value;
          }
        }
        break;
        
      case 'insert':
        if (operation.value) {
          const insertIndex = this.findInsertLine(content, operation.path);
          lines.splice(insertIndex, 0, operation.value);
        }
        break;
        
      case 'delete':
        if (operation.oldValue) {
          const index = lines.indexOf(operation.oldValue);
          if (index !== -1) {
            lines.splice(index, 1);
          }
        }
        break;
    }
    
    return lines.join('\n');
  }

  /**
   * Apply multiple patches in sequence
   */
  applyPatches(content: string, patches: PatchOperation[]): string {
    let result = content;
    for (const patch of patches) {
      result = this.applyPatch(result, patch);
    }
    return result;
  }

  /**
   * Generate a unified diff string
   */
  generateUnifiedDiff(
    original: string,
    modified: string,
    originalFile: string = 'original',
    modifiedFile: string = 'modified'
  ): string {
    return diff.createPatch(originalFile, original, modified, '', '', {
      context: 3
    });
  }

  /**
   * Parse a unified diff and extract changes
   */
  parseUnifiedDiff(diffString: string): PatchOperation[] {
    const operations: PatchOperation[] = [];
    const lines = diffString.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        operations.push({
          op: 'insert',
          path: '',
          value: line.substring(1)
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        operations.push({
          op: 'delete',
          path: '',
          oldValue: line.substring(1)
        });
      }
    }
    
    return operations;
  }

  /**
   * Find the appropriate line to insert content based on path/expression
   */
  private findInsertLine(content: string, path: string): number {
    const lines = content.split('\n');
    
    // Try to find line matching the path/expression
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(path)) {
        return i + 1;
      }
    }
    
    // Default to end of file
    return lines.length;
  }

  /**
   * Surgical edit - replace specific text range
   */
  surgicalEdit(
    content: string,
    searchPattern: string | RegExp,
    replacement: string,
    options: {
      global?: boolean;
      caseInsensitive?: boolean;
    } = {}
  ): string {
    const flags = [
      options.global ? 'g' : '',
      options.caseInsensitive ? 'i' : ''
    ].join('');
    
    let pattern = searchPattern;
    if (typeof searchPattern === 'string') {
      pattern = new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    }
    
    return content.replace(pattern as RegExp, replacement);
  }

  /**
   * Multi-step surgical edit
   */
  multiStepSurgicalEdit(
    content: string,
    edits: Array<{
      search: string | RegExp;
      replace: string;
      options?: Parameters<typeof this.surgicalEdit>[2];
    }>
  ): string {
    let result = content;
    for (const edit of edits) {
      result = this.surgicalEdit(result, edit.search, edit.replace, edit.options);
    }
    return result;
  }

  /**
   * Validate a patch before applying
   */
  validatePatch(content: string, operation: PatchOperation): boolean {
    if (operation.op === 'delete' && operation.oldValue) {
      return content.includes(operation.oldValue);
    }
    if (operation.op === 'replace' && operation.oldValue) {
      return content.includes(operation.oldValue);
    }
    return true;
  }

  /**
   * Create a safe patch that validates before applying
   */
  createSafePatch(
    content: string,
    operation: PatchOperation,
    fallback?: string
  ): string {
    if (this.validatePatch(content, operation)) {
      return this.applyPatch(content, operation);
    }
    return fallback || content;
  }

  /**
   * Generate a preview of what the patch will do
   */
  previewPatch(content: string, operation: PatchOperation): DiffResult {
    const modified = this.applyPatch(content, operation);
    return this.computeDiff(content, modified);
  }

  /**
   * Get statistics about changes
   */
  getDiffStatistics(diffResult: DiffResult): {
    additions: number;
    deletions: number;
    unchanged: number;
    total: number;
  } {
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const change of diffResult.changes) {
      switch (change.type) {
        case 'added':
          additions++;
          break;
        case 'removed':
          deletions++;
          break;
        case 'unchanged':
          unchanged++;
          break;
      }
    }

    return {
      additions,
      deletions,
      unchanged,
      total: additions + deletions + unchanged
    };
  }
}