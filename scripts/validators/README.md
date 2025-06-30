# RKLLMJS Validation System

Modular validation system that enforces RULES.md compliance.

## Architecture

The validation system follows the same modular principles as the rest of RKLLMJS:

```
scripts/validators/
├── core.sh                 # Shared utilities and functions
├── typescript.sh           # TypeScript validation module
├── cpp.sh                  # C++ modular architecture validation
├── test-structure.sh       # Test hierarchy validation
├── documentation.sh        # Documentation and naming validation
└── README.md              # This file
```

## Usage

### Run All Validations
```bash
bash scripts/validate-new.sh
```

### Run Individual Validation Modules
```bash
# TypeScript validation only
bash scripts/validators/typescript.sh

# C++ validation only  
bash scripts/validators/cpp.sh

# Test structure validation only
bash scripts/validators/test-structure.sh

# Documentation and naming validation only
bash scripts/validators/documentation.sh
```

## Validation Modules

### `core.sh` - Shared Utilities
- **Purpose**: Common functions and variables
- **Functions**: 
  - `report_error()`, `report_warning()`, `report_success()`
  - `get_error_count()`, `get_warning_count()`
  - Color definitions and counters

### `typescript.sh` - TypeScript Validation
- **Purpose**: Validate TypeScript source files and unit test coverage
- **Checks**:
  - Unit test coverage (Tier 1: co-located tests)
  - Source file discovery and validation

### `cpp.sh` - C++ Validation  
- **Purpose**: Validate C++ modular architecture
- **Checks**:
  - Required modules exist (core, inference, memory, adapters, utils, napi-bindings)
  - Each module has Makefile with required targets (all, clean, test)
  - Each module has README.md documentation
  - Global build.sh and test.sh scripts exist and are executable
  - Unit test coverage for C++ files

### `test-structure.sh` - Test Structure Validation
- **Purpose**: Validate Tier 2 test hierarchy and test framework
- **Checks**:
  - Tier 2 test directories exist (tests/integration, tests/system, tests/performance)
  - Each test directory has README.md
  - Test framework directory and files exist (src/testing/)
  - Test framework has proper unit test coverage

### `documentation.sh` - Documentation and Naming Validation
- **Purpose**: Validate documentation coverage and naming conventions
- **Checks**:
  - Naming conventions (no prohibited generic names)
  - Directory structure compliance
  - Documentation coverage (README.md in all feature directories)
  - Protected Rockchip assets exist

## Design Principles

### Modularity
- Each validator module is standalone and testable
- Clear separation of concerns
- Shared utilities to avoid duplication

### Maintainability  
- Easy to add new validation rules
- Easy to modify existing validations
- Clear error reporting and debugging

### Compliance
- Validators themselves follow RULES.md
- Each module has single responsibility
- Proper documentation and structure

## Adding New Validations

1. Create new module in `scripts/validators/`
2. Source `core.sh` for shared utilities
3. Implement validation function(s)
4. Add standalone execution capability
5. Import and call from main `validate-new.sh`
6. Update this README.md

## Error Codes

- `0`: All validations passed
- `1`: Validation errors found (CI/CD should fail)
- Individual modules return their own exit codes when run standalone
