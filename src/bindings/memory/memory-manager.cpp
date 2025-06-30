#include "memory-manager.hpp"
#include "../config/build-config.hpp"
#include <iostream>
#include <cstdlib>
#include <cstring>
#include <algorithm>

#ifndef SANDBOX_BUILD
#include <sys/mman.h>
#include <unistd.h>
#endif

namespace rkllmjs {
namespace memory {

// ============================================================================
// CPUMemoryAllocator Implementation
// ============================================================================

CPUMemoryAllocator::CPUMemoryAllocator() {
    stats_ = {};
}

CPUMemoryAllocator::~CPUMemoryAllocator() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Cleanup remaining allocations
    for (auto& [ptr, block] : allocations_) {
        if (ptr) {
            std::free(ptr);
        }
    }
    allocations_.clear();
}

MemoryResult CPUMemoryAllocator::allocate(size_t size, void** ptr, size_t alignment) {
    if (!ptr || size == 0) {
        return MemoryResult::ERROR_INVALID_SIZE;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    void* allocated_ptr = nullptr;
    
    if (alignment > 0) {
        // Aligned allocation
#ifndef SANDBOX_BUILD
        if (posix_memalign(&allocated_ptr, alignment, size) != 0) {
            return MemoryResult::ERROR_OUT_OF_MEMORY;
        }
#else
        // Simplified mode: just use regular malloc for safety
        // Real alignment would need more complex logic
        allocated_ptr = std::malloc(size);
#endif
    } else {
        // Regular allocation
        allocated_ptr = std::malloc(size);
    }
    
    if (!allocated_ptr) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    // Zero initialize
    std::memset(allocated_ptr, 0, size);
    
    // Track allocation
    MemoryBlock block(allocated_ptr, size, alignment, false, "cpu_alloc");
    allocations_[allocated_ptr] = block;
    
    *ptr = allocated_ptr;
    updateStats();
    
    return MemoryResult::SUCCESS;
}

MemoryResult CPUMemoryAllocator::deallocate(void* ptr) {
    if (!ptr) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = allocations_.find(ptr);
    if (it == allocations_.end()) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    std::free(ptr);
    allocations_.erase(it);
    updateStats();
    
    return MemoryResult::SUCCESS;
}

MemoryStats CPUMemoryAllocator::getStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return stats_;
}

bool CPUMemoryAllocator::isValidPointer(void* ptr) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return allocations_.find(ptr) != allocations_.end();
}

MemoryResult CPUMemoryAllocator::reallocate(void* old_ptr, size_t new_size, void** new_ptr) {
    if (!new_ptr) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    if (!old_ptr) {
        return allocate(new_size, new_ptr);
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = allocations_.find(old_ptr);
    if (it == allocations_.end()) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    void* reallocated = std::realloc(old_ptr, new_size);
    if (!reallocated) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    // Update tracking
    MemoryBlock old_block = it->second;
    allocations_.erase(it);
    
    MemoryBlock new_block(reallocated, new_size, old_block.alignment, false, old_block.tag);
    allocations_[reallocated] = new_block;
    
    *new_ptr = reallocated;
    updateStats();
    
    return MemoryResult::SUCCESS;
}

void CPUMemoryAllocator::defragment() {
    // CPU memory defragmentation is limited - just update stats
    std::lock_guard<std::mutex> lock(mutex_);
    updateStats();
}

void CPUMemoryAllocator::updateStats() {
    stats_.active_allocations = allocations_.size();
    stats_.total_allocated = 0;
    
    for (const auto& [ptr, block] : allocations_) {
        stats_.total_allocated += block.size;
    }
    
    stats_.cpu_memory_used = stats_.total_allocated;
    stats_.peak_usage = std::max(stats_.peak_usage, stats_.total_allocated);
    
    // Simple fragmentation estimate
    if (stats_.active_allocations > 0) {
        stats_.fragmentation_ratio = std::min(100UL, 
            (stats_.active_allocations * 100) / std::max(1UL, stats_.total_allocated / 1024));
    }
}

// ============================================================================
// NPUMemoryAllocator Implementation  
// ============================================================================

NPUMemoryAllocator::NPUMemoryAllocator() : npu_available_(false) {
    stats_ = {};
    // Defer NPU initialization to avoid constructor issues
}

NPUMemoryAllocator::~NPUMemoryAllocator() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Cleanup NPU allocations
    for (auto& [ptr, block] : allocations_) {
        if (ptr && block.is_npu_memory) {
#ifndef SANDBOX_BUILD
            // Real NPU cleanup would go here
            // For now, treat as regular memory
            std::free(ptr);
#else
            std::free(ptr);
#endif
        }
    }
    allocations_.clear();
}

