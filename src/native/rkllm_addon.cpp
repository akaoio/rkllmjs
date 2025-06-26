#include <napi.h>
#include <string>
#include <memory>
#include "rkllm_wrapper.h"

// Convert JavaScript RKLLMParam to native structure
RKLLMParam* ConvertJSParamsToNative(const Napi::Object& jsParams) {
    auto* params = new RKLLMParam();
    memset(params, 0, sizeof(RKLLMParam));
    
    // Required field
    if (jsParams.Has("modelPath")) {
        std::string modelPath = jsParams.Get("modelPath").As<Napi::String>().Utf8Value();
        params->model_path = strdup(modelPath.c_str());
    }
    
    // Optional fields with defaults
    params->max_context_len = jsParams.Has("maxContextLen") ? 
        jsParams.Get("maxContextLen").As<Napi::Number>().Int32Value() : 1024;
    
    params->max_new_tokens = jsParams.Has("maxNewTokens") ? 
        jsParams.Get("maxNewTokens").As<Napi::Number>().Int32Value() : 256;
    
    params->top_k = jsParams.Has("topK") ? 
        jsParams.Get("topK").As<Napi::Number>().Int32Value() : 50;
    
    params->n_keep = jsParams.Has("nKeep") ? 
        jsParams.Get("nKeep").As<Napi::Number>().Int32Value() : 0;
    
    params->top_p = jsParams.Has("topP") ? 
        jsParams.Get("topP").As<Napi::Number>().FloatValue() : 0.9f;
    
    params->temperature = jsParams.Has("temperature") ? 
        jsParams.Get("temperature").As<Napi::Number>().FloatValue() : 0.7f;
    
    params->repeat_penalty = jsParams.Has("repeatPenalty") ? 
        jsParams.Get("repeatPenalty").As<Napi::Number>().FloatValue() : 1.1f;
    
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
    
    params->skip_special_token = jsParams.Has("skipSpecialToken") ? 
        jsParams.Get("skipSpecialToken").As<Napi::Boolean>().Value() : false;
    
    params->is_async = jsParams.Has("isAsync") ? 
        jsParams.Get("isAsync").As<Napi::Boolean>().Value() : false;
    
    // Handle extended parameters
    if (jsParams.Has("extendParam")) {
        Napi::Object extendParam = jsParams.Get("extendParam").As<Napi::Object>();
        
        params->extend_param.base_domain_id = extendParam.Has("baseDomainId") ? 
            extendParam.Get("baseDomainId").As<Napi::Number>().Int32Value() : 0;
            
        params->extend_param.embed_flash = extendParam.Has("embedFlash") ? 
            (extendParam.Get("embedFlash").As<Napi::Boolean>().Value() ? 1 : 0) : 0;
            
        params->extend_param.enabled_cpus_num = extendParam.Has("enabledCpusNum") ? 
            extendParam.Get("enabledCpusNum").As<Napi::Number>().Int32Value() : 0;
            
        params->extend_param.enabled_cpus_mask = extendParam.Has("enabledCpusMask") ? 
            extendParam.Get("enabledCpusMask").As<Napi::Number>().Uint32Value() : 0;
            
        params->extend_param.n_batch = extendParam.Has("nBatch") ? 
            extendParam.Get("nBatch").As<Napi::Number>().Uint32Value() : 1;
            
        params->extend_param.use_cross_attn = extendParam.Has("useCrossAttn") ? 
            (extendParam.Get("useCrossAttn").As<Napi::Boolean>().Value() ? 1 : 0) : 0;
    }
    
    return params;
}

// Convert native result to JavaScript object
Napi::Object ConvertNativeResultToJS(Napi::Env env, const RKLLMResult& result) {
    Napi::Object jsResult = Napi::Object::New(env);
    
    jsResult.Set("state", Napi::Number::New(env, static_cast<int>(result.state)));
    
    if (result.text && strlen(result.text) > 0) {
        jsResult.Set("text", Napi::String::New(env, result.text));
    }
    
    // Add other fields as needed (tokens, logits, hiddenStates)
    
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
        int ret = rkllm_init(&handle, params);
        
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
        
        RKLLMInput input;
        memset(&input, 0, sizeof(RKLLMInput));
        
        // Convert input
        input.input_type = static_cast<RKLLMInputType>(
            jsInput.Get("inputType").As<Napi::Number>().Int32Value()
        );
        
        std::string inputData = jsInput.Get("inputData").As<Napi::String>().Utf8Value();
        input.input_data = inputData.c_str();
        input.input_len = inputData.length();
        
        RKLLMResult result;
        memset(&result, 0, sizeof(RKLLMResult));
        
        int ret = rkllm_run(handle, &input, &result, nullptr);
        
        if (ret != 0) {
            std::string error = "Inference failed with error code: " + std::to_string(ret);
            Napi::Error::New(env, error).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        return ConvertNativeResultToJS(env, result);
        
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
        }
        
        return Napi::Number::New(env, ret);
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Initialize the addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "rkllmInit"), Napi::Function::New(env, RKLLMInit));
    exports.Set(Napi::String::New(env, "rkllmRun"), Napi::Function::New(env, RKLLMRun));
    exports.Set(Napi::String::New(env, "rkllmDestroy"), Napi::Function::New(env, RKLLMDestroy));
    
    return exports;
}

NODE_API_MODULE(rkllmjs, Init)
