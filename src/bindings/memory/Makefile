# Memory Module Makefile
# Builds memory manager and its unit tests

MODULE_NAME = memory-manager
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -fPIC -I../config -I../testing

# Build mode configuration - now supports RKLLM_MODE environment variable
ifdef RKLLM_COMPILE_MODE_REAL
    CXXFLAGS += -DRKLLM_COMPILE_MODE_REAL -O2
    LIBS = -pthread -lrt
    RPATH = 
else ifdef REAL_BUILD
    # Legacy support for REAL_BUILD
    CXXFLAGS += -DREAL_BUILD -DRKLLM_COMPILE_MODE_REAL -O2
    LIBS = -pthread -lrt
    RPATH = 
else
    # Default to sandbox mode
    CXXFLAGS += -DSANDBOX_BUILD -DRKLLM_COMPILE_MODE_SANDBOX -O2
    LIBS = -pthread
    RPATH = 
endif

# Debug/Release configuration
ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
else
    ifdef RKLLM_COMPILE_MODE_REAL
        CXXFLAGS += -O2 -DNDEBUG
    else ifndef SANDBOX_BUILD
        CXXFLAGS += -O2 -DNDEBUG
    endif
endif

# Source files
SOURCES = $(MODULE_NAME).cpp
TEST_SOURCES = $(MODULE_NAME).test.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)

# Targets
TARGET = librkllm-memory.a
TEST_TARGET = bin/$(MODULE_NAME).test

# Default target
all: $(TARGET) $(TEST_TARGET)

# Build static library
$(TARGET): $(OBJECTS)
	@echo "🔧 Building memory management library..."
	ar rcs $@ $^
	@echo "✅ Memory library created: $@"

# Build test executable
$(TEST_TARGET): $(TEST_OBJECTS) $(TARGET) | bin
	@echo "🔧 Building memory management tests..."
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS) $(RPATH)
	@echo "✅ Memory tests created: $@"

# Create bin directory
bin:
	mkdir -p bin

# Compile source files
%.o: %.cpp %.hpp
	@echo "⚙️  Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile test files
$(MODULE_NAME).test.o: $(MODULE_NAME).test.cpp $(MODULE_NAME).hpp
	@echo "⚙️  Compiling test: $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Run tests
test: $(TEST_TARGET)
	@echo "🧪 Running memory management tests..."
	./$(TEST_TARGET)

# Run tests with verbose output
test-verbose: $(TEST_TARGET)
	@echo "🧪 Running verbose memory management tests..."
	./$(TEST_TARGET) --verbose

# Debug build
debug:
	@echo "🐛 Building debug version..."
	$(MAKE) DEBUG=1

# Clean build artifacts
clean:
	@echo "🧹 Cleaning memory module..."
	rm -f $(OBJECTS) $(TEST_OBJECTS) $(TARGET)
	rm -rf bin/

# Install library (for other modules to use)
install: $(TARGET)
	@echo "📦 Installing memory library..."
	mkdir -p ../lib
	cp $(TARGET) ../lib/
	mkdir -p ../include
	cp $(MODULE_NAME).hpp ../include/

# Show build info
info:
	@echo "📊 Memory Module Info:"
	@echo "  Module: $(MODULE_NAME)"
	@echo "  Compiler: $(CXX)"
	@echo "  Flags: $(CXXFLAGS)"
	@echo "  Libraries: $(LIBS)"
	@echo "  Target: $(TARGET)"
	@echo "  Test target: $(TEST_TARGET)"

.PHONY: all clean test test-verbose debug install info

.PHONY: install
install: all
	@echo "📦 Installing memory module placeholder..."
	@mkdir -p ../../../build/lib
	@cp bin/librkllm-memory.a ../../../build/lib/ 2>/dev/null || true

.PHONY: clean
clean:
	@rm -rf bin obj

.PHONY: help
help:
	@echo "RKLLMJS Memory Module (Placeholder)"