bool NPUMemoryAllocator::initializeNPU() {
#ifndef SANDBOX_BUILD
    // Real NPU initialization would go here
    // Check for RK3588 NPU availability
    // For now, just simulate quick check without output
    return true; // Assume available in full mode
#else
    // Simplified mode: simulate NPU availability quickly without output
    return true;
#endif
}

void NPUMemoryAllocator::initializeNPULazy() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!npu_available_) {
        npu_available_ = initializeNPU();
    }
}

MemoryResult NPUMemoryAllocator::allocate(size_t size, void** ptr, size_t alignment) {
    if (!ptr || size == 0) {
        return MemoryResult::ERROR_INVALID_SIZE;
    }
    
    if (!npu_available_) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    void* allocated_ptr = nullptr;
    
#ifndef SANDBOX_BUILD
    // Real NPU memory allocation would go here
    // For now, use regular malloc as placeholder
    allocated_ptr = std::malloc(size);
#else
    // Simulate NPU memory allocation
    allocated_ptr = std::malloc(size);
#endif
    
    if (!allocated_ptr) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    // Zero initialize
    std::memset(allocated_ptr, 0, size);
    
    // Track allocation
    MemoryBlock block(allocated_ptr, size, alignment, true, "npu_alloc");
    allocations_[allocated_ptr] = block;
    
    *ptr = allocated_ptr;
    updateStats();
    
    return MemoryResult::SUCCESS;
}

MemoryResult NPUMemoryAllocator::deallocate(void* ptr) {
    if (!ptr) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = allocations_.find(ptr);
    if (it == allocations_.end()) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
#ifndef SANDBOX_BUILD
    // Real NPU memory deallocation
    std::free(ptr);
#else
    std::free(ptr);
#endif
    
    allocations_.erase(it);
    updateStats();
    
    return MemoryResult::SUCCESS;
}

MemoryStats NPUMemoryAllocator::getStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return stats_;
}

bool NPUMemoryAllocator::isValidPointer(void* ptr) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return allocations_.find(ptr) != allocations_.end();
}

MemoryResult NPUMemoryAllocator::allocateContiguous(size_t size, void** ptr) {
    // Contiguous allocation - same as regular for now
    return allocate(size, ptr, 0);
}

MemoryResult NPUMemoryAllocator::mapToNPU(void* cpu_ptr, size_t size, void** npu_ptr) {
    if (!cpu_ptr || !npu_ptr || size == 0) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
#ifndef SANDBOX_BUILD
    // Real CPU->NPU memory mapping would go here
    *npu_ptr = cpu_ptr; // For now, just return same pointer
    return MemoryResult::SUCCESS;
#else
    // Simulate mapping
    *npu_ptr = cpu_ptr;
    return MemoryResult::SUCCESS;
#endif
}

void NPUMemoryAllocator::updateStats() {
    stats_.active_allocations = allocations_.size();
    stats_.total_allocated = 0;
    
    for (const auto& [ptr, block] : allocations_) {
        stats_.total_allocated += block.size;
    }
    
    stats_.npu_memory_used = stats_.total_allocated;
    stats_.peak_usage = std::max(stats_.peak_usage, stats_.total_allocated);
    
    // NPU memory is typically less fragmented
    stats_.fragmentation_ratio = stats_.active_allocations > 0 ? 
        std::min(50UL, stats_.active_allocations * 10) : 0;
}

// ============================================================================
// MemoryManager Implementation
// ============================================================================

MemoryManager::MemoryManager() : initialized_(false) {}

MemoryManager& MemoryManager::getInstance() {
    static MemoryManager instance;
    return instance;
}

MemoryManager::~MemoryManager() {
    cleanup();
}

MemoryResult MemoryManager::initialize() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (initialized_) {
        return MemoryResult::SUCCESS;
    }
    
    try {
        cpu_allocator_ = std::make_unique<CPUMemoryAllocator>();
        npu_allocator_ = std::make_unique<NPUMemoryAllocator>();
        
        // Initialize NPU after construction
        if (npu_allocator_) {
            npu_allocator_->initializeNPULazy();
        }
        
        initialized_ = true;
        
        return MemoryResult::SUCCESS;
    } catch (const std::exception& e) {
        std::cerr << "[MemoryManager] Initialization failed: " << e.what() << std::endl;
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
}

