#include "llm-handle.hpp"
#include <string>
#include <memory>
#include <cstring>

namespace rkllmjs {
namespace bindings {

// Static callback for result handling - will be set during init
static LLMResultCallback result_callback = nullptr;

/**
 * @brief Internal result callback handler for RKLLM
 * This function is called by the RKLLM library and forwards results to JavaScript
 */
static int InternalResultCallback(RKLLMResult* result, void* userdata, LLMCallState state) {
    // For now, just continue inference normally
    // In a full implementation, this would convert the result to JavaScript and call the user callback
    return 0;
}

napi_status LLMHandleBinding::Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // Export createDefaultParam function
    status = napi_create_function(env, "createDefaultParam", NAPI_AUTO_LENGTH, CreateDefaultParam, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "createDefaultParam", fn);
    if (status != napi_ok) return status;

    // Export init function
    status = napi_create_function(env, "init", NAPI_AUTO_LENGTH, Init, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "init", fn);
    if (status != napi_ok) return status;

    // Export destroy function  
    status = napi_create_function(env, "destroy", NAPI_AUTO_LENGTH, Destroy, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "destroy", fn);
    if (status != napi_ok) return status;

    // Export LoRA functions
    status = napi_create_function(env, "loadLora", NAPI_AUTO_LENGTH, LoadLora, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "loadLora", fn);
    if (status != napi_ok) return status;

    // Export prompt cache functions
    status = napi_create_function(env, "loadPromptCache", NAPI_AUTO_LENGTH, LoadPromptCache, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "loadPromptCache", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "releasePromptCache", NAPI_AUTO_LENGTH, ReleasePromptCache, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "releasePromptCache", fn);
    if (status != napi_ok) return status;

    // Export inference functions
    status = napi_create_function(env, "run", NAPI_AUTO_LENGTH, Run, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "run", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "runAsync", NAPI_AUTO_LENGTH, RunAsync, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "runAsync", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "abort", NAPI_AUTO_LENGTH, Abort, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "abort", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "isRunning", NAPI_AUTO_LENGTH, IsRunning, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "isRunning", fn);
    if (status != napi_ok) return status;

    // Export KV cache functions
    status = napi_create_function(env, "clearKVCache", NAPI_AUTO_LENGTH, ClearKVCache, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "clearKVCache", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "getKVCacheSize", NAPI_AUTO_LENGTH, GetKVCacheSize, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "getKVCacheSize", fn);
    if (status != napi_ok) return status;

    // Export configuration functions
    status = napi_create_function(env, "setChatTemplate", NAPI_AUTO_LENGTH, SetChatTemplate, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "setChatTemplate", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "setFunctionTools", NAPI_AUTO_LENGTH, SetFunctionTools, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "setFunctionTools", fn);
    if (status != napi_ok) return status;

    status = napi_create_function(env, "setCrossAttnParams", NAPI_AUTO_LENGTH, SetCrossAttnParams, nullptr, &fn);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, exports, "setCrossAttnParams", fn);
    if (status != napi_ok) return status;

    return napi_ok;
}

napi_value LLMHandleBinding::CreateDefaultParam(napi_env env, napi_callback_info info) {
    napi_status status;
    napi_value result;

    // Call RKLLM to get default parameters
    RKLLMParam default_param = rkllm_createDefaultParam();

    // Convert to JavaScript object
    status = RKLLMParamToJS(env, &default_param, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create default parameters");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::Init(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value argv[2];
    napi_value this_arg;
    void* data;

    // Get arguments: parameters object and callback function
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected at least 1 argument (parameters)");
        return nullptr;
    }

    // Convert JavaScript parameters to C struct
    RKLLMParam param;
    status = JSToRKLLMParam(env, argv[0], &param);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid parameters object");
        return nullptr;
    }

    // Initialize RKLLM - note: LLMHandle is typedef void* in rkllm.h
    ::LLMHandle native_handle = nullptr;
    
    // Add error logging before initialization
    printf("🔧 Attempting RKLLM initialization...\n");
    printf("📁 Model path: %s\n", param.model_path);
    printf("🧠 Context length: %d\n", param.max_context_len);
    printf("🎯 Max tokens: %d\n", param.max_new_tokens);
    
    int init_result = rkllm_init(&native_handle, &param, InternalResultCallback);
    
    printf("📊 RKLLM init result: %d\n", init_result);
    
    if (init_result != 0) {
        char error_msg[256];
        snprintf(error_msg, sizeof(error_msg), "Failed to initialize RKLLM (error code: %d)", init_result);
        napi_throw_error(env, nullptr, error_msg);
        return nullptr;
    }
    
    if (native_handle == nullptr) {
        napi_throw_error(env, nullptr, "RKLLM initialization returned null handle");
        return nullptr;
    }
    
    printf("✅ RKLLM initialized successfully!\n");

    // Create JavaScript object to hold the handle
    napi_value js_handle;
    status = napi_create_object(env, &js_handle);
    if (status != napi_ok) {
        rkllm_destroy(native_handle);
        napi_throw_error(env, nullptr, "Failed to create handle object");
        return nullptr;
    }

    // Store the native handle as an external value
    napi_value external;
    status = napi_create_external(env, native_handle, nullptr, nullptr, &external);
    if (status != napi_ok) {
        rkllm_destroy(native_handle);
        napi_throw_error(env, nullptr, "Failed to create external handle");
        return nullptr;
    }

    status = napi_set_named_property(env, js_handle, "_handle", external);
    if (status != napi_ok) {
        rkllm_destroy(native_handle);
        napi_throw_error(env, nullptr, "Failed to set handle property");
        return nullptr;
    }

    return js_handle;
}

