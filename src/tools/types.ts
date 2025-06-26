/**
 * Type definitions for RKLLMJS model management tools
 */

export interface ModelInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  repo?: string;
  filename?: string;
}