void MemoryManager::cleanup() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return;
    }
    
    // Log final stats before cleanup (without calling getCombinedStats to avoid deadlock)
    // Skip logging to avoid deadlock
    
    cpu_allocator_.reset();
    npu_allocator_.reset();
    
    initialized_ = false;
}

MemoryResult MemoryManager::allocateCPU(size_t size, void** ptr, size_t alignment) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_ || !cpu_allocator_) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    return cpu_allocator_->allocate(size, ptr, alignment);
}

MemoryResult MemoryManager::allocateNPU(size_t size, void** ptr, size_t alignment) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_ || !npu_allocator_) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    return npu_allocator_->allocate(size, ptr, alignment);
}

MemoryResult MemoryManager::deallocate(void* ptr) {
    if (!ptr) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return MemoryResult::ERROR_INVALID_POINTER;
    }
    
    // Try CPU allocator first
    if (cpu_allocator_ && cpu_allocator_->isValidPointer(ptr)) {
        return cpu_allocator_->deallocate(ptr);
    }
    
    // Try NPU allocator
    if (npu_allocator_ && npu_allocator_->isValidPointer(ptr)) {
        return npu_allocator_->deallocate(ptr);
    }
    
    return MemoryResult::ERROR_INVALID_POINTER;
}

MemoryStats MemoryManager::getCombinedStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    MemoryStats combined = {};
    
    if (cpu_allocator_) {
        auto cpu_stats = cpu_allocator_->getStats();
        combined.total_allocated += cpu_stats.total_allocated;
        combined.active_allocations += cpu_stats.active_allocations;
        combined.peak_usage += cpu_stats.peak_usage;
        combined.cpu_memory_used = cpu_stats.cpu_memory_used;
    }
    
    if (npu_allocator_) {
        auto npu_stats = npu_allocator_->getStats();
        combined.total_allocated += npu_stats.total_allocated;
        combined.active_allocations += npu_stats.active_allocations;
        combined.peak_usage += npu_stats.peak_usage;
        combined.npu_memory_used = npu_stats.npu_memory_used;
    }
    
    // Calculate overall fragmentation
    if (combined.active_allocations > 0) {
        combined.fragmentation_ratio = std::min(100UL,
            (combined.active_allocations * 50) / std::max(1UL, combined.total_allocated / 1024));
    }
    
    return combined;
}

MemoryStats MemoryManager::getCPUStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return cpu_allocator_ ? cpu_allocator_->getStats() : MemoryStats{};
}

MemoryStats MemoryManager::getNPUStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return npu_allocator_ ? npu_allocator_->getStats() : MemoryStats{};
}

bool MemoryManager::isNPUAvailable() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return npu_allocator_ && npu_allocator_->isNPUAvailable();
}

MemoryResult MemoryManager::optimizeMemory() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return MemoryResult::ERROR_OUT_OF_MEMORY;
    }
    
    // Trigger defragmentation on CPU allocator
    if (cpu_allocator_) {
        cpu_allocator_->defragment();
    }
    
    std::cout << "[MemoryManager] Memory optimization completed" << std::endl;
    return MemoryResult::SUCCESS;
}

void MemoryManager::logMemoryUsage() const {
    auto stats = getCombinedStats();
    
    std::cout << "[MemoryManager] Memory Usage Report:" << std::endl;
    std::cout << "  Total allocated: " << (stats.total_allocated / 1024) << " KB" << std::endl;
    std::cout << "  Peak usage: " << (stats.peak_usage / 1024) << " KB" << std::endl;
    std::cout << "  Active allocations: " << stats.active_allocations << std::endl;
    std::cout << "  CPU memory: " << (stats.cpu_memory_used / 1024) << " KB" << std::endl;
    std::cout << "  NPU memory: " << (stats.npu_memory_used / 1024) << " KB" << std::endl;
    std::cout << "  Fragmentation: " << stats.fragmentation_ratio << "%" << std::endl;
}

std::string MemoryManager::getErrorMessage(MemoryResult result) {
    switch (result) {
        case MemoryResult::SUCCESS:
            return "Success";
        case MemoryResult::ERROR_OUT_OF_MEMORY:
            return "Out of memory";
        case MemoryResult::ERROR_INVALID_SIZE:
            return "Invalid size";
        case MemoryResult::ERROR_INVALID_POINTER:
            return "Invalid pointer";
        case MemoryResult::ERROR_FRAGMENTATION:
            return "Memory fragmentation";
        case MemoryResult::ERROR_ALIGNMENT:
            return "Alignment error";
        default:
            return "Unknown error";
    }
}

} // namespace memory
} // namespace rkllmjs