napi_value LLMHandleBinding::Destroy(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value this_arg;
    void* data;

    // Get handle argument
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument (handle)");
        return nullptr;
    }

    // Extract native handle
    napi_value handle_prop;
    status = napi_get_named_property(env, argv[0], "_handle", &handle_prop);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    void* native_handle;
    status = napi_get_value_external(env, handle_prop, &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to extract native handle");
        return nullptr;
    }

    // Destroy RKLLM instance
    int destroy_result = rkllm_destroy(static_cast<::LLMHandle>(native_handle));

    // Return success status
    napi_value result;
    status = napi_get_boolean(env, destroy_result == 0, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

// === LoRA Functions ===

napi_value LLMHandleBinding::LoadLora(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value argv[2];
    napi_value this_arg;
    void* data;

    // Get arguments: handle and LoRA adapter config
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 2) {
        napi_throw_error(env, nullptr, "Expected 2 arguments (handle, lora_adapter)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Convert JavaScript LoRA adapter to C struct
    RKLLMLoraAdapter lora_adapter;
    status = JSToRKLLMLoraAdapter(env, argv[1], &lora_adapter);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid LoRA adapter object");
        return nullptr;
    }

    // Load LoRA adapter
    int load_result = rkllm_load_lora(static_cast<::LLMHandle>(native_handle), &lora_adapter);

    // Return status code
    napi_value result;
    status = napi_create_int32(env, load_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

// === Prompt Cache Functions ===

napi_value LLMHandleBinding::LoadPromptCache(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value argv[2];
    napi_value this_arg;
    void* data;

    // Get arguments: handle and cache path
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 2) {
        napi_throw_error(env, nullptr, "Expected 2 arguments (handle, prompt_cache_path)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Get cache path string
    size_t str_size;
    status = napi_get_value_string_utf8(env, argv[1], nullptr, 0, &str_size);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid prompt cache path");
        return nullptr;
    }

    char* cache_path = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[1], cache_path, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] cache_path;
        napi_throw_error(env, nullptr, "Failed to extract prompt cache path");
        return nullptr;
    }

    // Load prompt cache
    int load_result = rkllm_load_prompt_cache(static_cast<::LLMHandle>(native_handle), cache_path);
    delete[] cache_path;

    // Return status code
    napi_value result;
    status = napi_create_int32(env, load_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::ReleasePromptCache(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value this_arg;
    void* data;

    // Get handle argument
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument (handle)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Release prompt cache
    int release_result = rkllm_release_prompt_cache(static_cast<::LLMHandle>(native_handle));

    // Return status code
    napi_value result;
    status = napi_create_int32(env, release_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

// === Inference Functions ===

napi_value LLMHandleBinding::Run(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 4;
    napi_value argv[4];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, input, infer_params, userdata
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 3) {
        napi_throw_error(env, nullptr, "Expected at least 3 arguments (handle, input, infer_params)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Convert JavaScript input to C struct
    RKLLMInput input;
    status = JSToRKLLMInput(env, argv[1], &input);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid input object");
        return nullptr;
    }

    // Convert JavaScript inference parameters to C struct
    RKLLMInferParam infer_params;
    status = JSToRKLLMInferParam(env, argv[2], &infer_params);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid inference parameters object");
        return nullptr;
    }

    // Get userdata (optional)
    void* userdata = nullptr;
    if (argc >= 4) {
        // Store JavaScript userdata for callback access
        // For now, we'll pass nullptr to the native function
        userdata = nullptr;
    }

    // Run inference
    int run_result = rkllm_run(static_cast<::LLMHandle>(native_handle), &input, &infer_params, userdata);

    // Return status code
    napi_value result;
    status = napi_create_int32(env, run_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::RunAsync(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 4;
    napi_value argv[4];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, input, infer_params, userdata
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 3) {
        napi_throw_error(env, nullptr, "Expected at least 3 arguments (handle, input, infer_params)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Convert JavaScript input to C struct
    RKLLMInput input;
    status = JSToRKLLMInput(env, argv[1], &input);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid input object");
        return nullptr;
    }

    // Convert JavaScript inference parameters to C struct
    RKLLMInferParam infer_params;
    status = JSToRKLLMInferParam(env, argv[2], &infer_params);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid inference parameters object");
        return nullptr;
    }

    // Get userdata (optional)
    void* userdata = nullptr;
    if (argc >= 4) {
        // Store JavaScript userdata for callback access
        userdata = nullptr;
    }

    // Run async inference
    int run_result = rkllm_run_async(static_cast<::LLMHandle>(native_handle), &input, &infer_params, userdata);

    // Return status code
    napi_value result;
    status = napi_create_int32(env, run_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::Abort(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value this_arg;
    void* data;

    // Get handle argument
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument (handle)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Abort LLM task
    int abort_result = rkllm_abort(static_cast<::LLMHandle>(native_handle));

    // Return status code
    napi_value result;
    status = napi_create_int32(env, abort_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::IsRunning(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value this_arg;
    void* data;

    // Get handle argument
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument (handle)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Check if running
    int is_running_result = rkllm_is_running(static_cast<::LLMHandle>(native_handle));

    // Return status code
    napi_value result;
    status = napi_create_int32(env, is_running_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

// === Key-Value Cache Functions ===

napi_value LLMHandleBinding::ClearKVCache(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 4;
    napi_value argv[4];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, keep_system_prompt, start_pos, end_pos
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 2) {
        napi_throw_error(env, nullptr, "Expected at least 2 arguments (handle, keep_system_prompt)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Get keep_system_prompt flag
    bool keep_system_prompt;
    status = napi_get_value_bool(env, argv[1], &keep_system_prompt);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid keep_system_prompt flag");
        return nullptr;
    }

    // Get optional start_pos and end_pos arrays
    int* start_pos = nullptr;
    int* end_pos = nullptr;
    
    if (argc >= 3 && argv[2] != nullptr) {
        // TODO: Extract start_pos array from JavaScript typed array
        // For now, pass nullptr
    }
    
    if (argc >= 4 && argv[3] != nullptr) {
        // TODO: Extract end_pos array from JavaScript typed array
        // For now, pass nullptr
    }

    // Clear KV cache
    int clear_result = rkllm_clear_kv_cache(static_cast<::LLMHandle>(native_handle), 
                                           keep_system_prompt ? 1 : 0, start_pos, end_pos);

    // Return status code
    napi_value result;
    status = napi_create_int32(env, clear_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::GetKVCacheSize(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];
    napi_value this_arg;
    void* data;

    // Get handle argument
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, nullptr, "Expected 1 argument (handle)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Allocate temporary buffer for cache sizes
    // TODO: Get actual n_batch from model parameters
    int cache_sizes[8]; // Assume max 8 batches for now
    
    // Get KV cache size
    int get_result = rkllm_get_kv_cache_size(static_cast<::LLMHandle>(native_handle), cache_sizes);
    
    if (get_result != 0) {
        napi_throw_error(env, nullptr, "Failed to get KV cache size");
        return nullptr;
    }

    // Create JavaScript typed array
    napi_value result;
    status = CreateTypedArray(env, cache_sizes, 8, napi_int32_array, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create typed array");
        return nullptr;
    }

    return result;
}

// === Configuration Functions ===

napi_value LLMHandleBinding::SetChatTemplate(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 4;
    napi_value argv[4];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, system_prompt, prompt_prefix, prompt_postfix
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 4) {
        napi_throw_error(env, nullptr, "Expected 4 arguments (handle, system_prompt, prompt_prefix, prompt_postfix)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Get system_prompt string
    size_t str_size;
    status = napi_get_value_string_utf8(env, argv[1], nullptr, 0, &str_size);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid system_prompt");
        return nullptr;
    }
    char* system_prompt = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[1], system_prompt, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        napi_throw_error(env, nullptr, "Failed to extract system_prompt");
        return nullptr;
    }

    // Get prompt_prefix string
    status = napi_get_value_string_utf8(env, argv[2], nullptr, 0, &str_size);
    if (status != napi_ok) {
        delete[] system_prompt;
        napi_throw_error(env, nullptr, "Invalid prompt_prefix");
        return nullptr;
    }
    char* prompt_prefix = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[2], prompt_prefix, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] prompt_prefix;
        napi_throw_error(env, nullptr, "Failed to extract prompt_prefix");
        return nullptr;
    }

    // Get prompt_postfix string
    status = napi_get_value_string_utf8(env, argv[3], nullptr, 0, &str_size);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] prompt_prefix;
        napi_throw_error(env, nullptr, "Invalid prompt_postfix");
        return nullptr;
    }
    char* prompt_postfix = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[3], prompt_postfix, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] prompt_prefix;
        delete[] prompt_postfix;
        napi_throw_error(env, nullptr, "Failed to extract prompt_postfix");
        return nullptr;
    }

    // Set chat template
    int set_result = rkllm_set_chat_template(static_cast<::LLMHandle>(native_handle), 
                                           system_prompt, prompt_prefix, prompt_postfix);
    
    // Clean up strings
    delete[] system_prompt;
    delete[] prompt_prefix;
    delete[] prompt_postfix;

    // Return status code
    napi_value result;
    status = napi_create_int32(env, set_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::SetFunctionTools(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 4;
    napi_value argv[4];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, system_prompt, tools, tool_response_str
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 4) {
        napi_throw_error(env, nullptr, "Expected 4 arguments (handle, system_prompt, tools, tool_response_str)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Get system_prompt string
    size_t str_size;
    status = napi_get_value_string_utf8(env, argv[1], nullptr, 0, &str_size);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid system_prompt");
        return nullptr;
    }
    char* system_prompt = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[1], system_prompt, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        napi_throw_error(env, nullptr, "Failed to extract system_prompt");
        return nullptr;
    }

    // Get tools string
    status = napi_get_value_string_utf8(env, argv[2], nullptr, 0, &str_size);
    if (status != napi_ok) {
        delete[] system_prompt;
        napi_throw_error(env, nullptr, "Invalid tools");
        return nullptr;
    }
    char* tools = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[2], tools, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] tools;
        napi_throw_error(env, nullptr, "Failed to extract tools");
        return nullptr;
    }

    // Get tool_response_str string
    status = napi_get_value_string_utf8(env, argv[3], nullptr, 0, &str_size);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] tools;
        napi_throw_error(env, nullptr, "Invalid tool_response_str");
        return nullptr;
    }
    char* tool_response_str = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, argv[3], tool_response_str, str_size + 1, nullptr);
    if (status != napi_ok) {
        delete[] system_prompt;
        delete[] tools;
        delete[] tool_response_str;
        napi_throw_error(env, nullptr, "Failed to extract tool_response_str");
        return nullptr;
    }

    // Set function tools
    int set_result = rkllm_set_function_tools(static_cast<::LLMHandle>(native_handle), 
                                            system_prompt, tools, tool_response_str);
    
    // Clean up strings
    delete[] system_prompt;
    delete[] tools;
    delete[] tool_response_str;

    // Return status code
    napi_value result;
    status = napi_create_int32(env, set_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

napi_value LLMHandleBinding::SetCrossAttnParams(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 2;
    napi_value argv[2];
    napi_value this_arg;
    void* data;

    // Get arguments: handle, cross_attn_params
    status = napi_get_cb_info(env, info, &argc, argv, &this_arg, &data);
    if (status != napi_ok || argc < 2) {
        napi_throw_error(env, nullptr, "Expected 2 arguments (handle, cross_attn_params)");
        return nullptr;
    }

    // Extract native handle
    void* native_handle;
    status = ValidateHandle(env, argv[0], &native_handle);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid handle object");
        return nullptr;
    }

    // Convert JavaScript cross-attention parameters to C struct
    RKLLMCrossAttnParam cross_attn_params;
    status = JSToRKLLMCrossAttnParam(env, argv[1], &cross_attn_params);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Invalid cross-attention parameters object");
        return nullptr;
    }

    // Set cross-attention parameters
    int set_result = rkllm_set_cross_attn_params(static_cast<::LLMHandle>(native_handle), &cross_attn_params);

    // Return status code
    napi_value result;
    status = napi_create_int32(env, set_result, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create return value");
        return nullptr;
    }

    return result;
}

// === Helper Functions for Type Conversion ===

napi_status LLMHandleBinding::JSToRKLLMParam(napi_env env, napi_value js_param, RKLLMParam* param) {
    napi_status status;
    napi_value prop;

    // Initialize with defaults
    *param = rkllm_createDefaultParam();

    // Get model_path (required)
    status = napi_get_named_property(env, js_param, "model_path", &prop);
    if (status == napi_ok) {
        size_t str_size;
        status = napi_get_value_string_utf8(env, prop, nullptr, 0, &str_size);
        if (status != napi_ok) return status;
        
        char* model_path = new char[str_size + 1];
        status = napi_get_value_string_utf8(env, prop, model_path, str_size + 1, nullptr);
        if (status != napi_ok) {
            delete[] model_path;
            return status;
        }
        param->model_path = model_path;
    }

    // Get max_context_len (optional)
    status = napi_get_named_property(env, js_param, "max_context_len", &prop);
    if (status == napi_ok) {
        int32_t value;
        status = napi_get_value_int32(env, prop, &value);
        if (status == napi_ok) {
            param->max_context_len = value;
        }
    }

    // Get max_new_tokens (optional)
    status = napi_get_named_property(env, js_param, "max_new_tokens", &prop);
    if (status == napi_ok) {
        int32_t value;
        status = napi_get_value_int32(env, prop, &value);
        if (status == napi_ok) {
            param->max_new_tokens = value;
        }
    }

    // Get temperature (optional)
    status = napi_get_named_property(env, js_param, "temperature", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->temperature = static_cast<float>(value);
        }
    }

    // Get top_k (optional)
    status = napi_get_named_property(env, js_param, "top_k", &prop);
    if (status == napi_ok) {
        int32_t value;
        status = napi_get_value_int32(env, prop, &value);
        if (status == napi_ok) {
            param->top_k = value;
        }
    }

    // Get n_keep (optional)
    status = napi_get_named_property(env, js_param, "n_keep", &prop);
    if (status == napi_ok) {
        int32_t value;
        status = napi_get_value_int32(env, prop, &value);
        if (status == napi_ok) {
            param->n_keep = value;
        }
    }

    // Get top_p (optional)
    status = napi_get_named_property(env, js_param, "top_p", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->top_p = static_cast<float>(value);
        }
    }

    // Get repeat_penalty (optional)
    status = napi_get_named_property(env, js_param, "repeat_penalty", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->repeat_penalty = static_cast<float>(value);
        }
    }

    // Get frequency_penalty (optional)
    status = napi_get_named_property(env, js_param, "frequency_penalty", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->frequency_penalty = static_cast<float>(value);
        }
    }

    // Get presence_penalty (optional)
    status = napi_get_named_property(env, js_param, "presence_penalty", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->presence_penalty = static_cast<float>(value);
        }
    }

    // Get mirostat (optional)
    status = napi_get_named_property(env, js_param, "mirostat", &prop);
    if (status == napi_ok) {
        int32_t value;
        status = napi_get_value_int32(env, prop, &value);
        if (status == napi_ok) {
            param->mirostat = value;
        }
    }

    // Get mirostat_tau (optional)
    status = napi_get_named_property(env, js_param, "mirostat_tau", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->mirostat_tau = static_cast<float>(value);
        }
    }

    // Get mirostat_eta (optional)
    status = napi_get_named_property(env, js_param, "mirostat_eta", &prop);
    if (status == napi_ok) {
        double value;
        status = napi_get_value_double(env, prop, &value);
        if (status == napi_ok) {
            param->mirostat_eta = static_cast<float>(value);
        }
    }

    // Get skip_special_token (optional)
    status = napi_get_named_property(env, js_param, "skip_special_token", &prop);
    if (status == napi_ok) {
        bool value;
        status = napi_get_value_bool(env, prop, &value);
        if (status == napi_ok) {
            param->skip_special_token = value;
        }
    }

    // Get is_async (optional)
    status = napi_get_named_property(env, js_param, "is_async", &prop);
    if (status == napi_ok) {
        bool value;
        status = napi_get_value_bool(env, prop, &value);
        if (status == napi_ok) {
            param->is_async = value;
        }
    }

    // TODO: Add support for img_start, img_end, img_content, and extend_param
    // These require more complex handling

    return napi_ok;
}

