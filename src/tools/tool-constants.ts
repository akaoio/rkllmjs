/**
 * Tools Configuration Constants
 * Centralized configuration for model management tools
 */

// Example Model Repositories
export const EXAMPLE_REPOSITORIES = {
  QWEN_05B: 'limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4',
  TINYLLAMA: 'punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4'
} as const;

// Example Model Files
export const EXAMPLE_MODEL_FILES = {
  QWEN_05B: 'Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm',
  TINYLLAMA: 'TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm'
} as const;

// CLI Usage Examples
export const CLI_EXAMPLES = {
  PULL_QWEN: `bun tools.ts pull ${EXAMPLE_REPOSITORIES.QWEN_05B} ${EXAMPLE_MODEL_FILES.QWEN_05B}`,
  PULL_TINYLLAMA: `bun tools.ts pull ${EXAMPLE_REPOSITORIES.TINYLLAMA} ${EXAMPLE_MODEL_FILES.TINYLLAMA}`,
  LIST: 'bun tools.ts list',
  INFO: 'bun tools.ts info [model-name]',
  REMOVE: 'bun tools.ts remove [model-name]',
  CLEAN: 'bun tools.ts clean'
} as const;

// Repository Suggestions
export const REPOSITORY_SUGGESTIONS = [
  EXAMPLE_REPOSITORIES.QWEN_05B,
  EXAMPLE_REPOSITORIES.TINYLLAMA,
  'limcheekin/MiniCPM-2B-dpo-rk3588-rkllm-1.1.4',
  'limcheekin/internlm2_5-1_8b-chat-rk3588-rkllm-1.1.4'
] as const;