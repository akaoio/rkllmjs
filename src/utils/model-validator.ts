/**
 * Model path validation utilities
 * Ensures model files exist before attempting to use them
 */

/**
 * Validates if a model path exists and is accessible
 */
export async function validateModelPath(modelPath: string): Promise<boolean> {
  if (!modelPath || modelPath.trim() === '') {
    return false;
  }

  try {
    const file = Bun.file(modelPath);
    return await file.exists();
  } catch {
    return false;
  }
}

/**
 * Gets a valid model path from environment or throws error
 */
export async function getValidModelPath(preferredPath?: string): Promise<string> {
  // If a preferred path is provided and valid, use it
  if (preferredPath && await validateModelPath(preferredPath)) {
    return preferredPath;
  }

  throw new Error(
    '❌ No valid model found!\n' +
    '💡 Please provide a valid model path or download a model:\n' +
    '   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin\n' +
    '   bun tools.ts list  # to see available models'
  );
}

/**
 * Validates model path and throws descriptive error if invalid
 */
export async function requireValidModelPath(modelPath: string): Promise<void> {
  if (!modelPath || modelPath.trim() === '') {
    throw new Error(
      '❌ Model path is required!\n' +
      '💡 Please provide a valid model path or download a model:\n' +
      '   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin'
    );
  }

  if (modelPath.includes('/path/to') || modelPath.includes('model.rkllm')) {
    throw new Error(
      '❌ Please provide a real model path, not a placeholder!\n' +
      '💡 Download a model first:\n' +
      '   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin\n' +
      '   bun tools.ts list  # to see available models'
    );
  }

  if (!await validateModelPath(modelPath)) {
    throw new Error(
      `❌ Model file not found: ${modelPath}\n` +
      '💡 Please check the path or download a model:\n' +
      '   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin\n' +
      '   bun tools.ts list  # to see available models'
    );
  }
}
