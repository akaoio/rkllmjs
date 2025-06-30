#include "type-converters-simple.hpp"
#include <algorithm>
#include <sstream>
#include <cctype>

namespace rkllmjs {
namespace utils {

std::string trim(const std::string& str) {
    size_t start = str.find_first_not_of(" \t\n\r\f\v");
    if (start == std::string::npos) {
        return "";
    }
    
    size_t end = str.find_last_not_of(" \t\n\r\f\v");
    return str.substr(start, end - start + 1);
}

std::vector<std::string> split(const std::string& str, const std::string& delimiter) {
    std::vector<std::string> tokens;
    size_t start = 0;
    size_t end = str.find(delimiter);
    
    while (end != std::string::npos) {
        tokens.push_back(str.substr(start, end - start));
        start = end + delimiter.length();
        end = str.find(delimiter, start);
    }
    
    tokens.push_back(str.substr(start));
    return tokens;
}

std::string join(const std::vector<std::string>& strings, const std::string& delimiter) {
    if (strings.empty()) {
        return "";
    }
    
    std::ostringstream oss;
    oss << strings[0];
    
    for (size_t i = 1; i < strings.size(); ++i) {
        oss << delimiter << strings[i];
    }
    
    return oss.str();
}

bool isValidString(const std::string& str) {
    return !str.empty() && str.find('\0') == std::string::npos;
}

bool isValidNumber(const std::string& str) {
    if (str.empty()) {
        return false;
    }
    
    bool hasDigit = false;
    bool hasDecimal = false;
    size_t start = 0;
    
    // Check for sign
    if (str[0] == '+' || str[0] == '-') {
        start = 1;
    }
    
    for (size_t i = start; i < str.length(); ++i) {
        char c = str[i];
        
        if (std::isdigit(c)) {
            hasDigit = true;
        } else if (c == '.' && !hasDecimal) {
            hasDecimal = true;
        } else {
            return false;
        }
    }
    
    return hasDigit;
}

} // namespace utils
} // namespace rkllmjs
