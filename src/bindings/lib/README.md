# C++ Module Library Directory

Compiled libraries and build artifacts for RKLLM C++ modules.

## Overview

This directory contains compiled static libraries (`.a` files) and other build artifacts from the RKLLM C++ modules.

## Purpose

- **Library Storage**: Central location for compiled static libraries
- **Build Artifacts**: Intermediate build files and outputs
- **Module Integration**: Libraries used for linking between modules
- **Distribution**: Packaged libraries for distribution

## Structure

```
lib/
├── librkllm-core.a        # Core module library
├── librkllm-utils.a       # Utils module library  
├── librkllm-inference.a   # Inference module library
├── librkllm-memory.a      # Memory module library (planned)
├── librkllm-adapters.a    # Adapters module library (planned)
└── librkllm-bindings.a    # N-API bindings library (planned)
```

## Build Process

Libraries are created by the individual module Makefiles:

```bash
# Core module
cd ../core && make install

# Utils module  
cd ../utils && make install

# Inference module
cd ../inference && make install
```

## Usage

Link against libraries in your projects:

```makefile
LIBS = -L../lib -lrkllm-core -lrkllm-utils -lrkllm-inference
```

## Current Status

**Available Libraries:**
- ✅ `librkllm-utils.a` - Utils module
- ✅ `librkllm-inference.a` - Inference module
- ✅ `librkllm-core.a` - Core module (available in module directory)

**Planned Libraries:**
- 🚧 `librkllm-memory.a` - Memory module
- 🚧 `librkllm-adapters.a` - Adapters module  
- 🚧 `librkllm-bindings.a` - N-API bindings

## Integration

This directory supports:
- **Module Linking**: Inter-module dependencies
- **Build System**: Central library location
- **Distribution**: Package preparation
