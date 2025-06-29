# CI/CD Documentation for RKLLMJS

> **Optimized CI/CD pipeline for Orange Pi 5 Plus with RK3588 NPU**

---

## 🎯 Target Platform

This CI/CD pipeline is specifically designed and optimized for:

- **Hardware**: Orange Pi 5 Plus with RK3588 chip
- **Architecture**: ARM64 (aarch64)
- **Operating Systems**: 
  - Armbian Bookworm (recommended)
  - Armbian with GUI
  - Ubuntu (Orange Pi 5 optimized versions)
- **NPU**: RK3588 Neural Processing Unit

---

## 🚀 Pipeline Overview

### Primary Philosophy

Unlike generic cross-platform CI/CD, this pipeline is **target-platform focused**:

1. **Primary Testing**: Focused on RK3588/ARM64 compatibility
2. **Cross-Platform**: Limited to essential compatibility checks
3. **Efficiency**: Reduced matrix combinations for faster feedback
4. **RK3588 Assets**: Verification of NPU libraries and headers

---

## 📋 Workflow Details

### 1. Test & Quality Checks (`test.yml`)

#### Primary Test Job
- **Purpose**: Main testing for RK3588 target platform
- **Matrix**: Node.js 18, 20 (reduced from 16, 18, 20)
- **Platform**: Ubuntu (ARM64 compatible)
- **Focus**: RULES.md compliance, TypeScript compilation, unit tests

#### Cross-Platform Job
- **Purpose**: Essential compatibility verification
- **Matrix**: Ubuntu x64/arm64 with Node.js 20
- **Reduced Scope**: Only critical combinations tested

#### Code Quality Job
- **Purpose**: ESLint, Prettier, TypeScript type checking
- **Platform**: Ubuntu latest
- **Tools**: Fixed ESLint configuration, Prettier formatting

#### Build Verification Job
- **Purpose**: RK3588 asset verification
- **Checks**: 
  - NPU library (`librkllmrt.so`) presence
  - RKLLM headers (`rkllm.h`) verification
  - Build artifact validation

#### Alternative Runtimes Job
- **Purpose**: Orange Pi 5 runtime compatibility
- **Condition**: Only runs on main branch pushes
- **Runtimes**: Bun, Deno (Orange Pi 5 compatible versions)

### 2. Security & Compliance (`security.yml`)

#### Enhanced Security Focus
- **Dependency Scan**: RK3588-specific vulnerability analysis
- **Code Security**: CodeQL analysis for ARM64 compatibility
- **License Compliance**: Orange Pi 5 platform considerations
- **Secret Scanning**: Unchanged functionality
- **RK3588 Assets**: Dedicated verification job for NPU libraries

### 3. Release & Publish (`release.yml`)

#### RK3588-Targeted Releases
- **Asset Verification**: Pre-release RK3588 library checks
- **Package Metadata**: Platform-specific NPM package info
- **Documentation**: Orange Pi 5 setup guides
- **Changelog**: RK3588 and Orange Pi 5 focus

#### NPM Publishing
- **Platform Tags**: `os: ['linux']`, `cpu: ['arm64']`
- **Keywords**: Added `orange-pi-5`, `armbian`, `sbc`
- **Installation Docs**: Orange Pi 5 specific instructions

### 4. CI/CD Monitoring (`monitor.yml`)

#### Enhanced Issue Creation
- **Context**: RK3588 and Orange Pi 5 specific labels
- **Debugging**: Architecture and platform information
- **Metrics**: Target platform performance tracking

---

## 🔧 Key Improvements Made

### 1. Fixed Critical Issues
- ✅ **ESLint Configuration**: Added proper `.eslintrc.json`
- ✅ **Code Quality**: Fixed all linting and formatting issues
- ✅ **TypeScript**: Resolved compilation warnings

### 2. Platform Optimization
- ✅ **Reduced Matrix**: From 9 combinations to 4 essential ones
- ✅ **ARM64 Focus**: Specific ARM64 runner configurations
- ✅ **RK3588 Assets**: Dedicated verification steps

### 3. Enhanced Monitoring
- ✅ **Platform Labels**: RK3588, Orange Pi 5 specific tags
- ✅ **Better Summaries**: Target platform information in all outputs
- ✅ **Focused Alerts**: Architecture-specific failure notifications

---

