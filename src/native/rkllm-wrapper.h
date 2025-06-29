#pragma once
#include <napi.h>

/**
 * C++ wrapper class for RKLLM native API
 * Provides N-API bindings for the Rockchip RKLLM library
 */
class RKLLMWrapper {
public:
    // Core RKLLM functions
    static Napi::Value Init(const Napi::CallbackInfo& info);
    static Napi::Value Destroy(const Napi::CallbackInfo& info);
    static Napi::Value Run(const Napi::CallbackInfo& info);
    static Napi::Value RunAsync(const Napi::CallbackInfo& info);
    static Napi::Value Abort(const Napi::CallbackInfo& info);
    static Napi::Value IsRunning(const Napi::CallbackInfo& info);
    
    // Advanced RKLLM functions
    static Napi::Value LoadLora(const Napi::CallbackInfo& info);
    static Napi::Value LoadPromptCache(const Napi::CallbackInfo& info);
    static Napi::Value ReleasePromptCache(const Napi::CallbackInfo& info);
    static Napi::Value SetChatTemplate(const Napi::CallbackInfo& info);
    static Napi::Value SetFunctionTools(const Napi::CallbackInfo& info);
    static Napi::Value ClearKvCache(const Napi::CallbackInfo& info);
    static Napi::Value GetKvCacheSize(const Napi::CallbackInfo& info);
    static Napi::Value SetCrossAttnParams(const Napi::CallbackInfo& info);

private:
    // Helper methods for parameter conversion
    static void ConvertParamFromJS(const Napi::Object& jsParam, void* cParam);
    static Napi::Object ConvertResultToJS(Napi::Env env, const void* cResult);
    static void ThrowRKLLMError(Napi::Env env, int errorCode, const std::string& message);
};