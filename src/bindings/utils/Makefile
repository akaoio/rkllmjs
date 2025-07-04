# RKLLMJS Utils Module Makefile
# Builds basic utilities with RKLLMJS Test Framework

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -fPIC

# Auto-detect node-addon-api and Node.js headers
NODE_ADDON_API_PATH := $(shell find ../../../node_modules -name "napi.h" -type f -exec dirname {} \; 2>/dev/null | head -1)
NODE_GYP_HEADERS := $(shell find ~/.cache/node-gyp -name "node_api.h" -type f -exec dirname {} \; 2>/dev/null | head -1)

INCLUDES := -I../../../libs/rkllm/include -I../testing
ifneq ($(NODE_ADDON_API_PATH),)
    INCLUDES += -I$(NODE_ADDON_API_PATH)
endif
ifneq ($(NODE_GYP_HEADERS),)
    INCLUDES += -I$(NODE_GYP_HEADERS)
endif
TEST_INCLUDES := $(INCLUDES)

# Library settings - no external test dependencies
TEST_LIBS := -pthread

# Directories
SRC_DIR := .
OBJ_DIR := ./obj
TEST_DIR := .
BIN_DIR := ./bin

# Source files
SOURCES := type-converters.cpp error-handler.cpp
TEST_SOURCES := type-converters.test.cpp error-handler.test.cpp
HEADERS := type-converters.hpp error-handler.hpp

# Object files
OBJECTS := $(SOURCES:%.cpp=$(OBJ_DIR)/%.o)
TEST_OBJECTS := $(TEST_SOURCES:%.test.cpp=$(OBJ_DIR)/%.test.o)

# Output files
STATIC_LIB := $(BIN_DIR)/librkllm-utils.a
TEST_EXECUTABLES := $(TEST_SOURCES:%.test.cpp=$(BIN_DIR)/%-test)

# Default target
.PHONY: all
all: $(STATIC_LIB)

# Create directories
$(OBJ_DIR):
	@mkdir -p $(OBJ_DIR)

$(BIN_DIR):
	@mkdir -p $(BIN_DIR)

# Build static library
$(STATIC_LIB): $(OBJECTS) | $(BIN_DIR)
	@echo "Creating static library: $@"
	ar rcs $@ $^
	@echo "✅ Utils module library built successfully"

# Build object files
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp | $(OBJ_DIR)
	@echo "Compiling: $<"
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Build test object files (RKLLMJS Test Framework)
$(OBJ_DIR)/%.test.o: $(TEST_DIR)/%.test.cpp | $(OBJ_DIR)
	@echo "Compiling test: $<"
	$(CXX) $(CXXFLAGS) $(TEST_INCLUDES) -c $< -o $@

# Build test executables (skip for now)
$(BIN_DIR)/%-test: $(OBJ_DIR)/%.test.o $(OBJECTS) | $(BIN_DIR)
	@echo "Linking test: $@"
	$(CXX) $^ $(TEST_LIBS) -o $@

# Test targets
.PHONY: test
test: $(TEST_EXECUTABLES)
	@echo "🧪 Running utils module tests..."
	@for test in $(TEST_EXECUTABLES); do \
		echo "Running $$test..."; \
		if [ -f "$$test" ]; then \
			$$test; \
			if [ $$? -ne 0 ]; then \
				echo "❌ Test $$test failed"; \
				exit 1; \
			fi; \
		else \
			echo "⚠️  Test executable $$test not found"; \
		fi; \
	done
	@echo "✅ All utils module tests passed"

# Basic test with RKLLMJS Test Framework
.PHONY: test-basic
test-basic: $(STATIC_LIB)
	@echo "🧪 Running basic compilation test..."
	@echo "✅ Utils module compiled successfully"

# Installation
.PHONY: install
install: $(STATIC_LIB)
	@echo "📦 Installing utils module..."
	@mkdir -p ../../../build/lib
	@mkdir -p ../../../build/include/utils
	cp $(STATIC_LIB) ../../../build/lib/
	cp type-converters.hpp ../../../build/include/utils/type-converters.hpp
	cp error-handler.hpp ../../../build/include/utils/error-handler.hpp
	@echo "✅ Utils module installed"

# Clean targets
.PHONY: clean
clean:
	@echo "🧹 Cleaning utils module..."
	rm -rf $(OBJ_DIR) $(BIN_DIR)

# Help
.PHONY: help
help:
	@echo "RKLLMJS Utils Module Build System"
	@echo "================================="
	@echo ""
	@echo "Available targets:"
	@echo "  all         - Build static library (default)"
	@echo "  test        - Build and run all tests"
	@echo "  test-basic  - Basic compilation test"
	@echo "  install     - Install to build directory"
	@echo "  clean       - Clean build artifacts"
	@echo "  help        - Show this help message"