## 🏗️ CI/CD Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Primary Test   │  │  Cross-Platform  │  │ Code Quality│ │
│  │   (RK3588)      │  │   Compatibility  │  │   Checks    │ │
│  │                 │  │                  │  │             │ │
│  │ • Node 18, 20   │  │ • Ubuntu x64     │  │ • ESLint    │ │
│  │ • ARM64 focus   │  │ • Ubuntu arm64   │  │ • Prettier  │ │
│  │ • Unit tests    │  │ • Essential only │  │ • TypeScript│ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Build Verify    │  │  Security Scan   │  │ RK3588      │ │
│  │ (RK3588 Assets) │  │   (ARM64)        │  │ Monitoring  │ │
│  │                 │  │                  │  │             │ │
│  │ • NPU library   │  │ • Dependencies   │  │ • Artifacts │ │
│  │ • RKLLM headers │  │ • Code analysis  │  │ • Metrics   │ │
│  │ • Build outputs │  │ • Licenses       │  │ • Alerts    │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orange Pi 5 Plus                        │
│                  (RK3588 + NPU)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Armbian Bookworm / Ubuntu                              │
│  • ARM64 (aarch64) Architecture                           │
│  • RK3588 Neural Processing Unit                          │
│  • Node.js / Bun / Deno Runtime Support                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚦 Workflow Execution

### On Pull Request
1. **Primary Test**: RK3588 compatibility verification
2. **Code Quality**: ESLint, Prettier, TypeScript checks
3. **Cross-Platform**: Essential compatibility tests
4. **Security**: Basic security and compliance checks

### On Main Branch Push
1. **All PR Jobs**: Plus additional checks
2. **Alternative Runtimes**: Bun/Deno Orange Pi 5 compatibility
3. **Enhanced Security**: Full security scan suite
4. **Monitoring**: Performance metrics and alerts

### On Release Tag
1. **Full Test Suite**: Complete validation
2. **RK3588 Asset Verification**: Pre-release checks
3. **NPM Publishing**: Platform-specific package
4. **Documentation**: Orange Pi 5 setup guides

---

## 🔍 Debugging CI/CD Issues

### Common Issues and Solutions

#### 1. ESLint Failures
```bash
# Fixed with proper .eslintrc.json configuration
npm run lint
```

#### 2. Build Failures
```bash
# Verify RK3588 assets
ls -la libs/rkllm/aarch64/librkllmrt.so
ls -la libs/rkllm/include/rkllm.h
```

#### 3. Architecture Mismatches
```bash
# Check current architecture
uname -m
echo $GITHUB_ENV
```

### Monitoring Tools

- **GitHub Actions**: Real-time workflow monitoring
- **Artifact Upload**: Test logs and build outputs
- **Issue Creation**: Automatic failure notifications
- **Step Summaries**: Platform-specific reporting

---

## 📈 Performance Optimizations

### Before (Generic CI/CD)
- **Matrix Size**: 9 combinations (3 Node.js × 3 OS)
- **Runtime**: ~15-20 minutes per run
- **Platform Focus**: Generic cross-platform
- **Failure Rate**: High (due to platform mismatches)

### After (RK3588 Optimized)
- **Matrix Size**: 4 essential combinations
- **Runtime**: ~8-12 minutes per run
- **Platform Focus**: Orange Pi 5 Plus specific
- **Failure Rate**: Low (targeted platform testing)

---

## 🛠️ Local Development

### Running CI/CD Steps Locally

```bash
# Install dependencies
npm ci

# Run validation (RULES.md compliance)
npm run validate

# Run linting
npm run lint

# Run formatting check
npx prettier --check src/**/*.ts

# Run TypeScript compilation
npm run build:ts

# Run tests
npm run test:node

# Full build (includes validation and tests)
npm run build
```

### RK3588 Asset Verification

```bash
# Check NPU library
file libs/rkllm/aarch64/librkllmrt.so

# Check headers
head -20 libs/rkllm/include/rkllm.h

# Verify architecture
readelf -h libs/rkllm/aarch64/librkllmrt.so | grep Machine
```

---

## 🎯 Future Enhancements

### Planned Improvements
1. **Self-Hosted Runners**: Orange Pi 5 Plus based runners
2. **Hardware-in-Loop**: Real NPU testing
3. **Performance Benchmarks**: RK3588 specific metrics
4. **Cross-Compilation**: Multiple ARM variants

### Monitoring Enhancements
1. **NPU Health Checks**: Real hardware verification
2. **Performance Regression**: Benchmark comparisons
3. **Platform Compatibility**: OS version matrix
4. **Energy Efficiency**: Power consumption metrics

---

## 📞 Support

For CI/CD issues specific to Orange Pi 5 Plus or RK3588:

1. **Check Workflow Logs**: GitHub Actions detailed logs
2. **Review Artifacts**: Uploaded test logs and reports
3. **Monitor Issues**: Auto-created failure notifications
4. **Platform Verification**: RK3588 asset checks

**Target Platform**: Orange Pi 5 Plus with RK3588 NPU  
**Architecture**: ARM64 (aarch64)  
**OS Support**: Armbian Bookworm, Ubuntu (Orange Pi 5 optimized)  
**Runtime**: Node.js (primary), Bun/Deno (experimental)