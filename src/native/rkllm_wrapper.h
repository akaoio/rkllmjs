#ifndef RKLLM_WRAPPER_H
#define RKLLM_WRAPPER_H

#include <cstddef>
#include "rkllm.h"

/**
 * Wrapper structures and functions to bridge C++ and JavaScript
 */

// JavaScript-facing result structure (avoid naming conflict with RKLLM native)
struct JSResult {
    LLMCallState state;
    const char* text;
    int* tokens;
    int token_count;
    float* logits;
    int logits_count;
    float* hidden_states;
    int hidden_states_count;
};

// JavaScript-facing input structure (avoid naming conflict with RKLLM native)
struct JSInput {
    RKLLMInputType input_type;
    const char* prompt_data;
    int data_len;
};

#endif // RKLLM_WRAPPER_H
