# RKLLMJS Integration Tests Makefile
# Tests component interactions without requiring real hardware

# Compiler settings
CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -g

# Include paths
INCLUDES := -I../../libs/rkllm/include \
           -I../../src/bindings/core \
           -I../../src/bindings/config \
           -I../../src/bindings/utils

# Library paths
LIBS := ../../src/bindings/core/librkllm-manager.a \
        ../../src/bindings/config/libconfig-manager.a \
        -L../../libs/rkllm/aarch64 -lrkllmrt -lpthread

# Runtime library path  
RPATH := -Wl,-rpath,'$$ORIGIN/../../libs/rkllm/aarch64'

# Targets
TARGET := integration-test
SOURCES := integration-test.test.cpp
OBJECTS := $(SOURCES:.cpp=.o)

.PHONY: all clean test help

# Default target
all: $(TARGET)

# Build integration test
$(TARGET): $(OBJECTS)
	@echo "🔨 Building integration test..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) -o $@ $< $(LIBS) $(RPATH)
	@echo "✅ Integration test built: $@"

# Run test
test: $(TARGET)
	@echo "🧪 Running integration tests..."
	./$(TARGET)
	@echo "🎉 Integration tests completed!"

# Clean targets
clean:
	@echo "🧹 Cleaning integration tests..."
	rm -f $(TARGET) $(OBJECTS)
	@echo "✅ Integration tests cleaned"

# Help target
help:
	@echo "RKLLMJS Integration Tests"
	@echo "========================"
	@echo "Available targets:"
	@echo "  all   - Build integration test"
	@echo "  test  - Run integration test"
	@echo "  clean - Clean build artifacts"
	@echo "  help  - Show this help"

%.o: %.cpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Ensure modules are built first
$(MODULE_LIBS):
	@echo "Building required modules..."
	cd core && make
	cd config && make

test: $(TARGET)
	@echo "Running integration test..."
	./$(TARGET)

clean:
	rm -f $(OBJECTS) $(TARGET)

.PHONY: all test clean
