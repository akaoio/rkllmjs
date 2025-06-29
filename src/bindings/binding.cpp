#include <node_api.h>
#include "llm-handle/llm-handle.hpp"

/**
 * @brief Main N-API module initialization function
 * @param env N-API environment
 * @param exports Export object
 * @return napi_value
 */
napi_value Init(napi_env env, napi_value exports) {
    napi_status status;

    // Initialize LLM Handle bindings
    status = rkllmjs::bindings::LLMHandleBinding::Init(env, exports);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to initialize LLM Handle bindings");
        return nullptr;
    }

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)