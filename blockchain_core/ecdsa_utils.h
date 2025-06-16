#ifndef ECDSA_UTILS_H
#define ECDSA_UTILS_H

#include <string>
#include <openssl/ec.h>
#include <openssl/ecdsa.h>
#include <openssl/obj_mac.h>
#include <openssl/pem.h>
#include <openssl/sha.h>

class ECDSAUtils {
public:
    // Generate a new ECDSA key pair and return PEM strings
    static bool generateKeyPair(std::string& outPrivateKeyPem, std::string& outPublicKeyPem);
    // Sign data with a PEM private key
    static std::string sign(const std::string& data, const std::string& privKeyPem);
    // Verify signature with a PEM public key
    static bool verify(const std::string& data, const std::string& signature, const std::string& pubKeyPem);
};

#endif // ECDSA_UTILS_H