napi_status LLMHandleBinding::RKLLMParamToJS(napi_env env, const RKLLMParam* param, napi_value* js_param) {
    napi_status status;
    napi_value obj, prop;

    // Create JavaScript object
    status = napi_create_object(env, &obj);
    if (status != napi_ok) return status;

    // Set model_path
    if (param->model_path) {
        status = napi_create_string_utf8(env, param->model_path, NAPI_AUTO_LENGTH, &prop);
        if (status != napi_ok) return status;
        status = napi_set_named_property(env, obj, "model_path", prop);
        if (status != napi_ok) return status;
    }

    // Set max_context_len
    status = napi_create_int32(env, param->max_context_len, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "max_context_len", prop);
    if (status != napi_ok) return status;

    // Set max_new_tokens
    status = napi_create_int32(env, param->max_new_tokens, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "max_new_tokens", prop);
    if (status != napi_ok) return status;

    // Set temperature
    status = napi_create_double(env, static_cast<double>(param->temperature), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "temperature", prop);
    if (status != napi_ok) return status;

    // Set top_k
    status = napi_create_int32(env, param->top_k, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "top_k", prop);
    if (status != napi_ok) return status;

    // Set top_p
    status = napi_create_double(env, static_cast<double>(param->top_p), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "top_p", prop);
    if (status != napi_ok) return status;

    // Set n_keep
    status = napi_create_int32(env, param->n_keep, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "n_keep", prop);
    if (status != napi_ok) return status;

    // Set repeat_penalty
    status = napi_create_double(env, static_cast<double>(param->repeat_penalty), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "repeat_penalty", prop);
    if (status != napi_ok) return status;

    // Set frequency_penalty
    status = napi_create_double(env, static_cast<double>(param->frequency_penalty), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "frequency_penalty", prop);
    if (status != napi_ok) return status;

    // Set presence_penalty
    status = napi_create_double(env, static_cast<double>(param->presence_penalty), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "presence_penalty", prop);
    if (status != napi_ok) return status;

    // Set mirostat
    status = napi_create_int32(env, param->mirostat, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "mirostat", prop);
    if (status != napi_ok) return status;

    // Set mirostat_tau
    status = napi_create_double(env, static_cast<double>(param->mirostat_tau), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "mirostat_tau", prop);
    if (status != napi_ok) return status;

    // Set mirostat_eta
    status = napi_create_double(env, static_cast<double>(param->mirostat_eta), &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "mirostat_eta", prop);
    if (status != napi_ok) return status;

    // Set skip_special_token
    status = napi_get_boolean(env, param->skip_special_token, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "skip_special_token", prop);
    if (status != napi_ok) return status;

    // Set is_async
    status = napi_get_boolean(env, param->is_async, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "is_async", prop);
    if (status != napi_ok) return status;

    // TODO: Add support for img_start, img_end, img_content, and extend_param

    *js_param = obj;
    return napi_ok;
}

