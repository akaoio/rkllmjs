#ifndef LLM_HANDLE_HPP
#define LLM_HANDLE_HPP

#include <node_api.h>
#include "../../../libs/rkllm/include/rkllm.h"

namespace rkllmjs {
namespace bindings {

/**
 * @brief LLM Handle binding class for N-API
 * 
 * Provides N-API bindings for all RKLLM library functions:
 * - Core management: init, destroy, createDefaultParam
 * - LoRA operations: loadLora
 * - Cache operations: loadPromptCache, releasePromptCache, clearKVCache, getKVCacheSize
 * - Inference operations: run, runAsync, abort, isRunning
 * - Configuration: setChatTemplate, setFunctionTools, setCrossAttnParams
 */
class LLMHandleBinding {
public:
    /**
     * @brief Initialize N-API exports for all LLM handle functions
     * @param env N-API environment
     * @param exports Export object to add functions to
     * @return napi_status
     */
    static napi_status Init(napi_env env, napi_value exports);

private:
    // === Core LLM Management Functions ===
    
    /**
     * @brief Create default RKLLM parameters
     * @param env N-API environment
     * @param info Callback info
     * @return napi_value JavaScript object with default parameters
     */
    static napi_value CreateDefaultParam(napi_env env, napi_callback_info info);

    /**
     * @brief Initialize LLM with parameters
     * @param env N-API environment
     * @param info Callback info containing parameters and callback
     * @return napi_value JavaScript LLM handle object
     */
    static napi_value Init(napi_env env, napi_callback_info info);

    /**
     * @brief Destroy LLM instance and release resources
     * @param env N-API environment
     * @param info Callback info containing LLM handle
     * @return napi_value JavaScript boolean indicating success
     */
    static napi_value Destroy(napi_env env, napi_callback_info info);

    // === LoRA Functions ===

    /**
     * @brief Load a LoRA adapter into the LLM
     * @param env N-API environment
     * @param info Callback info containing handle and LoRA adapter config
     * @return napi_value JavaScript number (status code)
     */
    static napi_value LoadLora(napi_env env, napi_callback_info info);

    // === Prompt Cache Functions ===

    /**
     * @brief Load a prompt cache from file
     * @param env N-API environment
     * @param info Callback info containing handle and cache path
     * @return napi_value JavaScript number (status code)
     */
    static napi_value LoadPromptCache(napi_env env, napi_callback_info info);

    /**
     * @brief Release the prompt cache from memory
     * @param env N-API environment
     * @param info Callback info containing handle
     * @return napi_value JavaScript number (status code)
     */
    static napi_value ReleasePromptCache(napi_env env, napi_callback_info info);

    // === Inference Functions ===

    /**
     * @brief Run LLM inference synchronously
     * @param env N-API environment
     * @param info Callback info containing handle, input, params, userdata
     * @return napi_value JavaScript number (status code)
     */
    static napi_value Run(napi_env env, napi_callback_info info);

    /**
     * @brief Run LLM inference asynchronously
     * @param env N-API environment
     * @param info Callback info containing handle, input, params, userdata
     * @return napi_value JavaScript number (status code)
     */
    static napi_value RunAsync(napi_env env, napi_callback_info info);

    /**
     * @brief Abort an ongoing LLM task
     * @param env N-API environment
     * @param info Callback info containing handle
     * @return napi_value JavaScript number (status code)
     */
    static napi_value Abort(napi_env env, napi_callback_info info);

    /**
     * @brief Check if an LLM task is currently running
     * @param env N-API environment
     * @param info Callback info containing handle
     * @return napi_value JavaScript number (0 if running)
     */
    static napi_value IsRunning(napi_env env, napi_callback_info info);

    // === Key-Value Cache Functions ===

    /**
     * @brief Clear the key-value cache
     * @param env N-API environment
     * @param info Callback info containing handle and clear parameters
     * @return napi_value JavaScript number (status code)
     */
    static napi_value ClearKVCache(napi_env env, napi_callback_info info);

    /**
     * @brief Get the current size of the key-value cache
     * @param env N-API environment
     * @param info Callback info containing handle
     * @return napi_value JavaScript typed array with cache sizes
     */
    static napi_value GetKVCacheSize(napi_env env, napi_callback_info info);

