#include "ecdsa_utils.h"
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/buffer.h>
#include <vector>
#include <sstream>
#include <iomanip>

bool ECDSAUtils::generateKeyPair(std::string& outPrivateKeyPem, std::string& outPublicKeyPem) {
    EC_KEY* ecKey = EC_KEY_new_by_curve_name(NID_secp256k1);
    if (!ecKey) return false;
    if (!EC_KEY_generate_key(ecKey)) {
        EC_KEY_free(ecKey);
        return false;
    }
    BIO* priv = BIO_new(BIO_s_mem());
    PEM_write_bio_ECPrivateKey(priv, ecKey, nullptr, nullptr, 0, nullptr, nullptr);
    BUF_MEM* privBuf;
    BIO_get_mem_ptr(priv, &privBuf);
    outPrivateKeyPem.assign(privBuf->data, privBuf->length);
    BIO_free(priv);
    BIO* pub = BIO_new(BIO_s_mem());
    PEM_write_bio_EC_PUBKEY(pub, ecKey);
    BUF_MEM* pubBuf;
    BIO_get_mem_ptr(pub, &pubBuf);
    outPublicKeyPem.assign(pubBuf->data, pubBuf->length);
    BIO_free(pub);
    EC_KEY_free(ecKey);
    return true;
}

std::string ECDSAUtils::sign(const std::string& data, const std::string& privKeyPem) {
    BIO* bio = BIO_new_mem_buf(privKeyPem.data(), privKeyPem.size());
    EC_KEY* ecKey = PEM_read_bio_ECPrivateKey(bio, nullptr, nullptr, nullptr);
    BIO_free(bio);
    if (!ecKey) return "";
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char*)data.data(), data.size(), hash);
    unsigned int sigLen = ECDSA_size(ecKey);
    std::vector<unsigned char> sig(sigLen);
    if (!ECDSA_sign(0, hash, SHA256_DIGEST_LENGTH, sig.data(), &sigLen, ecKey)) {
        EC_KEY_free(ecKey);
        return "";
    }
    EC_KEY_free(ecKey);
    // Encode signature as hex
    std::stringstream ss;
    for (unsigned int i = 0; i < sigLen; ++i) ss << std::hex << std::setw(2) << std::setfill('0') << (int)sig[i];
    return ss.str();
}

bool ECDSAUtils::verify(const std::string& data, const std::string& signature, const std::string& pubKeyPem) {
    BIO* bio = BIO_new_mem_buf(pubKeyPem.data(), pubKeyPem.size());
    EC_KEY* ecKey = PEM_read_bio_EC_PUBKEY(bio, nullptr, nullptr, nullptr);
    BIO_free(bio);
    if (!ecKey) return false;
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char*)data.data(), data.size(), hash);
    // Decode hex signature
    std::vector<unsigned char> sig(signature.size() / 2);
    for (size_t i = 0; i < sig.size(); ++i) {
        std::string byteStr = signature.substr(i * 2, 2);
        sig[i] = (unsigned char)strtol(byteStr.c_str(), nullptr, 16);
    }
    int ret = ECDSA_verify(0, hash, SHA256_DIGEST_LENGTH, sig.data(), sig.size(), ecKey);
    EC_KEY_free(ecKey);
    return ret == 1;
}
