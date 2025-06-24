#include "base58.h"
#include <openssl/sha.h>
#include <vector>
#include <string>
#include <cstdint>

static const char* BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

std::string Base58::encode(const std::vector<uint8_t>& input) {
    std::vector<uint8_t> digits(1, 0);
    for (uint8_t byte : input) {
        int carry = byte;
        for (size_t j = 0; j < digits.size(); ++j) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry /= 58;
        }
        while (carry) {
            digits.push_back(carry % 58);
            carry /= 58;
        }
    }
    std::string result;
    for (uint8_t byte : input) {
        if (byte == 0) result += '1';
        else break;
    }
    for (auto it = digits.rbegin(); it != digits.rend(); ++it) {
        result += BASE58_ALPHABET[*it];
    }
    return result;
}

std::string Base58::encodeWithChecksum(const std::vector<uint8_t>& input) {
    std::vector<uint8_t> data = input;
    uint8_t hash1[SHA256_DIGEST_LENGTH];
    SHA256(data.data(), data.size(), hash1);
    uint8_t hash2[SHA256_DIGEST_LENGTH];
    SHA256(hash1, SHA256_DIGEST_LENGTH, hash2);
    data.insert(data.end(), hash2, hash2 + 4); // append first 4 bytes as checksum
    return encode(data);
}

std::vector<uint8_t> Base58::decode(const std::string& input) {
    std::vector<uint8_t> result;
    // (Decoding not needed for address generation, can be implemented if needed)
    return result;
}
