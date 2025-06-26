#include <napi.h>
#include <cstring>
#include <iostream>
#include <string>
#include "rkllm_wrapper.h"

// Global callback for handling results
static Napi::ThreadSafeFunction tsfn;
static bool callbackInitialized = false;

// Callback function for RKLLM
int ResultCallback(RKLLMResult* result, void* userdata, LLMCallState state) {
    if (!callbackInitialized || !tsfn) {
        return 0;
    }

    // Create a copy of the result to pass to JavaScript thread
    JSResult* jsResult = new JSResult();
    jsResult->state = state;
    jsResult->text = result->text ? strdup(result->text) : nullptr;
    jsResult->token_count = result->token_id; // Use token_id as count
    jsResult->tokens = nullptr; // Will copy if needed
    
    // Call JavaScript callback asynchronously
    tsfn.NonBlockingCall(jsResult, [](Napi::Env env, Napi::Function jsCallback, JSResult* data) {
        if (data) {
            Napi::Object jsResult = Napi::Object::New(env);
            jsResult.Set("state", Napi::Number::New(env, static_cast<int>(data->state)));
            
            if (data->text) {
                jsResult.Set("text", Napi::String::New(env, data->text));
                free(const_cast<char*>(data->text));
            }
            
            jsResult.Set("tokenCount", Napi::Number::New(env, data->token_count));
            
            if (jsCallback) {
                jsCallback.Call({jsResult});
            }
            
            delete data;
        }
    });
    
    return 0;
}

// Convert JavaScript parameters to native RKLLMParam
RKLLMParam* ConvertJSParamsToNative(const Napi::Object& jsParams) {
    RKLLMParam* params = new RKLLMParam();
    memset(params, 0, sizeof(RKLLMParam));
    
    // Model path (required)
    if (jsParams.Has("modelPath")) {
        std::string modelPath = jsParams.Get("modelPath").As<Napi::String>().Utf8Value();
        params->model_path = strdup(modelPath.c_str());
    }
    
    // Optional parameters with defaults
    params->max_context_len = jsParams.Has("maxContextLen") ? 
        jsParams.Get("maxContextLen").As<Napi::Number>().Int32Value() : 2048;
    
    params->max_new_tokens = jsParams.Has("maxNewTokens") ? 
        jsParams.Get("maxNewTokens").As<Napi::Number>().Int32Value() : 256;
    
    params->temperature = jsParams.Has("temperature") ? 
        jsParams.Get("temperature").As<Napi::Number>().FloatValue() : 0.7f;
    
    params->top_p = jsParams.Has("topP") ? 
        jsParams.Get("topP").As<Napi::Number>().FloatValue() : 0.9f;
    
    params->top_k = jsParams.Has("topK") ? 
        jsParams.Get("topK").As<Napi::Number>().Int32Value() : 50;
    
    params->repeat_penalty = jsParams.Has("repeatPenalty") ? 
        jsParams.Get("repeatPenalty").As<Napi::Number>().FloatValue() : 1.0f;
    
    params->frequency_penalty = jsParams.Has("frequencyPenalty") ? 
        jsParams.Get("frequencyPenalty").As<Napi::Number>().FloatValue() : 0.0f;
    
    params->presence_penalty = jsParams.Has("presencePenalty") ? 
        jsParams.Get("presencePenalty").As<Napi::Number>().FloatValue() : 0.0f;
    
    params->mirostat = jsParams.Has("mirostat") ? 
        jsParams.Get("mirostat").As<Napi::Number>().Int32Value() : 0;
    
    params->mirostat_tau = jsParams.Has("mirostatTau") ? 
        jsParams.Get("mirostatTau").As<Napi::Number>().FloatValue() : 5.0f;
    
    params->mirostat_eta = jsParams.Has("mirostatEta") ? 
        jsParams.Get("mirostatEta").As<Napi::Number>().FloatValue() : 0.1f;
    
    return params;
}

// Convert native result to JavaScript object
Napi::Object ConvertNativeResultToJS(Napi::Env env, const RKLLMResult& result) {
    Napi::Object jsResult = Napi::Object::New(env);
    
    if (result.text && strlen(result.text) > 0) {
        jsResult.Set("text", Napi::String::New(env, result.text));
    }
    
    jsResult.Set("tokenId", Napi::Number::New(env, result.token_id));
    
    return jsResult;
}

// Initialize RKLLM instance
Napi::Value RKLLMInit(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected object parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        Napi::Object jsParams = info[0].As<Napi::Object>();
        RKLLMParam* params = ConvertJSParamsToNative(jsParams);
        
        LLMHandle handle = nullptr;
        
        // Initialize with callback
        int ret = rkllm_init(&handle, params, ResultCallback);
        
        // Clean up params
        if (params->model_path) {
            free(const_cast<char*>(params->model_path));
        }
        delete params;
        
        if (ret != 0) {
            std::string error = "Failed to initialize RKLLM with error code: " + std::to_string(ret);
            Napi::Error::New(env, error).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // Return handle as external
        return Napi::External<void>::New(env, handle);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Run inference
Napi::Value RKLLMRun(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected handle and input parameters").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        LLMHandle handle = info[0].As<Napi::External<void>>().Data();
        Napi::Object jsInput = info[1].As<Napi::Object>();
        
        // Create RKLLM input
        RKLLMInput input;
        memset(&input, 0, sizeof(RKLLMInput));
        
        // Set input type
        input.input_type = static_cast<RKLLMInputType>(
            jsInput.Get("inputType").As<Napi::Number>().Int32Value()
        );
        
        // Set prompt input
        std::string inputData = jsInput.Get("inputData").As<Napi::String>().Utf8Value();
        input.prompt_input = inputData.c_str();
        
        // Create inference parameters
        RKLLMInferParam inferParams;
        memset(&inferParams, 0, sizeof(RKLLMInferParam));
        inferParams.mode = RKLLM_INFER_GENERATE; // Default to generate mode
        
        // Run inference
        int ret = rkllm_run(handle, &input, &inferParams, nullptr);
        
        if (ret != 0) {
            std::string error = "Inference failed with error code: " + std::to_string(ret);
            Napi::Error::New(env, error).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        // For synchronous mode, we return a simple success indicator
        // The actual result will come via callback
        Napi::Object result = Napi::Object::New(env);
        result.Set("success", Napi::Boolean::New(env, true));
        return result;
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Destroy RKLLM instance
Napi::Value RKLLMDestroy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected handle parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        LLMHandle handle = info[0].As<Napi::External<void>>().Data();
        
        int ret = rkllm_destroy(handle);
        
        if (ret != 0) {
            std::string error = "Failed to destroy RKLLM with error code: " + std::to_string(ret);
            Napi::Error::New(env, error).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        return Napi::Boolean::New(env, true);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Set callback function
Napi::Value SetCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Expected function parameter").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Create thread-safe function for callbacks
    tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[0].As<Napi::Function>(),
        "RKLLM Callback",
        0,
        1
    );
    
    callbackInitialized = true;
    return Napi::Boolean::New(env, true);
}

// Initialize the addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("rkllmInit", Napi::Function::New(env, RKLLMInit));
    exports.Set("rkllmRun", Napi::Function::New(env, RKLLMRun));
    exports.Set("rkllmDestroy", Napi::Function::New(env, RKLLMDestroy));
    exports.Set("setCallback", Napi::Function::New(env, SetCallback));
    return exports;
}

NODE_API_MODULE(rkllmjs, Init)
