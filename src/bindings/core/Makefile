# Core Module Makefile
# Builds rkllm-manager and its unit tests

MODULE_NAME = rkllm-manager
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -fPIC -I../../../libs/rkllm/include -I../config -I../testing

# Build mode configuration
ifdef SANDBOX_BUILD
    CXXFLAGS += -DSANDBOX_BUILD -O2
    LIBS = -pthread
    RPATH = 
else
    CXXFLAGS += -DFULL_BUILD
    LIBS = -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
    RPATH = -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'
endif

# Debug/Release configuration
ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
else
    ifndef SANDBOX_BUILD
        CXXFLAGS += -O2 -DNDEBUG
    endif
endif

# Source files
SOURCES = $(MODULE_NAME).cpp
TEST_SOURCES = $(MODULE_NAME).test.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)

# Targets
TARGET = lib$(MODULE_NAME).a
TEST_TARGET = $(MODULE_NAME).test

# Default target
all: $(TARGET) $(TEST_TARGET)

# Build static library
$(TARGET): $(OBJECTS)
	@echo "Building $(TARGET)..."
	ar rcs $@ $^

# Build test executable
$(TEST_TARGET): $(TEST_OBJECTS) $(TARGET)
	@echo "Building $(TEST_TARGET)..."
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS) $(RPATH)

# Compile source files
%.o: %.cpp %.hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile test files (no header dependency)
$(MODULE_NAME).test.o: $(MODULE_NAME).test.cpp $(MODULE_NAME).hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Run tests
test: $(TEST_TARGET)
	@echo "Running tests for $(MODULE_NAME)..."
	./$(TEST_TARGET)

# Run tests with logging
test-verbose: $(TEST_TARGET)
	@echo "Running verbose tests for $(MODULE_NAME)..."
	./$(TEST_TARGET) --verbose

# Debug build
debug:
	@echo "Building debug version..."
	$(MAKE) DEBUG=1

# Clean build artifacts
clean:
	@echo "Cleaning $(MODULE_NAME)..."
	rm -f $(OBJECTS) $(TEST_OBJECTS) $(TARGET) $(TEST_TARGET)
	rm -f *.log

# Install library (for other modules to use)
install: $(TARGET)
	@echo "Installing $(TARGET)..."
	mkdir -p ../lib
	cp $(TARGET) ../lib/
	mkdir -p ../include
	cp $(MODULE_NAME).hpp ../include/

# Show build info
info:
	@echo "Module: $(MODULE_NAME)"
	@echo "Compiler: $(CXX)"
	@echo "Flags: $(CXXFLAGS)"
	@echo "Libraries: $(LIBS)"
	@echo "Sources: $(SOURCES)"
	@echo "Tests: $(TEST_SOURCES)"

# Dependencies
$(MODULE_NAME).o: $(MODULE_NAME).hpp
$(MODULE_NAME).test.o: $(MODULE_NAME).hpp

.PHONY: all test test-verbose debug clean install info
