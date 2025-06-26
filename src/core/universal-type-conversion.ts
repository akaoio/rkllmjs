/**
 * Universal type conversion utilities
 * Handles conversion between JavaScript types and C structures across all runtimes
 */

import type { FFIManager } from './ffi-manager.js';
import { 
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
export const STRUCT_SIZES = {
  RKLLMParam: 256,           // Estimated size, adjust based on actual struct
  RKLLMExtendParam: 128,     // From header: 104 bytes reserved + other fields
  RKLLMInput: 128,           // Union structure
  RKLLMInferParam: 64,       // Inference parameters
  RKLLMLoraAdapter: 32,      // LoRA adapter structure
  RKLLMResult: 128,          // Result structure
  LLMHandle: 8,              // Pointer size
} as const;

/**
 * Universal type conversion utilities
 */
export class UniversalTypeConverter {
  constructor(private ffiManager: FFIManager) {}

  /**
   * Allocate memory for a C structure
   */
  private allocateStruct(size: number) {
    return this.ffiManager.allocateMemory(size);
  }

  /**
   * Convert JavaScript RKLLMParam to C structure
   */
  createRKLLMParamStruct(params: RKLLMParam): { buffer: any; ptr: any } {
    const memBuffer = this.allocateStruct(STRUCT_SIZES.RKLLMParam);
    const view = memBuffer.view;
    
    let offset = 0;
    
    // model_path (const char*) - Store as pointer to string
    const modelPathPtr = this.ffiManager.createCString(params.modelPath);
    view.setBigUint64(offset, BigInt(Number(modelPathPtr)), true);
    offset += 8;
    
    // max_context_len (int32_t)
    view.setInt32(offset, params.maxContextLen ?? 1024, true);
    offset += 4;
    
    // max_new_tokens (int32_t)
    view.setInt32(offset, params.maxNewTokens ?? 256, true);
    offset += 4;
    
    // temperature (float)
    view.setFloat32(offset, params.temperature ?? 0.7, true);
    offset += 4;
    
    // top_p (float)
    view.setFloat32(offset, params.topP ?? 0.9, true);
    offset += 4;
    
    // top_k (int32_t)
    view.setInt32(offset, params.topK ?? 50, true);
    offset += 4;
    
    // repetition_penalty (float)
    view.setFloat32(offset, params.repeatPenalty ?? 1.1, true);
    offset += 4;
    
    // presence_penalty (float)
    view.setFloat32(offset, params.presencePenalty ?? 0.0, true);
    offset += 4;
    
    // frequency_penalty (float)
    view.setFloat32(offset, params.frequencyPenalty ?? 0.0, true);
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
    
    // Note: seed property doesn't exist in RKLLMParam interface
    // Using a default value for now
    view.setInt32(offset, -1, true);
    offset += 4;
    
    // skip_special_token (int8_t)
    view.setUint8(offset, params.skipSpecialToken ? 1 : 0);
    offset += 1;
    
    // is_async (int8_t)
    view.setUint8(offset, params.isAsync ? 1 : 0);
    offset += 1;
    
    // Align to 4-byte boundary for img_start
    offset = Math.ceil(offset / 4) * 4;
    
    // img_start (const char*)
    if (params.imgStart) {
      const imgStartPtr = this.ffiManager.createCString(params.imgStart);
      view.setBigUint64(offset, BigInt(Number(imgStartPtr)), true);
    } else {
      view.setBigUint64(offset, BigInt(0), true);
    }
    offset += 8;
    
    // img_end (const char*)
    if (params.imgEnd) {
      const imgEndPtr = this.ffiManager.createCString(params.imgEnd);
      view.setBigUint64(offset, BigInt(Number(imgEndPtr)), true);
    } else {
      view.setBigUint64(offset, BigInt(0), true);
    }
    offset += 8;
    
    // img_content (const char*)
    if (params.imgContent) {
      const imgContentPtr = this.ffiManager.createCString(params.imgContent);
      view.setBigUint64(offset, BigInt(Number(imgContentPtr)), true);
    } else {
      view.setBigUint64(offset, BigInt(0), true);
    }
    offset += 8;
    
    // extend_param (RKLLMExtendParam*)
    if (params.extendParam) {
      const extendParamStruct = this.createRKLLMExtendParamStruct(params.extendParam);
      view.setBigUint64(offset, BigInt(Number(extendParamStruct.ptr)), true);
    } else {
      view.setBigUint64(offset, BigInt(0), true);
    }
    
    return {
      buffer: memBuffer,
      ptr: this.ffiManager.createPointer(memBuffer.view.buffer)
    };
  }

  /**
   * Convert JavaScript RKLLMExtendParam to C structure
   */
  createRKLLMExtendParamStruct(params: RKLLMExtendParam): { buffer: any; ptr: any } {
    const memBuffer = this.allocateStruct(STRUCT_SIZES.RKLLMExtendParam);
    const view = memBuffer.view;
    const uint8View = new Uint8Array(memBuffer.view.buffer);
    
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
    
    return {
      buffer: memBuffer,
      ptr: this.ffiManager.createPointer(memBuffer.view.buffer)
    };
  }

  /**
   * Convert JavaScript RKLLMInput to C structure
   */
  createRKLLMInputStruct(input: RKLLMInput): { buffer: any; ptr: any } {
    const memBuffer = this.allocateStruct(STRUCT_SIZES.RKLLMInput);
    const view = memBuffer.view;
    
    let offset = 0;
    
    // input_mode (int32_t)
    view.setInt32(offset, input.inputType, true);
    offset += 4;
    
    // Padding for alignment
    offset = Math.ceil(offset / 8) * 8;
    
    // input_data - union based on input_mode
    switch (input.inputType) {
      case RKLLMInputType.PROMPT: {
        // prompt_text (const char*)
        const promptPtr = this.ffiManager.createCString(input.inputData as string);
        view.setBigUint64(offset, BigInt(Number(promptPtr)), true);
        break;
      }
      
      case RKLLMInputType.TOKEN: {
        // tokens array - need to implement token array handling
        throw new Error('Token input type not yet implemented');
      }
      
      case RKLLMInputType.EMBED: {
        // embedding array - need to implement embedding handling
        throw new Error('Embedding input type not yet implemented');
      }
      
      case RKLLMInputType.MULTIMODAL: {
        // multimodal input - need to implement multimodal handling
        throw new Error('Multimodal input type not yet implemented');
      }
    }
    
    return {
      buffer: memBuffer,
      ptr: this.ffiManager.createPointer(memBuffer.view.buffer)
    };
  }

  /**
   * Create a callback pointer for streaming
   */
  createCallbackPointer(callback: (result: RKLLMResult, userdata: any, state: LLMCallState) => number): any {
    // This is runtime-specific and would need to be implemented differently for each adapter
    // For now, return a placeholder
    throw new Error('Callback creation not yet implemented in universal converter');
  }

  /**
   * Parse RKLLMResult from C structure
   */
  parseRKLLMResult(resultPtr: any): RKLLMResult {
    // This would need to read from the result pointer and convert to JavaScript object
    throw new Error('Result parsing not yet implemented in universal converter');
  }

  /**
   * Get buffer pointer for FFI operations
   */
  getBufferPointer(buffer: ArrayBuffer): any {
    return this.ffiManager.createPointer(buffer);
  }

  /**
   * Convert JavaScript RKLLMLoraAdapter to C structure
   */
  createRKLLMLoraAdapterStruct(adapter: RKLLMLoraAdapter): { buffer: any; ptr: any } {
    const memBuffer = this.allocateStruct(STRUCT_SIZES.RKLLMLoraAdapter);
    const view = memBuffer.view;
    
    let offset = 0;
    
    // lora_path (const char*)
    const loraPathPtr = this.ffiManager.createCString(adapter.loraPath);
    view.setBigUint64(offset, BigInt(Number(loraPathPtr)), true);
    offset += 8;
    
    // scale (float)
    view.setFloat32(offset, adapter.scale ?? 1.0, true);
    offset += 4;
    
    return {
      buffer: memBuffer,
      ptr: this.ffiManager.createPointer(memBuffer.view.buffer)
    };
  }
}