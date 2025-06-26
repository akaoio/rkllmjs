# Contributing to RKLLMJS

Thank you for your interest in contributing to RKLLMJS! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Hardware platform (RK3588, RK3576, etc.)
   - Node.js/Bun version
   - Operating system and version
   - Steps to reproduce the issue
   - Expected vs actual behavior

### Feature Requests

1. **Check the roadmap** first to see if it's already planned
2. **Open a discussion** for large features before implementation
3. **Provide use cases** and examples of how the feature would be used

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Follow the coding standards** (see below)
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all checks pass** (linting, tests, build)

## 🔧 Development Setup

### Prerequisites

- Node.js 14+ or Bun 1.0+
- Python 3.8+ (for node-gyp)
- GCC/G++ compiler
- Rockchip hardware with NPU support (for testing)

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/akaoio/rkllmjs.git
cd rkllmjs

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## 📝 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for code formatting
- Add **JSDoc comments** for public APIs
- Use **async/await** instead of callbacks

### C++ (Native Code)

- Follow **Google C++ Style Guide**
- Use **RAII** for resource management
- Add **proper error handling**
- Include **comprehensive comments**

### Naming Conventions

- **PascalCase** for classes and interfaces
- **camelCase** for functions and variables
- **SCREAMING_SNAKE_CASE** for constants
- **kebab-case** for file names

### Example

```typescript
/**
 * Runs inference with the given input parameters
 * @param input The input data for inference
 * @returns Promise resolving to the inference result
 */
async function runInference(input: RKLLMInput): Promise<RKLLMResult> {
  // Implementation
}
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── fixtures/       # Test data
└── helpers/        # Test utilities
```

### Writing Tests

```typescript
import { RKLLM, RKLLMInputType } from '../src/index';

describe('RKLLM', () => {
  let llm: RKLLM;

  beforeEach(() => {
    llm = new RKLLM();
  });

  afterEach(async () => {
    if (llm.initialized) {
      await llm.destroy();
    }
  });

  it('should initialize with valid parameters', async () => {
    // Use environment variable or create a test model file
    const testModelPath = process.env.TEST_MODEL_PATH || './test-fixtures/test-model.rkllm';
    await expect(llm.init({
      modelPath: testModelPath
    })).resolves.not.toThrow();
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific test file
npm test -- --testNamePattern="RKLLM"
```

## 📚 Documentation

### API Documentation

- Use **TSDoc** comments for all public APIs
- Include **examples** in documentation
- Update **API.md** for interface changes

### README Updates

- Keep examples **up to date**
- Add new features to the **features list**
- Update **installation instructions** if needed

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build and test on target hardware
5. Create release tag
6. Publish to npm

## 🏗️ Project Structure

```
rkllmjs/
├── src/                    # TypeScript source code
│   ├── native/            # C++ addon source
│   ├── types.ts           # Type definitions
│   ├── rkllm.ts          # Main RKLLM class
│   └── index.ts          # Main entry point
├── libs/                   # Native libraries
│   └── rkllm/            # Rockchip LLM runtime
├── examples/              # Usage examples
├── benchmarks/            # Performance benchmarks
├── tests/                 # Test files
├── docs/                  # Documentation
└── dist/                  # Built output
```

## 🔄 Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streaming inference support
fix: handle memory allocation failure
docs: update API documentation
test: add unit tests for RKLLM class
```

### Pull Request Process

1. **Create feature branch** from `main`
2. **Implement changes** with tests
3. **Update documentation** as needed
4. **Submit pull request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots/examples if applicable
5. **Address review feedback**
6. **Squash and merge** when approved

## 🐛 Debugging

### Native Code Debugging

```bash
# Build debug version
npm run build:debug

# Run with debug symbols
node-gyp rebuild --debug

# Use gdb for debugging
gdb node
(gdb) run your_script.js
```

### Memory Debugging

```bash
# Check for memory leaks
valgrind --tool=memcheck --leak-check=full node your_script.js
```

### Performance Profiling

```bash
# Profile with perf (Linux)
perf record -g node your_script.js
perf report
```

## 📋 Code Review Guidelines

### For Reviewers

- **Test the changes** on actual hardware when possible
- **Check for memory leaks** in native code
- **Verify documentation** is updated
- **Ensure backwards compatibility**
- **Review performance impact**

### For Contributors

- **Keep PRs focused** and small when possible
- **Write clear commit messages**
- **Respond promptly** to review feedback
- **Test on multiple platforms** if possible

## 🆘 Getting Help

- **Discord**: [Join our community](https://discord.gg/yourserver)
- **GitHub Discussions**: Ask questions and share ideas
- **GitHub Issues**: Report bugs and request features
- **Email**: maintainer@yourproject.com

## 📜 License

By contributing to RKLLMJS, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to RKLLMJS! 🚀
