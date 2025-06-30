# LLM Handle Module

High-level abstractions for managing RKLLM model instances and inference sessions.

## Overview

The LLM Handle module provides object-oriented interfaces for managing RKLLM model lifecycles, inference sessions, and resource allocation. This module acts as a bridge between the low-level C++ RKLLM APIs and the higher-level JavaScript interface.

## Features

- **Model Management**: Load, initialize, and manage RKLLM model instances
- **Session Handling**: Create and manage inference sessions
- **Resource Tracking**: Monitor and control resource usage per model
- **Configuration Management**: Handle model-specific configurations
- **Lifecycle Management**: Proper initialization and cleanup of models

## Architecture

```
src/bindings/llm-handle/
├── llm-handle.hpp          # Main LLM handle interfaces
├── llm-handle.cpp          # LLM handle implementations
├── model-manager.hpp       # Model lifecycle management
├── model-manager.cpp       # Model lifecycle implementations
├── session-manager.hpp     # Session management interfaces  
├── session-manager.cpp     # Session management implementations
└── llm-handle.test.cpp     # Unit tests
```

## Usage

This module provides the following main classes:

- `RKLLMHandle` - Main model handle class
- `ModelManager` - Model lifecycle management
- `SessionManager` - Inference session management

## Dependencies

- Core module for basic RKLLM functionality
- Memory module for memory management
- Utils module for type conversion and error handling

## Building

```bash
cd src/bindings/llm-handle
make
```

## Testing

```bash
cd src/bindings/llm-handle  
make test
```

## Status

🚧 **In Development** - This module is currently being implemented.
