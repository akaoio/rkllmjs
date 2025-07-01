/**
 * @module memory
 * @purpose Advanced memory management and optimization for RKLLM model operations
 * @description Provides sophisticated memory allocation strategies, caching mechanisms,
 *              and performance optimization for NPU operations. Handles memory pools,
 *              garbage collection, and resource monitoring for efficient RKLLM execution.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include "../config/build-config.hpp"
#include <memory>
#include <vector>
#include <string>
#include <mutex>
#include <unordered_map>
#include <cstddef>
#include <functional>
#include <type_traits>

namespace rkllmjs {
namespace memory {

/**
 * Memory allocation result codes
 */
enum class MemoryResult {
    SUCCESS = 0,
    ERROR_OUT_OF_MEMORY,
    ERROR_INVALID_SIZE,
    ERROR_INVALID_POINTER,
    ERROR_FRAGMENTATION,
    ERROR_ALIGNMENT
};

/**
 * Memory usage statistics
 */
struct MemoryStats {
    size_t total_allocated = 0;     // Total memory allocated (bytes)
    size_t total_free = 0;          // Total memory free (bytes)
    size_t peak_usage = 0;          // Peak memory usage (bytes)
    size_t active_allocations = 0;  // Number of active allocations
    size_t fragmentation_ratio = 0; // Fragmentation percentage (0-100)
    size_t npu_memory_used = 0;     // NPU-specific memory usage
    size_t cpu_memory_used = 0;     // CPU memory usage
};

/**
 * Memory block information
 */
struct MemoryBlock {
    void* ptr = nullptr;
    size_t size = 0;
    size_t alignment = 0;
    bool is_npu_memory = false;
    std::string tag;
    
    MemoryBlock() = default;
    MemoryBlock(void* p, size_t s, size_t a = 0, bool npu = false, const std::string& t = "")
        : ptr(p), size(s), alignment(a), is_npu_memory(npu), tag(t) {}
};

/**
 * Memory allocator interface
 */
class IMemoryAllocator {
public:
    virtual ~IMemoryAllocator() = default;
    
    virtual MemoryResult allocate(size_t size, void** ptr, size_t alignment = 0) = 0;
    virtual MemoryResult deallocate(void* ptr) = 0;
    virtual MemoryStats getStats() const = 0;
    virtual bool isValidPointer(void* ptr) const = 0;
};

/**
 * CPU Memory Allocator
 */
class CPUMemoryAllocator : public IMemoryAllocator {
private:
    mutable std::mutex mutex_;
    std::unordered_map<void*, MemoryBlock> allocations_;
    MemoryStats stats_;
    
    void updateStats();
    
public:
    CPUMemoryAllocator();
    ~CPUMemoryAllocator();
    
    MemoryResult allocate(size_t size, void** ptr, size_t alignment = 0) override;
    MemoryResult deallocate(void* ptr) override;
    MemoryStats getStats() const override;
    bool isValidPointer(void* ptr) const override;
    
    // CPU-specific methods
    MemoryResult reallocate(void* old_ptr, size_t new_size, void** new_ptr);
    void defragment();
};

/**
 * NPU Memory Allocator (for RK3588 NPU)
 */
class NPUMemoryAllocator : public IMemoryAllocator {
private:
    mutable std::mutex mutex_;
    std::unordered_map<void*, MemoryBlock> allocations_;
    MemoryStats stats_;
    bool npu_available_;
    
    void updateStats();
    bool initializeNPU();
    
public:
    NPUMemoryAllocator();
    ~NPUMemoryAllocator();
    
    MemoryResult allocate(size_t size, void** ptr, size_t alignment = 0) override;
    MemoryResult deallocate(void* ptr) override;
    MemoryStats getStats() const override;
    bool isValidPointer(void* ptr) const override;
    
    // NPU-specific methods
    bool isNPUAvailable() const { return npu_available_; }
    void initializeNPULazy(); // Public method for lazy initialization
    MemoryResult allocateContiguous(size_t size, void** ptr);
    MemoryResult mapToNPU(void* cpu_ptr, size_t size, void** npu_ptr);
};

