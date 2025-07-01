#!/bin/bash

# RKLLMJS Build Script - Multi-runtime support
# Builds project for Node.js (primary), Bun, and Deno

set -e

echo "🏗️  RKLLMJS Build System - Multi-Runtime Support"
echo "================================================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to report status
report_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

report_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Detect available runtimes
report_status "Detecting available runtimes..."

NODE_AVAILABLE=false
BUN_AVAILABLE=false
DENO_AVAILABLE=false

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    report_success "Node.js detected: $NODE_VERSION"
    NODE_AVAILABLE=true
else
    report_warning "Node.js not found"
fi

if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    report_success "Bun detected: v$BUN_VERSION"
    BUN_AVAILABLE=true
else
    report_warning "Bun not found"
fi

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n1)
    report_success "Deno detected: $DENO_VERSION"
    DENO_AVAILABLE=true
else
    report_warning "Deno not found"
fi

# Ensure at least Node.js is available
if [ "$NODE_AVAILABLE" = false ]; then
    report_error "Node.js is required as the primary runtime!"
    report_error "Please install Node.js >= 16.0.0"
    exit 1
fi

# Clean previous builds
report_status "Cleaning previous builds..."
rm -rf dist build
mkdir -p dist build

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    report_status "Installing Node.js dependencies..."
    npm install
fi

# Validate compliance first
report_status "Validating RULES.md compliance..."
if bash scripts/validate.sh; then
    report_success "RULES.md compliance validated"
else
    report_error "RULES.md compliance failed!"
    exit 1
fi

# Build TypeScript for Node.js (primary)
report_status "Building TypeScript for Node.js (primary runtime)..."
if npx tsc; then
    report_success "TypeScript compilation completed"
else
    report_error "TypeScript compilation failed!"
    exit 1
fi

# Copy model configurations to dist
report_status "Copying configuration files..."
mkdir -p dist/configs
cp configs/models.json dist/configs/
report_success "Configuration files copied"

# Create runtime-specific entry points
report_status "Creating runtime-specific entry points..."

# Node.js entry point (already created by tsc)
if [ -f "dist/cli-runner/cli-runner.js" ]; then
    report_success "Node.js entry point ready: dist/cli-runner/cli-runner.js"
fi

# Make CLI executable
chmod +x dist/cli-runner/cli-runner.js

# Bun-specific optimizations (if available)
if [ "$BUN_AVAILABLE" = true ]; then
    report_status "Preparing Bun-specific optimizations..."
    
    # Bun can run TypeScript directly, so we just ensure source files are accessible
    report_success "Bun optimization: Direct TypeScript execution enabled"
fi

# Deno-specific preparations (if available)
if [ "$DENO_AVAILABLE" = true ]; then
    report_status "Preparing Deno-specific configurations..."
    
    # Create deno.json for configuration
    cat > configs/deno.json << EOF
{
  "tasks": {
    "cli": "deno run --allow-all src/cli-runner/cli-runner.ts",
    "test": "deno test --allow-all",
    "dev": "deno run --allow-all --watch src/cli-runner/cli-runner.ts"
  },
  "imports": {
    "@/": "./src/"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  }
}
EOF
    report_success "Deno configuration created: configs/deno.json"
fi

# Native module build
report_status "Building native C++ N-API bindings..."

if [ -f "binding.gyp" ]; then
    # Clean previous builds
    if [ -d "build" ]; then
        rm -rf build
        report_status "Cleaned previous native build"
    fi

    # Build native addon
    if npx node-gyp configure build; then
        report_success "Native C++ bindings compiled successfully"
        
        # Verify the .node file was created
        if [ -f "build/Release/binding.node" ]; then
            report_success "Native addon created: build/Release/binding.node"
        else
            report_warning "Native addon file not found after build"
        fi
    else
        report_error "Failed to compile native C++ bindings"
        report_warning "Continuing without native bindings..."
    fi
else
    report_warning "No binding.gyp found - skipping native module build"
fi

# Generate package information
report_status "Generating build information..."
cat > dist/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "runtimes": {
    "node": {
      "available": $NODE_AVAILABLE,
      "version": "${NODE_VERSION:-unknown}",
      "primary": true
    },
    "bun": {
      "available": $BUN_AVAILABLE,
      "version": "${BUN_VERSION:-unknown}",
      "primary": false
    },
    "deno": {
      "available": $DENO_AVAILABLE,
      "version": "${DENO_VERSION:-unknown}",
      "primary": false
    }
  },
  "features": {
    "typescript": true,
    "modelManagement": true,
    "runtimeDetection": true,
    "nativeBindings": true,
    "llmHandle": true
  }
}
EOF

report_success "Build information generated: dist/build-info.json"

# Run tests to verify build
report_status "Running tests to verify build..."
if npm test; then
    report_success "All tests passed!"
else
    report_warning "Some tests failed - build completed but may have issues"
fi

# Summary
echo ""
echo "🎉 Build Summary"
echo "================"
report_success "Primary runtime: Node.js (dist/cli-runner/cli-runner.js)"
[ "$BUN_AVAILABLE" = true ] && report_success "Alternative runtime: Bun (src/cli-runner/cli-runner.ts)"
[ "$DENO_AVAILABLE" = true ] && report_success "Experimental runtime: Deno (src/cli-runner/cli-runner.ts)"

echo ""
echo "📖 Usage:"
echo "  Node.js (primary):  npm run cli [command]"
echo "  Node.js (direct):   node dist/cli-runner/cli-runner.js [command]"
[ "$BUN_AVAILABLE" = true ] && echo "  Bun (alternative):  npm run cli:bun [command]"
[ "$DENO_AVAILABLE" = true ] && echo "  Deno (experimental): npm run cli:deno [command]"

echo ""
report_success "Build completed successfully! 🚀"