napi_status LLMHandleBinding::ValidateHandle(napi_env env, napi_value js_handle, void** handle) {
    napi_status status;
    napi_value handle_prop;

    status = napi_get_named_property(env, js_handle, "_handle", &handle_prop);
    if (status != napi_ok) return status;

    status = napi_get_value_external(env, handle_prop, handle);
    if (status != napi_ok) return status;

    return napi_ok;
}

// === Additional Helper Functions (Placeholders for complex types) ===

napi_status LLMHandleBinding::JSToRKLLMInput(napi_env env, napi_value js_input, RKLLMInput* input) {
    napi_status status;
    napi_value prop;
    bool has_prop;
    
    // Initialize structure with defaults
    memset(input, 0, sizeof(RKLLMInput));
    input->input_type = RKLLM_INPUT_PROMPT; // Default
    
    // Debug: Check if js_input is an object
    napi_valuetype valuetype;
    status = napi_typeof(env, js_input, &valuetype);
    if (status != napi_ok || valuetype != napi_object) {
        printf("DEBUG: JSToRKLLMInput - input is not an object, type: %d\n", valuetype);
        return napi_invalid_arg;
    }
    
    // Get input_type
    status = napi_has_named_property(env, js_input, "input_type", &has_prop);
    if (status == napi_ok && has_prop) {
        status = napi_get_named_property(env, js_input, "input_type", &prop);
        if (status == napi_ok) {
            int32_t input_type;
            status = napi_get_value_int32(env, prop, &input_type);
            if (status == napi_ok) {
                input->input_type = static_cast<RKLLMInputType>(input_type);
                printf("DEBUG: JSToRKLLMInput - input_type: %d\n", input_type);
            } else {
                printf("DEBUG: JSToRKLLMInput - failed to get input_type value\n");
            }
        }
    } else {
        printf("DEBUG: JSToRKLLMInput - input_type property not found\n");
    }
    
    // Get role (optional)
    status = napi_has_named_property(env, js_input, "role", &has_prop);
    if (status == napi_ok && has_prop) {
        status = napi_get_named_property(env, js_input, "role", &prop);
        if (status == napi_ok) {
            size_t str_size;
            status = napi_get_value_string_utf8(env, prop, nullptr, 0, &str_size);
            if (status == napi_ok && str_size > 0) {
                char* role = new char[str_size + 1];
                status = napi_get_value_string_utf8(env, prop, role, str_size + 1, nullptr);
                if (status == napi_ok) {
                    input->role = role;
                    printf("DEBUG: JSToRKLLMInput - role: %s\n", role);
                } else {
                    delete[] role;
                }
            }
        }
    }
    
    // Get enable_thinking (optional)
    status = napi_has_named_property(env, js_input, "enable_thinking", &has_prop);
    if (status == napi_ok && has_prop) {
        status = napi_get_named_property(env, js_input, "enable_thinking", &prop);
        if (status == napi_ok) {
            bool enable_thinking;
            status = napi_get_value_bool(env, prop, &enable_thinking);
            if (status == napi_ok) {
                input->enable_thinking = enable_thinking;
                printf("DEBUG: JSToRKLLMInput - enable_thinking: %s\n", enable_thinking ? "true" : "false");
            }
        }
    }
    
    // For prompt input type, get the prompt string
    if (input->input_type == RKLLM_INPUT_PROMPT) {
        status = napi_has_named_property(env, js_input, "prompt_input", &has_prop);
        if (status == napi_ok && has_prop) {
            status = napi_get_named_property(env, js_input, "prompt_input", &prop);
            if (status == napi_ok) {
                size_t str_size;
                status = napi_get_value_string_utf8(env, prop, nullptr, 0, &str_size);
                if (status == napi_ok && str_size > 0) {
                    char* prompt = new char[str_size + 1];
                    status = napi_get_value_string_utf8(env, prop, prompt, str_size + 1, nullptr);
                    if (status == napi_ok) {
                        input->prompt_input = prompt;
                        printf("DEBUG: JSToRKLLMInput - prompt_input: %.50s%s\n", 
                               prompt, strlen(prompt) > 50 ? "..." : "");
                    } else {
                        delete[] prompt;
                        printf("DEBUG: JSToRKLLMInput - failed to get prompt_input string\n");
                        return status;
                    }
                } else {
                    printf("DEBUG: JSToRKLLMInput - prompt_input is empty\n");
                    return napi_invalid_arg;
                }
            } else {
                printf("DEBUG: JSToRKLLMInput - failed to get prompt_input property\n");
                return status;
            }
        } else {
            printf("DEBUG: JSToRKLLMInput - prompt_input property not found for PROMPT input type\n");
            return napi_invalid_arg;
        }
    }
    
    printf("DEBUG: JSToRKLLMInput - conversion completed successfully\n");
    return napi_ok;
}

