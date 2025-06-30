# C++ Test Makefile for RKLLM Native Bindings
# Compliant with RULES.md - Feature-based testing

CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -g -O0 -fPIC
INCLUDES = -I../../../libs/rkllm/include -I../../../node_modules/node-addon-api
LDFLAGS = -L../../../libs/rkllm/aarch64 -lrkllmrt -lpthread
RPATH_FLAGS = -Wl,-rpath,$(shell realpath ../../../libs/rkllm/aarch64) -Wl,-rpath,../../../libs/rkllm/aarch64

# Source and test files
BINDING_SRC = ../binding.cpp
BINDING_TEST = ../binding.test.cpp
LLM_HANDLE_SRC = llm-handle.cpp
LLM_HANDLE_TEST = llm-handle.test.cpp

# Output executables
BINDING_TEST_EXE = binding_test
LLM_HANDLE_TEST_EXE = llm-handle_test

# Test log directory (following RULES.md)
LOG_DIR = ../../../logs/$(shell date +%Y-%m-%d_%H-%M-%S)/cpp-unit-tests
TEST_SUMMARY = $(LOG_DIR)/cpp-test-summary.log

.PHONY: all test clean setup-logs

all: test

# Setup logging directory as per RULES.md
setup-logs:
	@echo "📁 Setting up C++ test logs per RULES.md..."
	@mkdir -p $(LOG_DIR)
	@echo "C++ Unit Tests - $(shell date)" > $(TEST_SUMMARY)
	@echo "Logging to: $(LOG_DIR)" >> $(TEST_SUMMARY)
	@echo "✅ Log directory created: $(LOG_DIR)"

# Build and run binding tests
test-binding: setup-logs
	@echo "🔧 Building binding tests..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) -o $(BINDING_TEST_EXE) $(BINDING_TEST) $(BINDING_SRC) $(LDFLAGS)
	@echo "🧪 Running binding tests..."
	@mkdir -p $(LOG_DIR)
	@echo "=== Binding Tests ===" >> $(TEST_SUMMARY)
	./$(BINDING_TEST_EXE) 2>&1 | tee $(LOG_DIR)/binding.test.log
	@echo "Exit code: $$?" >> $(TEST_SUMMARY)

# Build LLM handle test executable (standalone - no Node.js dependencies)
llm-handle_test: setup-logs
	@echo "🔧 Building LLM handle tests..."
	$(CXX) $(CXXFLAGS) -I../../../libs/rkllm/include -o $(LLM_HANDLE_TEST_EXE) $(LLM_HANDLE_TEST) -L../../../libs/rkllm/aarch64 -lrkllmrt -lpthread $(RPATH_FLAGS)

# Build and run LLM handle tests  
test-llm-handle: llm-handle_test
	@echo "🧪 Running LLM handle tests..."
	@mkdir -p $(LOG_DIR)
	@echo "=== LLM Handle Tests ===" >> $(TEST_SUMMARY)
	@echo "📚 Checking RKLLM library availability..."
	@if [ ! -f "../../../libs/rkllm/aarch64/librkllmrt.so" ]; then \
		echo "❌ librkllmrt.so not found in ../../../libs/rkllm/aarch64/"; \
		echo "Please ensure RKLLM library is properly installed."; \
		exit 1; \
	fi
	export LD_LIBRARY_PATH="../../../libs/rkllm/aarch64:$$LD_LIBRARY_PATH" && \
	./$(LLM_HANDLE_TEST_EXE) 2>&1 | tee $(LOG_DIR)/llm-handle.test.log
	@echo "Exit code: $$?" >> $(TEST_SUMMARY)

# Run all C++ tests (RULES.md compliant)
test: test-binding test-llm-handle
	@echo "📊 C++ Test Summary:"
	@cat $(TEST_SUMMARY)
	@echo "📁 Full logs available at: $(LOG_DIR)"

# Memory debug version
test-debug: CXXFLAGS += -DDEBUG -fsanitize=address -fsanitize=leak
test-debug: test

# Check NPU availability before tests
check-npu:
	@echo "🔍 Checking NPU availability..."
	@if [ -d "/sys/class/devfreq/fdab0000.npu" ]; then \
		echo "✅ NPU device found"; \
		cat /sys/class/devfreq/fdab0000.npu/available_frequencies || true; \
	else \
		echo "❌ NPU device not found"; \
	fi

# Clean build artifacts
clean:
	@echo "🧹 Cleaning C++ test artifacts..."
	rm -f $(BINDING_TEST_EXE) $(LLM_HANDLE_TEST_EXE)
	rm -f *.o *.so

# Environment check
env-check:
	@echo "🔍 Environment Check:"
	@echo "CXX: $(CXX)"
	@echo "RKLLM Headers: $(shell ls ../../../libs/rkllm/include/ 2>/dev/null || echo 'NOT FOUND')"
	@echo "RKLLM Library: $(shell ls ../../../libs/rkllm/aarch64/ 2>/dev/null || echo 'NOT FOUND')"
	@echo "Node API Headers: $(shell ls ../../../node_modules/node-addon-api/ 2>/dev/null || echo 'NOT FOUND')"

# Full test with environment check
full-test: env-check check-npu test
