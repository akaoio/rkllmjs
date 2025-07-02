# RKLLMJS Inference Module Makefile
# Builds inference engine

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -fPIC

# Auto-detect node-addon-api and Node.js headers
NODE_ADDON_API_PATH := $(shell find ../../../node_modules -name "napi.h" -type f -exec dirname {} \; 2>/dev/null | head -1)
NODE_GYP_HEADERS := $(shell find ~/.cache/node-gyp -name "node_api.h" -type f -exec dirname {} \; 2>/dev/null | head -1)

INCLUDES := -I../../../libs/rkllm/include -I../utils -I../core -I../testing
ifneq ($(NODE_ADDON_API_PATH),)
    INCLUDES += -I$(NODE_ADDON_API_PATH)
endif
ifneq ($(NODE_GYP_HEADERS),)
    INCLUDES += -I$(NODE_GYP_HEADERS)
endif

# Library settings
TEST_LIBS := -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
RPATH := -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'

# Directories
SRC_DIR := .
OBJ_DIR := ./obj
BIN_DIR := ./bin

# Source files
SOURCES := inference-engine.cpp
TEST_SOURCES := inference-engine.test.cpp

# Object files
OBJECTS := $(SOURCES:%.cpp=$(OBJ_DIR)/%.o)
TEST_OBJECTS := $(TEST_SOURCES:%.test.cpp=$(OBJ_DIR)/%.test.o)

# Output files
STATIC_LIB := $(BIN_DIR)/librkllm-inference.a
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
	@echo "✅ Inference module library built successfully"

# Build object files
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp | $(OBJ_DIR)
	@echo "Compiling: $<"
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Build test object files
$(OBJ_DIR)/%.test.o: $(SRC_DIR)/%.test.cpp | $(OBJ_DIR)
	@echo "Compiling test: $<"
	$(CXX) $(CXXFLAGS) $(TEST_INCLUDES) -c $< -o $@

# Build test executables
$(BIN_DIR)/%-test: $(OBJ_DIR)/%.test.o $(OBJECTS) | $(BIN_DIR)
	@echo "Linking test: $@"
	$(CXX) $^ $(TEST_LIBS) -o $@

# Test targets
.PHONY: test
test: $(TEST_EXECUTABLES)
	@echo "🧪 Running inference module tests..."
	@for test in $(TEST_EXECUTABLES); do \
		echo "Running $$test..."; \
		if [ -f "$$test" ]; then \
			$$test; \
		else \
			echo "⚠️  Test executable $$test not found"; \
		fi; \
	done
	@echo "✅ All inference module tests completed"

# Installation
.PHONY: install
install: $(STATIC_LIB)
	@echo "📦 Installing inference module..."
	@mkdir -p ../../../build/lib
	@mkdir -p ../../../build/include/inference
	cp $(STATIC_LIB) ../../../build/lib/
	cp *.hpp ../../../build/include/inference/
	@echo "✅ Inference module installed"

# Clean targets
.PHONY: clean
clean:
	@echo "🧹 Cleaning inference module..."
	rm -rf $(OBJ_DIR) $(BIN_DIR)

.PHONY: help
help:
	@echo "RKLLMJS Inference Module Build System"
	@echo "====================================="
	@echo "Available targets: all, test, install, clean, help"