napi_status LLMHandleBinding::JSToRKLLMInferParam(napi_env env, napi_value js_infer_param, RKLLMInferParam* infer_param) {
    napi_status status;
    napi_value prop;
    bool has_prop;
    
    // Initialize with defaults
    memset(infer_param, 0, sizeof(RKLLMInferParam));
    infer_param->mode = RKLLM_INFER_GENERATE; // Default
    infer_param->lora_params = nullptr;
    infer_param->prompt_cache_params = nullptr;
    infer_param->keep_history = 1; // Default to keep history
    
    // Debug: Check if js_infer_param is an object
    napi_valuetype valuetype;
    status = napi_typeof(env, js_infer_param, &valuetype);
    if (status != napi_ok || valuetype != napi_object) {
        printf("DEBUG: JSToRKLLMInferParam - input is not an object, type: %d\n", valuetype);
        return napi_invalid_arg;
    }
    
    // Get mode
    status = napi_has_named_property(env, js_infer_param, "mode", &has_prop);
    if (status == napi_ok && has_prop) {
        status = napi_get_named_property(env, js_infer_param, "mode", &prop);
        if (status == napi_ok) {
            int32_t mode;
            status = napi_get_value_int32(env, prop, &mode);
            if (status == napi_ok) {
                infer_param->mode = static_cast<RKLLMInferMode>(mode);
                printf("DEBUG: JSToRKLLMInferParam - mode: %d\n", mode);
            } else {
                printf("DEBUG: JSToRKLLMInferParam - failed to get mode value\n");
            }
        }
    } else {
        printf("DEBUG: JSToRKLLMInferParam - mode property not found, using default\n");
    }
    
    // Get keep_history
    status = napi_has_named_property(env, js_infer_param, "keep_history", &has_prop);
    if (status == napi_ok && has_prop) {
        status = napi_get_named_property(env, js_infer_param, "keep_history", &prop);
        if (status == napi_ok) {
            int32_t keep_history;
            status = napi_get_value_int32(env, prop, &keep_history);
            if (status == napi_ok) {
                infer_param->keep_history = keep_history;
                printf("DEBUG: JSToRKLLMInferParam - keep_history: %d\n", keep_history);
            } else {
                // Try boolean conversion
                bool keep_history_bool;
                status = napi_get_value_bool(env, prop, &keep_history_bool);
                if (status == napi_ok) {
                    infer_param->keep_history = keep_history_bool ? 1 : 0;
                    printf("DEBUG: JSToRKLLMInferParam - keep_history (bool): %s\n", keep_history_bool ? "true" : "false");
                }
            }
        }
    } else {
        printf("DEBUG: JSToRKLLMInferParam - keep_history property not found, using default\n");
    }
    
    printf("DEBUG: JSToRKLLMInferParam - conversion completed successfully\n");
    return napi_ok;
}

