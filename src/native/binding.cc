#include <napi.h>
#include "rkllm-wrapper.h"

/**
 * Initialize the RKLLM native module
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Export RKLLM functions
    exports.Set("init", Napi::Function::New(env, RKLLMWrapper::Init));
    exports.Set("destroy", Napi::Function::New(env, RKLLMWrapper::Destroy));
    exports.Set("run", Napi::Function::New(env, RKLLMWrapper::Run));
    exports.Set("runAsync", Napi::Function::New(env, RKLLMWrapper::RunAsync));
    exports.Set("abort", Napi::Function::New(env, RKLLMWrapper::Abort));
    exports.Set("isRunning", Napi::Function::New(env, RKLLMWrapper::IsRunning));
    exports.Set("loadLora", Napi::Function::New(env, RKLLMWrapper::LoadLora));
    exports.Set("loadPromptCache", Napi::Function::New(env, RKLLMWrapper::LoadPromptCache));
    exports.Set("releasePromptCache", Napi::Function::New(env, RKLLMWrapper::ReleasePromptCache));
    exports.Set("setChatTemplate", Napi::Function::New(env, RKLLMWrapper::SetChatTemplate));
    exports.Set("setFunctionTools", Napi::Function::New(env, RKLLMWrapper::SetFunctionTools));
    exports.Set("clearKvCache", Napi::Function::New(env, RKLLMWrapper::ClearKvCache));
    exports.Set("getKvCacheSize", Napi::Function::New(env, RKLLMWrapper::GetKvCacheSize));
    exports.Set("setCrossAttnParams", Napi::Function::New(env, RKLLMWrapper::SetCrossAttnParams));
    
    return exports;
}

NODE_API_MODULE(binding, Init)