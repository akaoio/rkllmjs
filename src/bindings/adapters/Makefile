# RKLLMJS Adapters Module Makefile
# Professional adapter system for model I/O

# Module name
MODULE_NAME := adapter-manager

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -fPIC
INCLUDES := -I../../../libs/rkllm/include -I../utils -I../core
TEST_INCLUDES := $(INCLUDES)  # Uses RKLLMJS Test Framework

# Build mode configuration
ifndef SANDBOX_BUILD
    SANDBOX_BUILD := 1
endif

ifdef SANDBOX_BUILD
    ifeq ($(SANDBOX_BUILD), 1)
        CXXFLAGS += -DSANDBOX_BUILD -O2
        # Exclude inference includes in sandbox mode
        INCLUDES := -I../../../libs/rkllm/include -I../utils
    else
        CXXFLAGS += -O2 -DNDEBUG
        INCLUDES := -I../../../libs/rkllm/include -I../utils -I../core -I../inference
    endif
else
    CXXFLAGS += -O2 -DNDEBUG
    INCLUDES := -I../../../libs/rkllm/include -I../utils -I../core -I../inference
endif

ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
else
    ifndef SANDBOX_BUILD
        CXXFLAGS += -O2 -DNDEBUG
    endif
endif

# Library settings  
TEST_LIBS := -pthread  # Uses RKLLMJS Test Framework

# Source files
SOURCES = $(MODULE_NAME).cpp
TEST_SOURCES = $(MODULE_NAME).test.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)

# Targets
TARGET = librkllm-adapters.a
TEST_TARGET = bin/$(MODULE_NAME).test

# Default target
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
