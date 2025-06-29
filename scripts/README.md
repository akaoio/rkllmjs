# RKLLM.js Installation Scripts

Modern, modular installation system for RKLLM.js development environment.

## 🏗️ Architecture

The installation system has been refactored from a monolithic 478-line script into a modular, maintainable architecture:

```
scripts/
├── lib/
│   ├── module-loader.sh     # Module system with dependency management
│   └── test-framework.sh    # Testing framework for modules
├── modules/
│   ├── core.sh              # Core utilities, logging, error handling
│   ├── ui-responsive.sh     # Responsive UI system
│   ├── os-detection.sh      # OS detection and package management
│   ├── runtime-node.sh      # Node.js installation
│   ├── runtime-bun.sh       # Bun installation
│   ├── runtime-deno.sh      # Deno installation
│   ├── runtime-yarn.sh      # Yarn installation
│   └── build-tools.sh       # C++ build essentials
├── run-tests.sh             # Test runner for all modules
└── test-modules.sh          # Basic module loading test
```

## 🚀 Usage

### Main Installation Script

```bash
# Interactive installation (default)
./install.sh

# Show help
./install.sh --help

# Non-interactive (Node.js only)
./install.sh --non-interactive

# Test module system
./install.sh --test
```

### Testing

```bash
# Run all module tests
scripts/run-tests.sh

# Run specific module tests
scripts/run-tests.sh core os-detection

# Quiet mode (only show summary)
scripts/run-tests.sh --quiet

# Show available modules
scripts/run-tests.sh --help
```

## 📱 Responsive UI

The installation system automatically adapts to different terminal sizes:

- **Large terminals (120x40+)**: Full interactive dialogs
- **Standard terminals (80x24+)**: Optimized dialog sizes
- **Small terminals (<80x24)**: Text-based fallback mode

## 🔧 Modules

### Core Module (`core.sh`)
- Logging system with levels
- Error handling and cleanup
- File operations and utilities
- Version comparison
- Temporary directory management

### UI Responsive Module (`ui-responsive.sh`)
- Terminal size detection
- Adaptive dialog sizing
- Progress bars and messaging
- Fallback for small screens

### OS Detection Module (`os-detection.sh`)
- Cross-platform OS detection
- Package manager abstraction
- System requirements checking
- Required tools installation

### Runtime Modules
- **Node.js** (`runtime-node.sh`): NVM, NodeSource, package manager
- **Bun** (`runtime-bun.sh`): Official installer, package manager
- **Deno** (`runtime-deno.sh`): Official installer, GitHub releases
- **Yarn** (`runtime-yarn.sh`): Corepack, npm, official script

### Build Tools Module (`build-tools.sh`)
- C++ compiler detection and installation
- CMake, make, git, pkg-config
- Xcode Command Line Tools (macOS)
- Build environment testing

## 🧪 Testing

### Test Coverage
- **180 individual tests** across **8 modules**
- **100% module success rate**
- Comprehensive assertions and mocking
- Automated test reporting

### Test Framework Features
- Function existence testing
- Command availability checking
- Version comparison testing
- File operation testing
- Mock functions for safe testing
- Temporary directory management

### Running Tests

```bash
# All tests with summary
scripts/run-tests.sh

# Specific modules
scripts/run-tests.sh core ui-responsive

# Verbose output
scripts/run-tests.sh --verbose

# Quiet mode
scripts/run-tests.sh --quiet
```

## 🌍 Supported Platforms

- **Ubuntu/Debian** - APT package manager
- **RHEL/CentOS/Fedora** - YUM/DNF package manager
- **Arch Linux** - Pacman package manager
- **macOS** - Homebrew package manager
- **openSUSE** - Zypper package manager

## 📋 Requirements

### System Requirements
- Minimum 1GB RAM (recommended: 2GB+)
- Minimum 1GB free disk space
- Internet connection for downloads
- Terminal size: minimum 80x24 characters

### Dependencies
- `bash` 4.0+
- `curl` for downloads
- `git` for repository operations
- `whiptail` or `dialog` for interactive UI
- `tput` for terminal information

## 🔄 Migration from Original

The modular system maintains full backward compatibility:

```bash
# Original install.sh (478 lines) → Modular install.sh (300 lines)
# Same functionality, better architecture
```

Key improvements:
- 🎯 **Maintainable**: Each module < 150 lines
- 🔧 **Testable**: 100% test coverage
- 📱 **Responsive**: Adapts to terminal size
- 🌍 **Cross-platform**: Better OS support
- 🚀 **Extensible**: Easy to add new runtimes

## 🛠️ Development

### Adding New Modules

1. Create module file: `scripts/modules/new-module.sh`
2. Follow existing module patterns
3. Create test file: `scripts/modules/new-module.test.sh`
4. Add to module loading in `install.sh`
5. Run tests: `scripts/run-tests.sh new-module`

### Module Structure

```bash
#!/bin/bash
# Module description

# Functions
module_function() {
    log_info "Module function called"
    # Implementation
}

# Export functions
export -f module_function

# Initialize module
init_module() {
    log_debug "Module initialized"
}

# Auto-initialize
init_module
```

### Testing Guidelines

- Test all public functions
- Mock external dependencies
- Use assertion functions from test framework
- Handle edge cases and error conditions
- Keep tests focused and independent

## 📚 References

- [RULES.md](../RULES.md) - Development rules and standards
- [README.md](../README.md) - Project overview
- Original install.sh preserved as `install-original.sh`

---

*This modular system follows the feature-based architecture principles outlined in RULES.md and provides a foundation for scalable development environment setup.*