napi_status LLMHandleBinding::JSToRKLLMLoraAdapter(napi_env env, napi_value js_lora_adapter, RKLLMLoraAdapter* lora_adapter) {
    napi_status status;
    napi_value prop;
    
    // Get lora_adapter_path
    status = napi_get_named_property(env, js_lora_adapter, "lora_adapter_path", &prop);
    if (status == napi_ok) {
        size_t str_size;
        status = napi_get_value_string_utf8(env, prop, nullptr, 0, &str_size);
        if (status != napi_ok) return status;
        
        char* path = new char[str_size + 1];
        status = napi_get_value_string_utf8(env, prop, path, str_size + 1, nullptr);
        if (status != napi_ok) {
            delete[] path;
            return status;
        }
        lora_adapter->lora_adapter_path = path;
    }
    
    // Get lora_adapter_name
    status = napi_get_named_property(env, js_lora_adapter, "lora_adapter_name", &prop);
    if (status == napi_ok) {
        size_t str_size;
        status = napi_get_value_string_utf8(env, prop, nullptr, 0, &str_size);
        if (status != napi_ok) return status;
        
        char* name = new char[str_size + 1];
        status = napi_get_value_string_utf8(env, prop, name, str_size + 1, nullptr);
        if (status != napi_ok) {
            delete[] name;
            return status;
        }
        lora_adapter->lora_adapter_name = name;
    }
    
    // Get scale
    status = napi_get_named_property(env, js_lora_adapter, "scale", &prop);
    if (status == napi_ok) {
        double scale;
        status = napi_get_value_double(env, prop, &scale);
        if (status == napi_ok) {
            lora_adapter->scale = static_cast<float>(scale);
        }
    }
    
    return napi_ok;
}