/**
 * Memory Manager - Central memory management
 */
class MemoryManager {
private:
    std::unique_ptr<CPUMemoryAllocator> cpu_allocator_;
    std::unique_ptr<NPUMemoryAllocator> npu_allocator_;
    
    mutable std::mutex mutex_;
    bool initialized_;
    
    MemoryManager();
    
public:
    static MemoryManager& getInstance();
    ~MemoryManager();
    
    // Lifecycle
    MemoryResult initialize();
    void cleanup();
    bool isInitialized() const { return initialized_; }
    
    // Memory allocation
    MemoryResult allocateCPU(size_t size, void** ptr, size_t alignment = 0);
    MemoryResult allocateNPU(size_t size, void** ptr, size_t alignment = 0);
    MemoryResult deallocate(void* ptr);
    
    // Smart pointer helpers
    template<typename T>
    std::unique_ptr<T, std::function<void(void*)>> makeUniqueCPU(size_t count = 1) {
        void* ptr = nullptr;
        auto result = allocateCPU(sizeof(T) * count, &ptr, alignof(T));
        if (result != MemoryResult::SUCCESS) {
            return {nullptr, [](void*){}};
        }
        return {static_cast<T*>(ptr), [this](void* p){ this->deallocate(p); }};
    }
    
    template<typename T>
    std::unique_ptr<T, std::function<void(void*)>> makeUniqueNPU(size_t count = 1) {
        void* ptr = nullptr;
        auto result = allocateNPU(sizeof(T) * count, &ptr, alignof(T));
        if (result != MemoryResult::SUCCESS) {
            return {nullptr, [](void*){}};
        }
        return {static_cast<T*>(ptr), [this](void* p){ this->deallocate(p); }};
    }
    
    // Statistics and monitoring
    MemoryStats getCombinedStats() const;
    MemoryStats getCPUStats() const;
    MemoryStats getNPUStats() const;
    
    // Utility functions
    bool isNPUAvailable() const;
    MemoryResult optimizeMemory();
    void logMemoryUsage() const;
    
    // Error handling
    static std::string getErrorMessage(MemoryResult result);
};

/**
 * RAII Memory Guard for automatic cleanup
 */
template<typename T>
class MemoryGuard {
private:
    T* ptr_;
    MemoryManager* manager_;
    
public:
    explicit MemoryGuard(T* ptr, MemoryManager* mgr = nullptr) 
        : ptr_(ptr), manager_(mgr ? mgr : &MemoryManager::getInstance()) {}
    
    ~MemoryGuard() {
        if (ptr_) {
            manager_->deallocate(ptr_);
        }
    }
    
    // Move only
    MemoryGuard(const MemoryGuard&) = delete;
    MemoryGuard& operator=(const MemoryGuard&) = delete;
    
    MemoryGuard(MemoryGuard&& other) noexcept 
        : ptr_(other.ptr_), manager_(other.manager_) {
        other.ptr_ = nullptr;
    }
    
    MemoryGuard& operator=(MemoryGuard&& other) noexcept {
        if (this != &other) {
            if (ptr_) {
                manager_->deallocate(ptr_);
            }
            ptr_ = other.ptr_;
            manager_ = other.manager_;
            other.ptr_ = nullptr;
        }
        return *this;
    }
    
    T* get() const { return ptr_; }
    T* release() { 
        T* tmp = ptr_; 
        ptr_ = nullptr; 
        return tmp; 
    }
    
    explicit operator bool() const { return ptr_ != nullptr; }
    
    // Only provide dereference operators for non-void types
    template<typename U = T>
    typename std::enable_if<!std::is_void<U>::value, U&>::type
    operator*() const { return *ptr_; }
    
    template<typename U = T>
    typename std::enable_if<!std::is_void<U>::value, U*>::type
    operator->() const { return ptr_; }
};

} // namespace memory
} // namespace rkllmjs
