#include <gtest/gtest.h>
#include "type-converters-simple.hpp"

namespace rkllmjs {
namespace utils {
namespace test {

class TypeConvertersSimpleTest : public ::testing::Test {
protected:
    void SetUp() override {}
    void TearDown() override {}
};

// String utility tests
TEST_F(TypeConvertersSimpleTest, TrimBasic) {
    EXPECT_EQ(trim("  hello  "), "hello");
    EXPECT_EQ(trim("hello"), "hello");
    EXPECT_EQ(trim("   "), "");
    EXPECT_EQ(trim(""), "");
}

TEST_F(TypeConvertersSimpleTest, SplitBasic) {
    auto result = split("a,b,c", ",");
    EXPECT_EQ(result.size(), 3);
    EXPECT_EQ(result[0], "a");
    EXPECT_EQ(result[1], "b");
    EXPECT_EQ(result[2], "c");
}

TEST_F(TypeConvertersSimpleTest, JoinBasic) {
    std::vector<std::string> vec = {"a", "b", "c"};
    EXPECT_EQ(join(vec, ","), "a,b,c");
    EXPECT_EQ(join({}, ","), "");
}

TEST_F(TypeConvertersSimpleTest, ValidationBasic) {
    EXPECT_TRUE(isValidString("hello"));
    EXPECT_FALSE(isValidString(""));
    
    EXPECT_TRUE(isValidNumber("123"));
    EXPECT_TRUE(isValidNumber("123.45"));
    EXPECT_TRUE(isValidNumber("-123"));
    EXPECT_FALSE(isValidNumber("abc"));
    EXPECT_FALSE(isValidNumber(""));
}

TEST_F(TypeConvertersSimpleTest, ToString) {
    EXPECT_EQ(toString(123), "123");
    EXPECT_EQ(toString(123.45), "123.450000");
    EXPECT_EQ(toString(std::string("hello")), "hello");
}

TEST_F(TypeConvertersSimpleTest, FromString) {
    EXPECT_EQ(fromString<int>("123"), 123);
    EXPECT_EQ(fromString<double>("123.45"), 123.45);
    EXPECT_EQ(fromString<std::string>("hello"), "hello");
}

} // namespace test
} // namespace utils
} // namespace rkllmjs

// Test runner
int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
