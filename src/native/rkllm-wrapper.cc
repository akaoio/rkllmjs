#include "rkllm-wrapper.h"

#ifdef RKLLM_NATIVE_AVAILABLE
#include "rkllm.h"
#else
// Stub definitions for non-ARM64 platforms
typedef void* LLMHandle;
typedef enum { RKLLM_RUN_NORMAL = 0, RKLLM_RUN_FINISH = 2 } LLMCallState;

typedef struct {
    int32_t      base_domain_id;
    int8_t       embed_flash;
    int8_t       enabled_cpus_num;
    uint32_t     enabled_cpus_mask;
    uint8_t      n_batch;
    int8_t       use_cross_attn;
    uint8_t      reserved[104];
} RKLLMExtendParam;

typedef struct {
    const char* model_path;
    int32_t max_context_len;
    int32_t max_new_tokens;
    int32_t top_k;
    int32_t n_keep;
    float top_p;
    float temperature;
    float repeat_penalty;
    float frequency_penalty;
    float presence_penalty;
    int32_t mirostat;
    float mirostat_tau;
    float mirostat_eta;
    bool skip_special_token;
    bool is_async;
    const char* img_start;
    const char* img_end;
    const char* img_content;
    RKLLMExtendParam extend_param;
} RKLLMParam;

typedef struct {
    float prefill_time_ms;
    int prefill_tokens;
    float generate_time_ms;
    int generate_tokens;
    float memory_usage_mb;
} RKLLMPerfStat;

typedef struct {
    const char* text;
    int32_t token_id;
    RKLLMPerfStat perf;
} RKLLMResult;

typedef int(*LLMResultCallback)(RKLLMResult*, void*, LLMCallState);

int rkllm_init(LLMHandle*, RKLLMParam*, LLMResultCallback) { return -1; }
int rkllm_destroy(LLMHandle) { return -1; }
int rkllm_abort(LLMHandle) { return -1; }
int rkllm_is_running(LLMHandle) { return 0; }
#endif

#include <memory>
#include <map>
#include <string>

// Global handle storage for managing LLMHandle instances
static std::map<uint64_t, LLMHandle> g_handles;
static uint64_t g_next_handle_id = 1;

/**
 * Convert JavaScript RKLLMParam object to C RKLLMParam structure
 */
static RKLLMParam* ConvertJSParamToC(const Napi::Object& jsParam) {
    RKLLMParam* param = new RKLLMParam();
    
    // Initialize extend_param
    param->extend_param.base_domain_id = 0;
    param->extend_param.embed_flash = 0;
    param->extend_param.enabled_cpus_num = 4;
    param->extend_param.enabled_cpus_mask = 0x0F;
    param->extend_param.n_batch = 1;
    param->extend_param.use_cross_attn = 0;
    
    if (jsParam.Has("modelPath")) {
        std::string modelPath = jsParam.Get("modelPath").As<Napi::String>().Utf8Value();
        param->model_path = strdup(modelPath.c_str());
    }
    
    if (jsParam.Has("cpuMask")) {
        param->extend_param.enabled_cpus_mask = jsParam.Get("cpuMask").As<Napi::Number>().Uint32Value();
    }
    
    if (jsParam.Has("maxNewTokens")) {
        param->max_new_tokens = jsParam.Get("maxNewTokens").As<Napi::Number>().Int32Value();
    }
    
    if (jsParam.Has("maxContextLen")) {
        param->max_context_len = jsParam.Get("maxContextLen").As<Napi::Number>().Int32Value();
    }
    
    if (jsParam.Has("skipSpecialToken")) {
        param->skip_special_token = jsParam.Get("skipSpecialToken").As<Napi::Boolean>().Value();
    }
    
    if (jsParam.Has("isAsync")) {
        param->is_async = jsParam.Get("isAsync").As<Napi::Boolean>().Value();
    }
    
    if (jsParam.Has("temperature")) {
        param->temperature = jsParam.Get("temperature").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("topK")) {
        param->top_k = jsParam.Get("topK").As<Napi::Number>().Int32Value();
    }
    
    if (jsParam.Has("topP")) {
        param->top_p = jsParam.Get("topP").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("repeatPenalty")) {
        param->repeat_penalty = jsParam.Get("repeatPenalty").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("frequencyPenalty")) {
        param->frequency_penalty = jsParam.Get("frequencyPenalty").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("presencePenalty")) {
        param->presence_penalty = jsParam.Get("presencePenalty").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("mirostat")) {
        param->mirostat = jsParam.Get("mirostat").As<Napi::Number>().Int32Value();
    }
    
    if (jsParam.Has("mirostatTau")) {
        param->mirostat_tau = jsParam.Get("mirostatTau").As<Napi::Number>().FloatValue();
    }
    
    if (jsParam.Has("mirostatEta")) {
        param->mirostat_eta = jsParam.Get("mirostatEta").As<Napi::Number>().FloatValue();
    }
    
    return param;
}

