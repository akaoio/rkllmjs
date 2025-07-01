#include <napi.h>

using namespace Napi;

// Export functions to JavaScript
Object Init(Env env, Object exports) {
    // For now, export a simple test function
    exports.Set("testConnection", Function::New(env, [](const CallbackInfo& info) {
        Napi::Env env = info.Env();
        return String::New(env, "RKLLM binding connected successfully!");
    }));
    
    return exports;
}

// Register the module
NODE_API_MODULE(binding, Init)
