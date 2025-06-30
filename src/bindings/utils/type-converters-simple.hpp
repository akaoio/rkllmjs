#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace rkllmjs {
namespace utils {

/**
 * @brief Basic type conversion utilities without N-API dependencies
 * 
 * This is a simplified version for initial testing and building.
 * Full N-API integration will be added later.
 */

// Basic string utilities
std::string trim(const std::string& str);
std::vector<std::string> split(const std::string& str, const std::string& delimiter);
std::string join(const std::vector<std::string>& strings, const std::string& delimiter);

// Validation utilities
bool isValidString(const std::string& str);
bool isValidNumber(const std::string& str);

// Template utilities for basic conversions
template<typename T>
std::string toString(const T& value);

template<typename T>
T fromString(const std::string& str);

// Template implementations
template<typename T>
std::string toString(const T& value) {
    return std::to_string(value);
}

template<>
inline std::string toString<std::string>(const std::string& value) {
    return value;
}

template<typename T>
T fromString(const std::string& str);

template<>
inline int fromString<int>(const std::string& str) {
    return std::stoi(str);
}

template<>
inline double fromString<double>(const std::string& str) {
    return std::stod(str);
}

template<>
inline std::string fromString<std::string>(const std::string& str) {
    return str;
}

} // namespace utils
} // namespace rkllmjs
