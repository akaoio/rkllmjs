# RKLLMJS Utils Module Makefile (Simplified)
# Builds basic utilities without N-API dependencies

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -fPIC
INCLUDES := -I../../../libs/rkllm/include
TEST_INCLUDES := $(INCLUDES) -I/usr/include/gtest

# Library settings
TEST_LIBS := -lgtest -lgtest_main -pthread

# Directories
SRC_DIR := .
OBJ_DIR := ./obj
TEST_DIR := .
BIN_DIR := ./bin

# Source files (simplified versions)
SOURCES := type-converters-simple.cpp error-handler-simple.cpp
TEST_SOURCES := type-converters-simple.test.cpp error-handler-simple.test.cpp

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

# Build test object files
$(OBJ_DIR)/%.test.o: $(TEST_DIR)/%.test.cpp | $(OBJ_DIR)
	@echo "Compiling test: $<"
	$(CXX) $(CXXFLAGS) $(TEST_INCLUDES) -c $< -o $@

# Build test executables
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

# Installation
.PHONY: install
install: $(STATIC_LIB)
	@echo "📦 Installing utils module..."
	@mkdir -p ../../../build/lib
	@mkdir -p ../../../build/include/utils
	cp $(STATIC_LIB) ../../../build/lib/
	cp *.hpp ../../../build/include/utils/
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
	@echo "  all       - Build static library (default)"
	@echo "  test      - Build and run all tests"
	@echo "  install   - Install to build directory"
	@echo "  clean     - Clean build artifacts"
	@echo "  help      - Show this help message"
