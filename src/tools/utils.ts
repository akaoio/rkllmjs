/**
 * Utility functions for RKLLM model management
 */

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
}

/**
 * Checks if a filename is a valid model file
 */
export function isModelFile(filename: string): boolean {
  return filename.endsWith('.rkllm') || 
         filename.endsWith('.bin') || 
         filename.endsWith('.safetensors') || 
         filename.endsWith('.gguf');
}

/**
 * Sanitizes repository name for use as directory name
 */
export function sanitizeRepoName(repo: string): string {
  return repo.replace(/[^a-zA-Z0-9._-]/g, '_');
}