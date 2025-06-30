# RKLLMJS N-API Bindings Module Makefile

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -fPIC
INCLUDES := -I../../../libs/rkllm/include -I../core

# Libraries and linking
CORE_LIB := ../core/librkllm-manager.a
UTILS_LIB := ../utils/bin/librkllm-utils.a
LDFLAGS := -L../../../libs/rkllm/aarch64 -lrkllmrt -lpthread
LDFLAGS += -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'

# Directories
BIN_DIR := bin
OBJ_DIR := obj
SRC_FILES := rkllm-napi.cpp
OBJ_FILES := $(SRC_FILES:%.cpp=$(OBJ_DIR)/%.o)
TARGET_LIB := $(BIN_DIR)/librkllm-napi-bindings.a
TARGET_NODE := $(BIN_DIR)/binding.node

# Create directories
$(shell mkdir -p $(BIN_DIR) $(OBJ_DIR))

# Default target
.PHONY: all
all: $(TARGET_LIB)

# Build static library
$(TARGET_LIB): $(OBJ_FILES)
	@echo "Building N-API bindings library..."
	ar rcs $@ $^
	@echo "✅ N-API bindings library created: $@"

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
