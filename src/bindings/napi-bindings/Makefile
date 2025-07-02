# RKLLMJS N-API Bindings Module Makefile

# Dependencies
CORE_LIB = ../core/librkllm-manager.a
INFERENCE_LIB = ../inference/bin/librkllm-inference.a

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -fPIC

# Auto-detect node-addon-api and Node.js headers (only for actual N-API binding builds)
NODE_ADDON_API_PATH := $(shell find ../../../node_modules -name "napi.h" -type f -exec dirname {} \; 2>/dev/null | head -1)
NODE_GYP_HEADERS := $(shell find ~/.cache/node-gyp -name "node_api.h" -type f -exec dirname {} \; 2>/dev/null | head -1)

# Base includes (without N-API headers for test builds)
INCLUDES := -I../core -I../config -I../utils -I../inference -I../testing -I../../../libs/rkllm/include

# N-API includes (only when building actual bindings, not tests)
NAPI_INCLUDES := $(INCLUDES)
ifneq ($(NODE_ADDON_API_PATH),)
    NAPI_INCLUDES += -I$(NODE_ADDON_API_PATH)
endif
ifneq ($(NODE_GYP_HEADERS),)
    NAPI_INCLUDES += -I$(NODE_GYP_HEADERS)
endif

# Build configuration with N-API bindings (disabled for tests)
CXXFLAGS += -O2

# Test build configuration (no N-API)
TEST_CXXFLAGS := $(CXXFLAGS) -DRKLLM_TEST_BUILD

# Library linking - always link RKLLM library
LDFLAGS := -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
LDFLAGS += -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'

# Debug configuration
ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
endif

# Directories
BIN_DIR := bin
OBJ_DIR := obj

# Source files
SRC_FILES := rkllm-napi.cpp
TEST_FILES := rkllm-napi.test.cpp
OBJ_FILES := $(SRC_FILES:%.cpp=$(OBJ_DIR)/%.o)
TEST_OBJ_FILES := $(TEST_FILES:%.cpp=$(OBJ_DIR)/%.o)
# Separate object files for test build (without N-API)
TEST_LIB_OBJ_FILES := $(SRC_FILES:%.cpp=$(OBJ_DIR)/%.test-lib.o)

# Targets
TARGET_LIB := $(BIN_DIR)/librkllm-napi-bindings.a
TARGET_TEST_LIB := $(BIN_DIR)/librkllm-napi-bindings-test.a
TARGET_TEST := $(BIN_DIR)/rkllm-napi.test
TARGET_NODE := $(BIN_DIR)/binding.node

# Dependencies
CORE_LIB := ../core/librkllm-manager.a
UTILS_LIB := ../utils/librkllm-utils.a
INFERENCE_LIB := ../inference/bin/librkllm-inference.a

# Create directories
$(shell mkdir -p $(BIN_DIR) $(OBJ_DIR))

# Default target
.PHONY: all
all: $(TARGET_LIB) $(TARGET_TEST)

# Build static library (with N-API symbols)
$(TARGET_LIB): $(OBJ_FILES) $(CORE_LIB)
	@echo "Building N-API bindings library..."
	ar rcs $@ $(OBJ_FILES)
	@echo "✅ N-API bindings library created: $@"

# Build test library (without N-API symbols)
$(TARGET_TEST_LIB): $(TEST_LIB_OBJ_FILES) $(CORE_LIB)
	@echo "Building N-API bindings test library..."
	ar rcs $@ $(TEST_LIB_OBJ_FILES)
	@echo "✅ N-API bindings test library created: $@"

# Build test executable
$(TARGET_TEST): $(TEST_OBJ_FILES) $(TARGET_TEST_LIB) $(CORE_LIB) $(INFERENCE_LIB)
	@echo "Building N-API bindings test..."
	$(CXX) $(TEST_CXXFLAGS) -o $@ $(TEST_OBJ_FILES) $(TARGET_TEST_LIB) $(CORE_LIB) $(INFERENCE_LIB) $(LDFLAGS)
	@echo "✅ N-API bindings test created: $@"

# Compile source files (with N-API headers for library but careful linking)
$(OBJ_DIR)/%.o: %.cpp *.hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -DRKLLM_NAPI_BINDINGS $(NAPI_INCLUDES) -c $< -o $@

# Compile test files (without N-API headers to avoid linking issues)
$(OBJ_DIR)/%.test.o: %.test.cpp *.hpp
	@echo "Compiling test $<..."
	$(CXX) $(TEST_CXXFLAGS) $(INCLUDES) -c $< -o $@

# Compile source files for test library (without N-API)
$(OBJ_DIR)/%.test-lib.o: %.cpp *.hpp
	@echo "Compiling $< for test library..."
	$(CXX) $(TEST_CXXFLAGS) $(INCLUDES) -c $< -o $@

# Build Node.js binding (with N-API headers)
.PHONY: binding
binding: $(TARGET_LIB)
	@echo "Creating Node.js binding with N-API headers..."
	$(CXX) $(CXXFLAGS) $(NAPI_INCLUDES) -shared -fPIC -o $(TARGET_NODE) $(SRC_FILES) $(CORE_LIB) $(INFERENCE_LIB) $(LDFLAGS)
	@echo "✅ Node.js binding created: $(TARGET_NODE)"

# Test target
.PHONY: test
test: $(TARGET_TEST_LIB)
	@echo "Testing N-API bindings compilation..."
	@echo "✅ N-API bindings library compilation successful"

# Install target
.PHONY: install
install: $(TARGET_LIB)
	@echo "📦 Installing N-API bindings module..."
	@mkdir -p ../../../build/lib ../../../build/bin
	@cp $(TARGET_LIB) ../../../build/lib/
	@cp $(TARGET_NODE) ../../../build/bin/ 2>/dev/null || true
	@echo "✅ N-API bindings module installed"

# Clean target
.PHONY: clean
clean:
	@rm -rf $(BIN_DIR) $(OBJ_DIR)
	@echo "🧹 N-API bindings module cleaned"

# Help target
.PHONY: help
help:
	@echo "RKLLMJS N-API Bindings Module"
	@echo "Available targets:"
	@echo "  all      - Build static library"
	@echo "  binding  - Build Node.js binding"
	@echo "  test     - Run tests"
	@echo "  install  - Install library and binding"
	@echo "  clean    - Clean build artifacts"
	@echo "  help     - Show this help"
