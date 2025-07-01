# README Generator Module Makefile
# Builds readme-generator and its unit tests

MODULE_NAME = readme-generator
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -fPIC -I../../../libs/rkllm/include -I../config -I../testing

# Build mode configuration - now supports RKLLM_MODE environment variable
ifdef RKLLM_COMPILE_MODE_REAL
    CXXFLAGS += -DRKLLM_COMPILE_MODE_REAL -O2
    LIBS = -pthread
    RPATH = 
else ifdef REAL_BUILD
    # Legacy support for REAL_BUILD
    CXXFLAGS += -DREAL_BUILD -DRKLLM_COMPILE_MODE_REAL -O2
    LIBS = -pthread
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
CLI_SOURCES = $(MODULE_NAME)-cli.cpp
CLI_TEST_SOURCES = $(MODULE_NAME)-cli.test.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TEST_OBJECTS = $(TEST_SOURCES:.cpp=.o)
CLI_OBJECTS = $(CLI_SOURCES:.cpp=.o)
CLI_TEST_OBJECTS = $(CLI_TEST_SOURCES:.cpp=.o)

# Targets
TARGET = lib$(MODULE_NAME).a
TEST_TARGET = $(MODULE_NAME).test
CLI_TARGET = $(MODULE_NAME)-cli
CLI_TEST_TARGET = $(MODULE_NAME)-cli.test

# Default target
all: $(TARGET) $(TEST_TARGET) $(CLI_TARGET) $(CLI_TEST_TARGET)

# Build static library
$(TARGET): $(OBJECTS)
	@echo "Building $(TARGET)..."
	ar rcs $@ $^

# Build test executable
$(TEST_TARGET): $(TEST_OBJECTS) $(TARGET)
	@echo "Building $(TEST_TARGET)..."
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS) $(RPATH)

# Build CLI executable
$(CLI_TARGET): $(CLI_OBJECTS) $(TARGET)
	@echo "Building $(CLI_TARGET)..."
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS) $(RPATH)

# Build CLI test executable
$(CLI_TEST_TARGET): $(CLI_TEST_OBJECTS) $(TARGET)
	@echo "Building $(CLI_TEST_TARGET)..."
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS) $(RPATH)

# Compile source files
%.o: %.cpp %.hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile test files (no header dependency)
$(MODULE_NAME).test.o: $(MODULE_NAME).test.cpp $(MODULE_NAME).hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile CLI files
$(MODULE_NAME)-cli.o: $(MODULE_NAME)-cli.cpp $(MODULE_NAME).hpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile CLI test files
$(MODULE_NAME)-cli.test.o: $(MODULE_NAME)-cli.test.cpp
	@echo "Compiling $<..."
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Run tests
test: $(TEST_TARGET) $(CLI_TARGET) $(CLI_TEST_TARGET)
	@echo "Running tests for $(MODULE_NAME)..."
	./$(TEST_TARGET)
	@echo "Running CLI tests for $(MODULE_NAME)..."
	./$(CLI_TEST_TARGET)

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
	rm -f $(OBJECTS) $(TEST_OBJECTS) $(CLI_OBJECTS) $(CLI_TEST_OBJECTS) $(TARGET) $(TEST_TARGET) $(CLI_TARGET) $(CLI_TEST_TARGET)
	rm -f *.log

# Install library (for other modules to use)
install: $(TARGET) $(CLI_TARGET)
	@echo "Installing $(TARGET)..."
	mkdir -p ../lib
	cp $(TARGET) ../lib/
	mkdir -p ../include
	cp $(MODULE_NAME).hpp ../include/
	mkdir -p ../bin
	cp $(CLI_TARGET) ../bin/

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