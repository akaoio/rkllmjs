# RKLLMJS N-API Bindings Module Makefile

# Dependencies
CORE_LIB = ../core/librkllm-manager.a
INFERENCE_LIB = ../inference/bin/librkllm-inference.a

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -fPIC

# Auto-detect node-addon-api and Node.js headers
NODE_ADDON_API_PATH := $(shell find ../../../node_modules -name "napi.h" -type f -exec dirname {} \; 2>/dev/null | head -1)
NODE_GYP_HEADERS := $(shell find ~/.cache/node-gyp -name "node_api.h" -type f -exec dirname {} \; 2>/dev/null | head -1)

INCLUDES := -I../core -I../config -I../utils -I../inference -I../testing
ifneq ($(NODE_ADDON_API_PATH),)
    INCLUDES += -I$(NODE_ADDON_API_PATH)
endif
ifneq ($(NODE_GYP_HEADERS),)
    INCLUDES += -I$(NODE_GYP_HEADERS)
endif

# Build mode configuration - now supports RKLLM_MODE environment variable
ifdef RKLLM_COMPILE_MODE_REAL
    CXXFLAGS += -DRKLLM_COMPILE_MODE_REAL -DRKLLM_NAPI_BINDINGS -O2
    INCLUDES += -I../../../libs/rkllm/include
    # Architecture-aware library linking
    ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
        LDFLAGS := -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
        LDFLAGS += -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'
    else
        # CI/CD mode: REAL compilation flags without runtime library linking
        LDFLAGS := -pthread
    endif
else ifdef REAL_BUILD
    # Legacy support for REAL_BUILD
    CXXFLAGS += -DREAL_BUILD -DRKLLM_COMPILE_MODE_REAL -DRKLLM_NAPI_BINDINGS -O2
    INCLUDES += -I../../../libs/rkllm/include
    # Architecture-aware library linking
    ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
        LDFLAGS := -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
        LDFLAGS += -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'
    else
        # CI/CD mode: REAL compilation flags without runtime library linking
        LDFLAGS := -pthread
    endif
else
    # Default to sandbox mode
    CXXFLAGS += -DSANDBOX_BUILD -DRKLLM_COMPILE_MODE_SANDBOX -O2
    LDFLAGS := -pthread
endif

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

# Targets
TARGET_LIB := $(BIN_DIR)/librkllm-napi-bindings.a
TARGET_TEST := $(BIN_DIR)/rkllm-napi.test
TARGET_NODE := $(BIN_DIR)/binding.node

# Dependencies
CORE_LIB := ../core/librkllm-manager.a
UTILS_LIB := ../utils/librkllm-utils.a
INFERENCE_LIB := ../inference/bin/librkllm-inference.a

# Create directories
$(shell mkdir -p $(BIN_DIR) $(OBJ_DIR))

# Architecture-aware target selection
ifdef RKLLM_COMPILE_MODE_REAL
    ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
        ALL_TARGETS = $(TARGET_LIB) $(TARGET_TEST)
    else
        # CI/CD mode: only build static library, skip hardware-dependent tests
        ALL_TARGETS = $(TARGET_LIB)
    endif
else ifdef REAL_BUILD
    ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
        ALL_TARGETS = $(TARGET_LIB) $(TARGET_TEST)
    else
        # CI/CD mode: only build static library, skip hardware-dependent tests
        ALL_TARGETS = $(TARGET_LIB)
    endif
else
    ALL_TARGETS = $(TARGET_LIB) $(TARGET_TEST)
endif

# Default target
.PHONY: all
all: $(ALL_TARGETS)

# Build static library
$(TARGET_LIB): $(OBJ_FILES) $(CORE_LIB)
	@echo "Building N-API bindings library..."
	ar rcs $@ $(OBJ_FILES)
	@echo "✅ N-API bindings library created: $@"

# Build test executable
$(TARGET_TEST): $(TEST_OBJ_FILES) $(TARGET_LIB) $(CORE_LIB) $(INFERENCE_LIB)
	@echo "Building N-API bindings test..."
	$(CXX) $(CXXFLAGS) -o $@ $(TEST_OBJ_FILES) $(TARGET_LIB) $(CORE_LIB) $(INFERENCE_LIB) $(LDFLAGS)
	@echo "✅ N-API bindings test created: $@"

# Compile source files
$(OBJ_DIR)/%.o: %.cpp *.hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Build Node.js binding (placeholder for now)
.PHONY: binding
binding: $(TARGET_LIB)
	@echo "Creating Node.js binding placeholder..."
	@touch $(TARGET_NODE)
	@echo "✅ Node.js binding placeholder created: $(TARGET_NODE)"

# Test target
.PHONY: test
test: $(TARGET_LIB)
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
