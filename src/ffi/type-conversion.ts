/**
 * Type conversion utilities for Bun.FFI
 * Handles conversion between JavaScript types and C structures
 */

import { ptr, CString } from "bun:ffi";
import type { 
  RKLLMParam, 
  RKLLMInput, 
  RKLLMResult, 
  RKLLMInferMode,
  RKLLMInputType,
  LLMCallState,
  RKLLMLoraAdapter,
  RKLLMExtendParam
} from '../types.js';

/**
 * Size constants for C structures (in bytes)
 * These must match the C structure sizes exactly
 */
const STRUCT_SIZES = {
  RKLLMParam: 256,           // Estimated size, adjust based on actual struct
  RKLLMExtendParam: 128,     // From header: 104 bytes reserved + other fields
  RKLLMInput: 128,           // Union structure
  RKLLMInferParam: 64,       // Inference parameters
  RKLLMLoraAdapter: 32,      // LoRA adapter structure
  RKLLMResult: 128,          // Result structure
  LLMHandle: 8,              // Pointer size
} as const;

/**
 * Allocate memory for a C structure
 */
function allocateStruct(size: number): ArrayBuffer {
  return new ArrayBuffer(size);
}

/**
 * Convert JavaScript RKLLMParam to C structure
 */
export function createRKLLMParamStruct(params: RKLLMParam): ArrayBuffer {
  const buffer = allocateStruct(STRUCT_SIZES.RKLLMParam);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  
  let offset = 0;
  
  // model_path (const char*) - Store as pointer to string
  const modelPathBuffer = Buffer.from(params.modelPath + '\0', 'utf-8');
  const modelPathPtr = ptr(modelPathBuffer);
  view.setBigUint64(offset, BigInt(modelPathPtr), true);
  offset += 8;
  
  // max_context_len (int32_t)
  view.setInt32(offset, params.maxContextLen ?? 1024, true);
  offset += 4;
  
  // max_new_tokens (int32_t)
  view.setInt32(offset, params.maxNewTokens ?? 256, true);
  offset += 4;
  
  // top_k (int32_t)
  view.setInt32(offset, params.topK ?? 50, true);
  offset += 4;
  
  // n_keep (int32_t)
  view.setInt32(offset, params.nKeep ?? 0, true);
  offset += 4;
  
  // top_p (float)
  view.setFloat32(offset, params.topP ?? 0.9, true);
  offset += 4;
  
  // temperature (float)
  view.setFloat32(offset, params.temperature ?? 0.7, true);
  offset += 4;
  
  // repeat_penalty (float)
  view.setFloat32(offset, params.repeatPenalty ?? 1.1, true);
  offset += 4;
  
  // frequency_penalty (float)
  view.setFloat32(offset, params.frequencyPenalty ?? 0.0, true);
  offset += 4;
  
  // presence_penalty (float)
  view.setFloat32(offset, params.presencePenalty ?? 0.0, true);
  offset += 4;
  
  // mirostat (int32_t)
  view.setInt32(offset, params.mirostat ?? 0, true);
  offset += 4;
  
  // mirostat_tau (float)
  view.setFloat32(offset, params.mirostatTau ?? 5.0, true);
  offset += 4;
  
  // mirostat_eta (float)
  view.setFloat32(offset, params.mirostatEta ?? 0.1, true);
  offset += 4;
  
  // skip_special_token (bool)
  uint8View[offset] = params.skipSpecialToken ? 1 : 0;
  offset += 1;
  
  // is_async (bool)
  uint8View[offset] = params.isAsync ? 1 : 0;
  offset += 1;
  
  // Align to 8-byte boundary for pointers
  offset = Math.ceil(offset / 8) * 8;
  
  // img_start (const char*)
  if (params.imgStart) {
    const imgStartBuffer = Buffer.from(params.imgStart + '\0', 'utf-8');
    const imgStartPtr = ptr(imgStartBuffer);
    view.setBigUint64(offset, BigInt(imgStartPtr), true);
  } else {
    view.setBigUint64(offset, 0n, true);
  }
  offset += 8;
  
  // img_end (const char*)
  if (params.imgEnd) {
    const imgEndBuffer = Buffer.from(params.imgEnd + '\0', 'utf-8');
    const imgEndPtr = ptr(imgEndBuffer);
    view.setBigUint64(offset, BigInt(imgEndPtr), true);
  } else {
    view.setBigUint64(offset, 0n, true);
  }
  offset += 8;
  
  // img_content (const char*)
  if (params.imgContent) {
    const imgContentBuffer = Buffer.from(params.imgContent + '\0', 'utf-8');
    const imgContentPtr = ptr(imgContentBuffer);
    view.setBigUint64(offset, BigInt(imgContentPtr), true);
  } else {
    view.setBigUint64(offset, 0n, true);
  }
  offset += 8;
  
  // extend_param (RKLLMExtendParam struct)
  if (params.extendParam) {
    const extendBuffer = createRKLLMExtendParamStruct(params.extendParam);
    const extendView = new Uint8Array(extendBuffer);
    uint8View.set(extendView, offset);
  }
  
  return buffer;
}

/**
 * Convert JavaScript RKLLMExtendParam to C structure
 */