    // === Configuration Functions ===

    /**
     * @brief Set the chat template for the LLM
     * @param env N-API environment
     * @param info Callback info containing handle and template parameters
     * @return napi_value JavaScript number (status code)
     */
    static napi_value SetChatTemplate(napi_env env, napi_callback_info info);

    /**
     * @brief Set function calling configuration for the LLM
     * @param env N-API environment
     * @param info Callback info containing handle and function tools config
     * @return napi_value JavaScript number (status code)
     */
    static napi_value SetFunctionTools(napi_env env, napi_callback_info info);

    /**
     * @brief Set cross-attention parameters for the LLM decoder
     * @param env N-API environment
     * @param info Callback info containing handle and cross-attention params
     * @return napi_value JavaScript number (status code)
     */
    static napi_value SetCrossAttnParams(napi_env env, napi_callback_info info);

    // === Helper Functions for Type Conversion ===

    /**
     * @brief Helper to convert JavaScript object to RKLLMParam struct (complete)
     * @param env N-API environment
     * @param js_param JavaScript parameter object
     * @param param Output C++ parameter struct
     * @return napi_status
     */
    static napi_status JSToRKLLMParam(napi_env env, napi_value js_param, RKLLMParam* param);

    /**
     * @brief Helper to convert RKLLMParam struct to JavaScript object (complete)
     * @param env N-API environment
     * @param param C++ parameter struct
     * @param js_param Output JavaScript object
     * @return napi_status
     */
    static napi_status RKLLMParamToJS(napi_env env, const RKLLMParam* param, napi_value* js_param);

    /**
     * @brief Helper to convert JavaScript object to RKLLMInput struct
     * @param env N-API environment
     * @param js_input JavaScript input object
     * @param input Output C++ input struct
     * @return napi_status
     */
    static napi_status JSToRKLLMInput(napi_env env, napi_value js_input, RKLLMInput* input);

    /**
     * @brief Helper to convert JavaScript object to RKLLMInferParam struct
     * @param env N-API environment
     * @param js_infer_param JavaScript inference parameter object
     * @param infer_param Output C++ inference parameter struct
     * @return napi_status
     */
    static napi_status JSToRKLLMInferParam(napi_env env, napi_value js_infer_param, RKLLMInferParam* infer_param);

    /**
     * @brief Helper to convert JavaScript object to RKLLMLoraAdapter struct
     * @param env N-API environment
     * @param js_lora_adapter JavaScript LoRA adapter object
     * @param lora_adapter Output C++ LoRA adapter struct
     * @return napi_status
     */
    static napi_status JSToRKLLMLoraAdapter(napi_env env, napi_value js_lora_adapter, RKLLMLoraAdapter* lora_adapter);

    /**
     * @brief Helper to convert JavaScript object to RKLLMCrossAttnParam struct
     * @param env N-API environment
     * @param js_cross_attn_param JavaScript cross-attention parameter object
     * @param cross_attn_param Output C++ cross-attention parameter struct
     * @return napi_status
     */
    static napi_status JSToRKLLMCrossAttnParam(napi_env env, napi_value js_cross_attn_param, RKLLMCrossAttnParam* cross_attn_param);

    /**
     * @brief Helper to convert RKLLMResult struct to JavaScript object
     * @param env N-API environment
     * @param result C++ result struct
     * @param js_result Output JavaScript object
     * @return napi_status
     */
    static napi_status RKLLMResultToJS(napi_env env, const RKLLMResult* result, napi_value* js_result);

    /**
     * @brief Helper to validate LLM handle
     * @param env N-API environment
     * @param js_handle JavaScript handle object
     * @param handle Output native handle
     * @return napi_status
     */
    static napi_status ValidateHandle(napi_env env, napi_value js_handle, void** handle);

    /**
     * @brief Helper to create typed array from C array
     * @param env N-API environment
     * @param data Pointer to C array data
     * @param length Length of the array
     * @param js_array Output JavaScript typed array
     * @return napi_status
     */
    static napi_status CreateTypedArray(napi_env env, void* data, size_t length, napi_typedarray_type type, napi_value* js_array);
};

} // namespace bindings
} // namespace rkllmjs

#endif // LLM_HANDLE_HPP