/**
 * Convert C RKLLMResult to JavaScript object
 */
static Napi::Object ConvertCResultToJS(Napi::Env env, const RKLLMResult* result) {
    Napi::Object jsResult = Napi::Object::New(env);
    
    if (result->text) {
        jsResult.Set("text", Napi::String::New(env, result->text));
    }
    
    jsResult.Set("tokenId", Napi::Number::New(env, result->token_id));
    
    // Performance metrics
    Napi::Object performance = Napi::Object::New(env);
    performance.Set("prefillTimeMs", Napi::Number::New(env, result->perf.prefill_time_ms));
    performance.Set("prefillTokens", Napi::Number::New(env, result->perf.prefill_tokens));
    performance.Set("generateTimeMs", Napi::Number::New(env, result->perf.generate_time_ms));
    performance.Set("generateTokens", Napi::Number::New(env, result->perf.generate_tokens));
    performance.Set("memoryUsageMb", Napi::Number::New(env, result->perf.memory_usage_mb));
    jsResult.Set("perf", performance);
    
    return jsResult;
}

/**
 * Callback function for RKLLM results
 */
static int ResultCallback(RKLLMResult* result, void* userdata, LLMCallState state) {
    // This will be called from the RKLLM library
    // We need to convert the result and call the JavaScript callback
    // For now, we'll store the result and let the JavaScript side poll for it
    return 0; // Continue inference
}

/**
 * Initialize RKLLM
 */
Napi::Value RKLLMWrapper::Init(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform (requires ARM64/RK3588)").ThrowAsJavaScriptException();
    return env.Null();
#endif
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected parameter object").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Object paramObj = info[0].As<Napi::Object>();
    RKLLMParam* param = ConvertJSParamToC(paramObj);
    
    LLMHandle handle;
    int ret = rkllm_init(&handle, param, ResultCallback);
    
    if (ret != 0) {
        delete param;
        Napi::Error::New(env, "Failed to initialize RKLLM: " + std::to_string(ret)).ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Store handle and return handle ID
    uint64_t handleId = g_next_handle_id++;
    g_handles[handleId] = handle;
    
    delete param;
    return Napi::Number::New(env, handleId);
}

/**
 * Destroy RKLLM
 */
Napi::Value RKLLMWrapper::Destroy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint64_t handleId = info[0].As<Napi::Number>().Int64Value();
    auto it = g_handles.find(handleId);
    
    if (it == g_handles.end()) {
        Napi::Error::New(env, "Invalid handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int ret = rkllm_destroy(it->second);
    g_handles.erase(it);
    
    if (ret != 0) {
        Napi::Error::New(env, "Failed to destroy RKLLM: " + std::to_string(ret)).ThrowAsJavaScriptException();
        return env.Null();
    }
    
    return Napi::Number::New(env, ret);
}

/**
 * Run RKLLM inference
 */
Napi::Value RKLLMWrapper::Run(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected handleId, input, and inferParams").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint64_t handleId = info[0].As<Napi::Number>().Int64Value();
    auto it = g_handles.find(handleId);
    
    if (it == g_handles.end()) {
        Napi::Error::New(env, "Invalid handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // For now, return a placeholder - full implementation would convert JS objects to C structures
    return Napi::Number::New(env, 0);
}

/**
 * Run RKLLM inference asynchronously
 */
Napi::Value RKLLMWrapper::RunAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    
    // Similar to Run but returns immediately
    return Napi::Number::New(env, 0);
}

/**
 * Abort RKLLM inference
 */
Napi::Value RKLLMWrapper::Abort(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint64_t handleId = info[0].As<Napi::Number>().Int64Value();
    auto it = g_handles.find(handleId);
    
    if (it == g_handles.end()) {
        Napi::Error::New(env, "Invalid handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int ret = rkllm_abort(it->second);
    return Napi::Number::New(env, ret);
}

/**
 * Check if RKLLM is running
 */
Napi::Value RKLLMWrapper::IsRunning(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#ifdef RKLLM_STUB_ONLY
    return Napi::Boolean::New(env, false);
#endif
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint64_t handleId = info[0].As<Napi::Number>().Int64Value();
    auto it = g_handles.find(handleId);
    
    if (it == g_handles.end()) {
        Napi::Error::New(env, "Invalid handle ID").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int ret = rkllm_is_running(it->second);
    return Napi::Boolean::New(env, ret == 1);
}

Napi::Value RKLLMWrapper::LoadLora(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::LoadPromptCache(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::ReleasePromptCache(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::SetChatTemplate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::SetFunctionTools(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::ClearKvCache(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::GetKvCacheSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}

Napi::Value RKLLMWrapper::SetCrossAttnParams(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
#ifdef RKLLM_STUB_ONLY
    Napi::Error::New(env, "RKLLM native bindings not available on this platform").ThrowAsJavaScriptException();
    return env.Null();
#endif
    return Napi::Number::New(env, 0);
}