#include "json-parser.hpp"
#include <sstream>
#include <cctype>

namespace rkllmjs {
namespace config {

// Static member definition
JsonValue JsonValue::null_value_;

JsonValue& JsonValue::operator[](const std::string& key) {
    if (type_ != OBJECT) {
        setObject();
    }
    return obj_value_[key];
}

const JsonValue& JsonValue::operator[](const std::string& key) const {
    if (type_ != OBJECT) {
        return null_value_;
    }
    auto it = obj_value_.find(key);
    if (it == obj_value_.end()) {
        return null_value_;
    }
    return it->second;
}

bool JsonValue::hasKey(const std::string& key) const {
    if (type_ != OBJECT) {
        return false;
    }
    return obj_value_.find(key) != obj_value_.end();
}

void JsonValue::set(const std::string& key, const JsonValue& value) {
    if (type_ != OBJECT) {
        setObject();
    }
    obj_value_[key] = value;
}

JsonValue JsonParser::parse(const std::string& json) {
    size_t pos = 0;
    skipWhitespace(json, pos);
    return parseValue(json, pos);
}

JsonValue JsonParser::parseValue(const std::string& json, size_t& pos) {
    skipWhitespace(json, pos);
    
    if (pos >= json.length()) {
        return JsonValue(); // null
    }
    
    char ch = json[pos];
    
    if (ch == '{') {
        return parseObject(json, pos);
    } else if (ch == '"') {
        return parseString(json, pos);
    } else if (ch == 't' && json.substr(pos, 4) == "true") {
        pos += 4;
        return JsonValue(true);
    } else if (ch == 'f' && json.substr(pos, 5) == "false") {
        pos += 5;
        return JsonValue(false);
    } else if (ch == 'n' && json.substr(pos, 4) == "null") {
        pos += 4;
        return JsonValue(); // null
    } else if (std::isdigit(ch) || ch == '-') {
        return parseNumber(json, pos);
    }
    
    return JsonValue(); // null
}

JsonValue JsonParser::parseObject(const std::string& json, size_t& pos) {
    JsonValue obj;
    obj.setObject();
    
    pos++; // skip '{'
    skipWhitespace(json, pos);
    
    if (pos < json.length() && json[pos] == '}') {
        pos++; // skip '}'
        return obj;
    }
    
    while (pos < json.length()) {
        skipWhitespace(json, pos);
        
        // Parse key
        if (json[pos] != '"') break;
        JsonValue key = parseString(json, pos);
        
        skipWhitespace(json, pos);
        
        // Skip ':'
        if (pos >= json.length() || json[pos] != ':') break;
        pos++;
        
        skipWhitespace(json, pos);
        
        // Parse value
        JsonValue value = parseValue(json, pos);
        obj.set(key.asString(), value);
        
        skipWhitespace(json, pos);
        
        if (pos >= json.length()) break;
        
        if (json[pos] == '}') {
            pos++; // skip '}'
            break;
        } else if (json[pos] == ',') {
            pos++; // skip ','
        } else {
            break;
        }
    }
    
    return obj;
}

JsonValue JsonParser::parseString(const std::string& json, size_t& pos) {
    std::string result;
    pos++; // skip opening '"'
    
    while (pos < json.length()) {
        char ch = json[pos];
        if (ch == '"') {
            pos++; // skip closing '"'
            break;
        } else if (ch == '\\' && pos + 1 < json.length()) {
            pos++;
            char escaped = json[pos];
            switch (escaped) {
                case 'n': result += '\n'; break;
                case 't': result += '\t'; break;
                case 'r': result += '\r'; break;
                case '\\': result += '\\'; break;
                case '"': result += '"'; break;
                default: result += escaped; break;
            }
        } else {
            result += ch;
        }
        pos++;
    }
    
    return JsonValue(result);
}

JsonValue JsonParser::parseNumber(const std::string& json, size_t& pos) {
    std::string numStr;
    
    while (pos < json.length()) {
        char ch = json[pos];
        if (std::isdigit(ch) || ch == '.' || ch == '-' || ch == 'e' || ch == 'E' || ch == '+') {
            numStr += ch;
            pos++;
        } else {
            break;
        }
    }
    
    return JsonValue(std::stod(numStr));
}

void JsonParser::skipWhitespace(const std::string& json, size_t& pos) {
    while (pos < json.length() && std::isspace(json[pos])) {
        pos++;
    }
}

std::string JsonParser::stringify(const JsonValue& value) {
    // Simple implementation for basic types
    if (value.isString()) {
        return "\"" + value.asString() + "\"";
    } else if (value.isNumber()) {
        return std::to_string(value.asNumber());
    } else if (value.isBool()) {
        return value.asBool() ? "true" : "false";
    } else if (value.isNull()) {
        return "null";
    }
    return "null";
}

} // namespace config
} // namespace rkllmjs
