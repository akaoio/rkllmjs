#ifndef LLM_HANDLE_HPP
#define LLM_HANDLE_HPP

#include <node_api.h>
#include "../../../libs/rkllm/include/rkllm.h"

namespace rkllmjs {
namespace bindings {

/**
 * @brief LLM Handle binding class for N-API
 * 
 * Provides N-API bindings for core LLM handle management functions:
 * - rkllm_createDefaultParam()
 * - rkllm_init()
 * - rkllm_destroy()
 */
class LLMHandleBinding {
public:
    /**
     * @brief Initialize N-API exports for LLM handle functions
     * @param env N-API environment
     * @param exports Export object to add functions to
     * @return napi_status
     */
    static napi_status Init(napi_env env, napi_value exports);

private:
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

    /**
     * @brief Helper to convert JavaScript object to RKLLMParam struct
     * @param env N-API environment
     * @param js_param JavaScript parameter object
     * @param param Output C++ parameter struct
     * @return napi_status
     */
    static napi_status JSToRKLLMParam(napi_env env, napi_value js_param, RKLLMParam* param);

    /**
     * @brief Helper to convert RKLLMParam struct to JavaScript object
     * @param env N-API environment
     * @param param C++ parameter struct
     * @param js_param Output JavaScript object
     * @return napi_status
     */
    static napi_status RKLLMParamToJS(napi_env env, const RKLLMParam* param, napi_value* js_param);

    /**
     * @brief Helper to validate LLM handle
     * @param env N-API environment
     * @param js_handle JavaScript handle object
     * @param handle Output native handle
     * @return napi_status
     */
    static napi_status ValidateHandle(napi_env env, napi_value js_handle, void** handle);
};

} // namespace bindings
} // namespace rkllmjs

#endif // LLM_HANDLE_HPP