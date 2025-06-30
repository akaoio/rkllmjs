# C++ Module Include Directory

Central header collection for cross-module includes.

## Overview

This directory serves as a central collection point for header files that need to be shared across multiple C++ modules in the RKLLM binding system.

## Purpose

- **Header Aggregation**: Collect commonly used headers
- **Cross-Module Includes**: Facilitate module interdependencies
- **Build Optimization**: Reduce duplicate header inclusions
- **Namespace Management**: Organize shared declarations

## Structure

```
include/
├── common/
│   ├── types.hpp          # Common type definitions
│   ├── constants.hpp      # Shared constants
│   └── macros.hpp         # Utility macros
├── interfaces/
│   ├── rkllm-interface.hpp  # RKLLM API interface
│   └── binding-interface.hpp # N-API binding interface
└── utils/
    ├── error-codes.hpp    # Error code definitions
    └── logging.hpp        # Logging utilities
```

## Usage

Include shared headers in your modules:

```cpp
#include "../include/common/types.hpp"
#include "../include/interfaces/rkllm-interface.hpp"
#include "../include/utils/error-codes.hpp"
```

## Files (Planned)

- `common/types.hpp` - Shared type definitions
- `common/constants.hpp` - Global constants
- `interfaces/rkllm-interface.hpp` - RKLLM API abstractions
- `utils/error-codes.hpp` - Standardized error codes
- `utils/logging.hpp` - Logging macros and utilities

## Implementation Status

🚧 **Planned**: Directory structure planned, files to be created as needed

## Integration

This directory supports:
- **All C++ Modules**: Provides shared definitions
- **Build System**: Centralized include path
- **Code Organization**: Consistent interfaces across modules
