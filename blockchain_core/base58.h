#ifndef BASE58_H
#define BASE58_H

#include <string>
#include <vector>
#include <cstdint>

class Base58 {
public:
    static std::string encode(const std::vector<uint8_t>& input);
    static std::string encodeWithChecksum(const std::vector<uint8_t>& input);
    static std::vector<uint8_t> decode(const std::string& input);
};

#endif // BASE58_H