export function createRKLLMExtendParamStruct(params: RKLLMExtendParam): ArrayBuffer {
  const buffer = allocateStruct(STRUCT_SIZES.RKLLMExtendParam);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  
  let offset = 0;
  
  // base_domain_id (int32_t)
  view.setInt32(offset, params.baseDomainId ?? 0, true);
  offset += 4;
  
  // embed_flash (int8_t)
  uint8View[offset] = params.embedFlash ? 1 : 0;
  offset += 1;
  
  // enabled_cpus_num (int8_t)
  uint8View[offset] = params.enabledCpusNum ?? 0;
  offset += 1;
  
  // Padding to align to 4-byte boundary
  offset = Math.ceil(offset / 4) * 4;
  
  // enabled_cpus_mask (uint32_t)
  view.setUint32(offset, params.enabledCpusMask ?? 0, true);
  offset += 4;
  
  // n_batch (uint8_t)
  uint8View[offset] = params.nBatch ?? 1;
  offset += 1;
  
  // use_cross_attn (int8_t)
  uint8View[offset] = params.useCrossAttn ? 1 : 0;
  offset += 1;
  
  // reserved[104] - zero out reserved bytes
  const reservedStart = offset + 2; // Account for padding
  for (let i = reservedStart; i < reservedStart + 104; i++) {
    uint8View[i] = 0;
  }
  
  return buffer;
}

/**
 * Convert JavaScript RKLLMInput to C structure
 */
export function createRKLLMInputStruct(input: RKLLMInput): ArrayBuffer {
  const buffer = allocateStruct(STRUCT_SIZES.RKLLMInput);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  
  let offset = 0;
  
  // role (const char*) - default to "user"
  const roleBuffer = Buffer.from('user\0', 'utf-8');
  const rolePtr = ptr(roleBuffer);
  view.setBigUint64(offset, BigInt(rolePtr), true);
  offset += 8;
  
  // enable_thinking (bool) - default to false
  uint8View[offset] = 0;
  offset += 1;
  
  // Padding to align to 4-byte boundary
  offset = Math.ceil(offset / 4) * 4;
  
  // input_type (RKLLMInputType)
  view.setInt32(offset, input.inputType, true);
  offset += 4;
  
  // Union data based on input type
  switch (input.inputType) {
    case 0: // RKLLM_INPUT_PROMPT
      if (typeof input.inputData === 'string') {
        const promptBuffer = Buffer.from(input.inputData + '\0', 'utf-8');
        const promptPtr = ptr(promptBuffer);
        view.setBigUint64(offset, BigInt(promptPtr), true);
      }
      break;
      
    case 1: // RKLLM_INPUT_TOKEN
      if (Array.isArray(input.inputData)) {
        const tokenBuffer = new Int32Array(input.inputData);
        const tokenPtr = ptr(tokenBuffer);
        view.setBigUint64(offset, BigInt(tokenPtr), true);
        offset += 8;
        view.setBigUint64(offset, BigInt(input.inputData.length), true);
      }
      break;
      
    case 2: // RKLLM_INPUT_EMBED
      if (input.inputData instanceof Float32Array || Array.isArray(input.inputData)) {
        const embedArray = input.inputData instanceof Float32Array ? 
          input.inputData : new Float32Array(input.inputData);
        const embedPtr = ptr(embedArray);
        view.setBigUint64(offset, BigInt(embedPtr), true);
        offset += 8;
        view.setBigUint64(offset, BigInt(embedArray.length), true);
      }
      break;
      
    case 3: // RKLLM_INPUT_MULTIMODAL
      // For multimodal, we'd need more complex handling
      // This is a simplified version
      if (typeof input.inputData === 'string') {
        const promptBuffer = Buffer.from(input.inputData + '\0', 'utf-8');
        const promptPtr = ptr(promptBuffer);
        view.setBigUint64(offset, BigInt(promptPtr), true);
      }
      break;
  }
  
  return buffer;
}

/**
 * Convert JavaScript RKLLMLoraAdapter to C structure
 */
export function createRKLLMLoraAdapterStruct(adapter: RKLLMLoraAdapter): ArrayBuffer {
  const buffer = allocateStruct(STRUCT_SIZES.RKLLMLoraAdapter);
  const view = new DataView(buffer);
  
  let offset = 0;
  
  // lora_adapter_path (const char*)
  const pathBuffer = Buffer.from(adapter.loraPath + '\0', 'utf-8');
  const pathPtr = ptr(pathBuffer);
  view.setBigUint64(offset, BigInt(pathPtr), true);
  offset += 8;
  
  // lora_adapter_name (const char*) - use filename from path
  const name = adapter.loraPath.split('/').pop() || 'lora_adapter';
  const nameBuffer = Buffer.from(name + '\0', 'utf-8');
  const namePtr = ptr(nameBuffer);
  view.setBigUint64(offset, BigInt(namePtr), true);
  offset += 8;
  
  // scale (float)
  view.setFloat32(offset, adapter.scale ?? 1.0, true);
  offset += 4;
  
  return buffer;
}

/**
 * Parse RKLLMResult from C structure
 */
export function parseRKLLMResult(resultPtr: number): RKLLMResult {
  // This is a simplified version - in a real implementation,
  // you'd need to carefully read the C structure layout
  const result: RKLLMResult = {
    text: undefined,
    state: 0 as LLMCallState,
    tokens: undefined,
    logits: undefined,
    hiddenStates: undefined,
  };
  
  // For now, return a basic result
  // In a real implementation, you'd use ptr() to read from the result pointer
  return result;
}

/**
 * Create a callback function pointer for FFI
 */
export function createCallbackPointer(callback: (result: RKLLMResult, userdata?: any, state?: LLMCallState) => number) {
  // Note: Bun.FFI callback creation is more complex and may require
  // using Bun's callback utilities. This is a placeholder.
  return 0; // Return null pointer for now
}

/**
 * Helper to get a pointer from ArrayBuffer
 */
export function getBufferPointer(buffer: ArrayBuffer): number {
  return ptr(buffer);
}