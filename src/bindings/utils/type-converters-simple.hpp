#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <stdexcept>
#include <functional>

namespace rkllmjs {
namespace utils {

/**
 * @brief Type conversion utilities for C++ interoperability
 * 
 * This module provides safe, efficient conversion functions between
 * different C++ types and validation utilities.
 * 
 * NOTE: This is a simplified version without N-API dependencies for standalone compilation.
 * The full N-API version is available when building with Node.js headers.
 */

/**
 * String utilities
 */
std::string trim(const std::string& str);
std::vector<std::string> split(const std::string& str, char delimiter);
std::string join(const std::vector<std::string>& strings, const std::string& separator);
bool startsWith(const std::string& str, const std::string& prefix);
bool endsWith(const std::string& str, const std::string& suffix);

/**
 * Number conversion utilities
 */
int32_t stringToInt32(const std::string& str);
double stringToDouble(const std::string& str);
std::string int32ToString(int32_t value);
std::string doubleToString(double value);

/**
 * Array/Vector utilities (implementation provided inline due to template nature)
 */
template<typename T>
std::vector<T> filterVector(const std::vector<T>& input, std::function<bool(const T&)> predicate) {
    std::vector<T> result;
    for (const auto& item : input) {
        if (predicate(item)) {
            result.push_back(item);
        }
    }
    return result;
}

template<typename T, typename U>
std::vector<U> mapVector(const std::vector<T>& input, std::function<U(const T&)> mapper) {
    std::vector<U> result;
    result.reserve(input.size());
    for (const auto& item : input) {
        result.push_back(mapper(item));
    }
    return result;
}

/**
 * Map utilities
 */
std::unordered_map<std::string, std::string> parseKeyValuePairs(const std::string& input, 
                                                                 char pairSeparator = ',',
                                                                 char keyValueSeparator = '=');

std::string mapToString(const std::unordered_map<std::string, std::string>& map,
                       const std::string& pairSeparator = ",",
                       const std::string& keyValueSeparator = "=");

/**
 * Validation utilities
 */
bool isValidString(const std::string& str);
bool isValidNumber(const std::string& str);
bool isValidPath(const std::string& path);
bool isValidRange(double value, double min, double max);

/**
 * Buffer/Binary utilities
 */
std::vector<uint8_t> stringToBytes(const std::string& str);
std::string bytesToString(const std::vector<uint8_t>& bytes);
std::string bytesToHex(const std::vector<uint8_t>& bytes);
std::vector<uint8_t> hexToBytes(const std::string& hex);

/**
 * Error-safe conversion functions
 */
class ConversionResult {
public:
    ConversionResult(bool success, const std::string& error = "") 
        : success_(success), error_(error) {}
    
    bool isSuccess() const { return success_; }
    const std::string& getError() const { return error_; }
    
private:
    bool success_;
    std::string error_;
};

ConversionResult safeStringToInt32(const std::string& str, int32_t& result);
ConversionResult safeStringToDouble(const std::string& str, double& result);

} // namespace utils
} // namespace rkllmjs