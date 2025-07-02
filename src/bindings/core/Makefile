# Core Module Makefile
# Builds rkllm-manager and its unit tests

MODULE_NAME = rkllm-manager
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -fPIC -I../../../libs/rkllm/include -I../config -I../testing -O2

# Architecture-aware library linking
ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
    LIBS = -L../../../libs/rkllm/aarch64 -lrkllmrt -pthread
    RPATH = -Wl,-rpath,'$$ORIGIN/../../../libs/rkllm/aarch64'
else
    # CI/CD mode: compilation without runtime library linking
    LIBS = -pthread
    RPATH = 
endif

# Debug/Release configuration
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
TARGET = lib$(MODULE_NAME).a
TEST_TARGET = $(MODULE_NAME).test

# Architecture-aware target selection - only skip tests on non-ARM64 due to hardware linking
ifeq ($(SYSTEM_ARCH_FAMILY),arm64)
    ALL_TARGETS = $(TARGET) $(TEST_TARGET)
else
    # CI/CD mode: only build static library, skip hardware-dependent tests
    ALL_TARGETS = $(TARGET)
endif

# Default target
.PHONY: all
all: $(ALL_TARGETS)

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