napi_status LLMHandleBinding::JSToRKLLMCrossAttnParam(napi_env env, napi_value js_cross_attn_param, RKLLMCrossAttnParam* cross_attn_param) {
    // TODO: Implement full conversion for cross-attention parameters
    // This involves complex typed array handling
    
    napi_status status;
    napi_value prop;
    
    // Get num_tokens first
    status = napi_get_named_property(env, js_cross_attn_param, "num_tokens", &prop);
    if (status == napi_ok) {
        int32_t num_tokens;
        status = napi_get_value_int32(env, prop, &num_tokens);
        if (status == napi_ok) {
            cross_attn_param->num_tokens = num_tokens;
        }
    }
    
    // For now, set pointers to nullptr - full implementation would extract typed arrays
    cross_attn_param->encoder_k_cache = nullptr;
    cross_attn_param->encoder_v_cache = nullptr;
    cross_attn_param->encoder_mask = nullptr;
    cross_attn_param->encoder_pos = nullptr;
    
    return napi_ok;
}

napi_status LLMHandleBinding::RKLLMResultToJS(napi_env env, const RKLLMResult* result, napi_value* js_result) {
    // TODO: Implement full conversion from C RKLLMResult to JavaScript object
    napi_status status;
    napi_value obj, prop;

    // Create JavaScript object
    status = napi_create_object(env, &obj);
    if (status != napi_ok) return status;

    // Set text
    if (result->text) {
        status = napi_create_string_utf8(env, result->text, NAPI_AUTO_LENGTH, &prop);
        if (status != napi_ok) return status;
        status = napi_set_named_property(env, obj, "text", prop);
        if (status != napi_ok) return status;
    }

    // Set token_id
    status = napi_create_int32(env, result->token_id, &prop);
    if (status != napi_ok) return status;
    status = napi_set_named_property(env, obj, "token_id", prop);
    if (status != napi_ok) return status;

    *js_result = obj;
    return napi_ok;
}

napi_status LLMHandleBinding::CreateTypedArray(napi_env env, void* data, size_t length, napi_typedarray_type type, napi_value* js_array) {
    napi_status status;
    napi_value array_buffer;
    
    // Create array buffer
    void* buffer_data;
    status = napi_create_arraybuffer(env, length * sizeof(int32_t), &buffer_data, &array_buffer);
    if (status != napi_ok) return status;
    
    // Copy data to buffer
    memcpy(buffer_data, data, length * sizeof(int32_t));
    
    // Create typed array
    status = napi_create_typedarray(env, type, length, array_buffer, 0, js_array);
    if (status != napi_ok) return status;
    
    return napi_ok;
}

} // namespace bindings
} // namespace rkllmjs