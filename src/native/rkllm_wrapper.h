#ifndef RKLLM_WRAPPER_H
#define RKLLM_WRAPPER_H

#include "rkllm.h"

/**
 * Wrapper structures and functions to bridge C++ and JavaScript
 */

// Result structure for JavaScript conversion
struct RKLLMResult {
    LLMCallState state;
    const char* text;
    int* tokens;
    int token_count;
    float* logits;
    int logits_count;
    float* hidden_states;
    int hidden_states_count;
};

// Input structure for JavaScript conversion  
struct RKLLMInput {
    RKLLMInputType input_type;
    const char* input_data;
    int input_len;
};

#endif // RKLLM_WRAPPER_H
