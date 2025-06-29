#!/bin/bash

# Setup Test Environment for RKLLMJS
# This script sets up environment variables to use real models for testing

set -e

echo "🔧 Setting up RKLLMJS test environment..."

# Find the first available .rkllm model in the models directory
MODELS_DIR="./models"
MODEL_PATH=""

if [ -d "$MODELS_DIR" ]; then
    # Find the first .rkllm file
    MODEL_PATH=$(find "$MODELS_DIR" -name "*.rkllm" -type f | head -1)
fi

if [ -n "$MODEL_PATH" ] && [ -f "$MODEL_PATH" ]; then
    echo "✅ Found model: $MODEL_PATH"
    
    # Convert to absolute path
    ABS_MODEL_PATH=$(realpath "$MODEL_PATH")
    
    echo "📁 Setting RKLLM_TEST_MODEL_PATH=$ABS_MODEL_PATH"
    export RKLLM_TEST_MODEL_PATH="$ABS_MODEL_PATH"
    
    # Save to .env file for persistence
    echo "RKLLM_TEST_MODEL_PATH=$ABS_MODEL_PATH" > .env
    echo "✅ Environment variable saved to .env file"
    
    # Show model info
    MODEL_SIZE=$(du -h "$ABS_MODEL_PATH" | cut -f1)
    echo "📊 Model size: $MODEL_SIZE"
    echo "🎯 Tests will use real model instead of dummy data"
    
else
    echo "❌ No RKLLM model found in $MODELS_DIR"
    echo "💡 Download a model first:"
    echo "   npm run cli pull dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1 Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm"
    exit 1
fi

echo "🚀 Test environment setup complete!"
