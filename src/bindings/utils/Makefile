# RKLLMJS Utils Module Makefile (Simplified)
# Builds basic utilities without N-API dependencies

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -fPIC
INCLUDES := -I../../../libs/rkllm/include
TEST_INCLUDES := $(INCLUDES) -I/usr/include/gtest
SIMPLIFIED_BUILD := 1

# Library settings
TEST_LIBS := -lgtest -lgtest_main -pthread

# Directories
SRC_DIR := .
OBJ_DIR := ./obj
TEST_DIR := .
BIN_DIR := ./bin

# Source files (simplified versions)
SOURCES := type-converters.cpp error-handler.cpp
TEST_SOURCES := type-converters.test.cpp error-handler.test.cpp

# Use simplified headers when building standalone
ifdef SIMPLIFIED_BUILD
    HEADERS := type-converters-simple.hpp error-handler-simple.hpp
    CXXFLAGS += -DSIMPLIFIED_BUILD
else
    HEADERS := type-converters.hpp error-handler.hpp
endif

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

# Build test object files (skip for now due to gtest dependency)
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

# Basic test without gtest
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
	cp type-converters-simple.hpp ../../../build/include/utils/type-converters.hpp
	cp error-handler-simple.hpp ../../../build/include/utils/error-handler.hpp
	@echo "✅ Utils module installed"

# Clean targets
.PHONY: clean
clean:
	@echo "🧹 Cleaning utils module..."
	rm -rf $(OBJ_DIR) $(BIN_DIR)

# Help
.PHONY: help
help:
	@echo "RKLLMJS Utils Module Build System (Simplified)"
	@echo "=============================================="
	@echo ""
	@echo "Available targets:"
	@echo "  all         - Build static library (default)"
	@echo "  test        - Build and run all tests (requires gtest)"
	@echo "  test-basic  - Basic compilation test"
	@echo "  install     - Install to build directory"
	@echo "  clean       - Clean build artifacts"
	@echo "  help        - Show this help message"
	@echo ""
	@echo "Build modes:"
	@echo "  SIMPLIFIED_BUILD=1  - Use simplified headers (default)"
	@echo "  SIMPLIFIED_BUILD=0  - Use full N-API headers"
