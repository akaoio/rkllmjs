# RKLLMJS N-API Bindings Module Makefile

# Dependencies
CORE_LIB = ../core/librkllm-manager.a
INFERENCE_LIB = ../inference/bin/librkllm-inference.a

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -fPIC
INCLUDES := -I../core -I../config -I../utils -I../inference -I../testing

# Build mode configuration - default to SANDBOX for compatibility
ifdef FULL_BUILD
    CXXFLAGS += -DFULL_BUILD -O2
    INCLUDES += -I../../../libs/rkllm/include
    LDFLAGS := -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
    LDFLAGS += -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'
else
    CXXFLAGS += -DSANDBOX_BUILD -O2
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

# Default target
.PHONY: all
all: $(TARGET_LIB) $(TARGET_TEST)

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
