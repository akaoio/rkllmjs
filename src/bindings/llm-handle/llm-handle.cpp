#include "llm-handle.hpp"
#include <string>
#include <memory>

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
    int init_result = rkllm_init(&native_handle, &param, InternalResultCallback);
    
    if (init_result != 0) {
        napi_throw_error(env, nullptr, "Failed to initialize RKLLM");
        return nullptr;
    }

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

} // namespace bindings
} // namespace rkllmjs