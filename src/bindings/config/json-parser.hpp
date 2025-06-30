#pragma once

#include <string>
#include <map>
#include <vector>

namespace rkllmjs {
namespace config {

/**
 * Simple JSON value class
 */
class JsonValue {
public:
    enum Type { STRING, NUMBER, BOOLEAN, OBJECT, ARRAY, NULL_VALUE };
    
    JsonValue() : type_(NULL_VALUE) {}
    JsonValue(const std::string& str) : type_(STRING), str_value_(str) {}
    JsonValue(double num) : type_(NUMBER), num_value_(num) {}
    JsonValue(bool b) : type_(BOOLEAN), bool_value_(b) {}
    
    Type getType() const { return type_; }
    
    std::string asString() const { return str_value_; }
    double asNumber() const { return num_value_; }
    int asInt() const { return static_cast<int>(num_value_); }
    bool asBool() const { return bool_value_; }
    
    bool isNull() const { return type_ == NULL_VALUE; }
    bool isString() const { return type_ == STRING; }
    bool isNumber() const { return type_ == NUMBER; }
    bool isBool() const { return type_ == BOOLEAN; }
    bool isObject() const { return type_ == OBJECT; }
    
    // Object access
    JsonValue& operator[](const std::string& key);
    const JsonValue& operator[](const std::string& key) const;
    bool hasKey(const std::string& key) const;
    
    // Object manipulation
    void setObject() { type_ = OBJECT; }
    void set(const std::string& key, const JsonValue& value);
    
private:
    Type type_;
    std::string str_value_;
    double num_value_ = 0.0;
    bool bool_value_ = false;
    std::map<std::string, JsonValue> obj_value_;
    
    static JsonValue null_value_;
};

/**
 * Simple JSON parser
 */
class JsonParser {
public:
    static JsonValue parse(const std::string& json);
    static std::string stringify(const JsonValue& value);
    
private:
    static JsonValue parseValue(const std::string& json, size_t& pos);
    static JsonValue parseObject(const std::string& json, size_t& pos);
    static JsonValue parseString(const std::string& json, size_t& pos);
    static JsonValue parseNumber(const std::string& json, size_t& pos);
    static void skipWhitespace(const std::string& json, size_t& pos);
};

} // namespace config
} // namespace rkllmjs
