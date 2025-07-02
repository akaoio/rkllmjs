# RKLLMJS System Tests Makefile
# Tests end-to-end functionality on real RK3588 hardware

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -g

# Include paths
INCLUDES := -I../../libs/rkllm/include \
           -I../../src/bindings/core \
           -I../../src/bindings/inference \
           -I../../src/bindings/config \
           -I../../src/bindings/utils

# Library paths
LIBS := ../../src/bindings/core/librkllm-manager.a \
        ../../src/bindings/inference/bin/librkllm-inference.a \
        -L../../libs/rkllm/aarch64 -lrkllmrt -lpthread -ldl

# Runtime library path
RPATH := -Wl,-rpath,'$$ORIGIN/../../libs/rkllm/aarch64'

# Targets
TESTS := real-inference-test
BINS := $(TESTS)

.PHONY: all clean test help

# Default target
all: $(TESTS)

# Real inference test with streaming (includes model loading)
real-inference-test: real-inference.test.cpp
	@echo "🔨 Building real inference test..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) -o $@ $< $(LIBS) $(RPATH)
	@echo "✅ Real inference test built: $@"

# Run test
test: $(TESTS)
	@echo "🧪 Running system test..."
	@echo "📋 Real Inference Test (includes model loading & streaming)"
	@echo "=========================================================="
	./real-inference-test
	@echo ""
	@echo "🎉 System test completed!"

# Clean targets
clean:
	@echo "🧹 Cleaning system tests..."
	rm -f $(BINS)
	@echo "✅ System tests cleaned"

# Help target
help:
	@echo "RKLLMJS System Tests"
	@echo "==================="
	@echo "Available targets:"
	@echo "  all                 - Build test"
	@echo "  real-inference-test - Build real inference test"
	@echo "  test                - Run test"
	@echo "  clean               - Clean build artifacts"
	@echo "  help                - Show this help"
	@echo ""
	@echo "Test includes:"
	@echo "  - Model loading and validation"
	@echo "  - Real-time streaming inference"
	@echo "  - Resource management"
	@echo "  - Error handling"
	@echo ""
	@echo "Requirements:"
	@echo "  - RK3588 hardware with NPU support"
	@echo "  - Real model files in ../../models/"
	@echo "  - Built core and inference libraries"
