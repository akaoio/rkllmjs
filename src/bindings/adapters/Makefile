# RKLLMJS Adapters Module Makefile
# Professional adapter system for model I/O

# Module name
MODULE_NAME := adapter-manager

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -fPIC

# Auto-detect node-addon-api and Node.js headers
NODE_ADDON_API_PATH := $(shell find ../../../node_modules -name "napi.h" -type f -exec dirname {} \; 2>/dev/null | head -1)
NODE_GYP_HEADERS := $(shell find ~/.cache/node-gyp -name "node_api.h" -type f -exec dirname {} \; 2>/dev/null | head -1)

INCLUDES := -I../../../libs/rkllm/include -I../utils -I../core -I../inference
ifneq ($(NODE_ADDON_API_PATH),)
    INCLUDES += -I$(NODE_ADDON_API_PATH)
endif
ifneq ($(NODE_GYP_HEADERS),)
    INCLUDES += -I$(NODE_GYP_HEADERS)
endif
TEST_INCLUDES := $(INCLUDES)

# Build configuration
CXXFLAGS += -O2
TEST_LIBS := ../core/librkllm-manager.a ../inference/bin/librkllm-inference.a -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread

ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
else
    CXXFLAGS += -O2 -DNDEBUG
endif

# Source files
SOURCES = $(MODULE_NAME).cpp
TEST_SOURCES = $(MODULE_NAME).test.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)

# Targets
TARGET = librkllm-adapters.a
TEST_TARGET = bin/$(MODULE_NAME).test

# Default target
.PHONY: all
all: $(TARGET) $(TEST_TARGET)

# Build static library
$(TARGET): $(OBJECTS)
	@mkdir -p bin
	ar rcs bin/$(TARGET) $(OBJECTS)
	@echo "✅ Built $(TARGET)"

# Build test executable
$(TEST_TARGET): $(TEST_OBJECTS) $(TARGET)
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) $(TEST_INCLUDES) -o $(TEST_TARGET) $(TEST_OBJECTS) bin/librkllm-adapters.a $(TEST_LIBS)
	@echo "✅ Built $(TEST_TARGET)"

# Compile source files
%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Run tests
.PHONY: test
test: $(TEST_TARGET)
	@echo "🧪 Running adapters module tests..."
	$(TEST_TARGET)

# Clean build artifacts
.PHONY: clean
clean:
	rm -f *.o bin/*

# Install
.PHONY: install
install: all
	@echo "📦 Installing adapters module..."
	@mkdir -p ../../../build/lib
	@cp bin/$(TARGET) ../../../build/lib/

# Help
.PHONY: help
help:
	@echo "RKLLMJS Adapters Module"
	@echo "Available targets:"
	@echo "  all     - Build library and tests"
	@echo "  test    - Run tests"
	@echo "  clean   - Remove build artifacts"
	@echo "  install - Install to build directory"
	@echo "  help    - Show this help"
