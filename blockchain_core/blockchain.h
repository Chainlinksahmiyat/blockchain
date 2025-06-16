// Unique Blockchain Core - Ahmiyat Blockchain
// Written from scratch in C++
// Mining by uploading content (images, memes, videos, memories)
// Native coin: Ahmiyat Coin
// No code copied from any blockchain

#ifndef BLOCKCHAIN_H
#define BLOCKCHAIN_H

#include <string>
#include <vector>
#include <map>
#include <ctime>
#include <openssl/sha.h>
#include <fstream>
#include <iomanip>
#include <random>
#include "ecdsa_utils.h"

struct Transaction {
    std::string sender; // address (hash of public key)
    std::string receiver;
    double amount;
    std::string signature;
    std::string publicKeyPem; // sender's public key in PEM
};

struct Content {
    std::string type; // image, meme, video, memory
    std::string filename;
    std::string uploader; // address (hash of public key)
    std::string hash;
    std::time_t timestamp;
    std::string publicKeyPem; // uploader's public key in PEM
};

struct Block {
    int index;
    std::vector<Transaction> transactions;
    std::vector<Content> contents;
    std::string prevHash;
    std::string hash;
    std::time_t timestamp;
    std::string miner;
    int nonce;
    int difficulty;
};

class Wallet {
public:
    std::string address;
    std::string privateKeyPem;
    std::string publicKeyPem;
    Wallet();
    static bool generateKeyPair(std::string& privPem, std::string& pubPem);
    static std::string sign(const std::string& data, const std::string& privKeyPem);
    static bool verify(const std::string& data, const std::string& signature, const std::string& pubKeyPem);
};

class Blockchain {
public:
    Blockchain();
    bool addTransaction(const Transaction& tx);
    bool addContent(const Content& content, const std::string& miner);
    bool mineBlock(const std::string& miner);
    std::vector<Block> getChain() const;
    std::map<std::string, double> getBalances() const;
    bool isValidChain() const;
    bool saveToFile(const std::string& filename) const;
    bool loadFromFile(const std::string& filename);
    std::vector<Transaction> getMempool() const;
private:
    std::vector<Block> chain;
    std::vector<Transaction> mempool;
    std::vector<Content> pendingContents;
    std::map<std::string, double> balances;
    int difficulty = 3;
    std::string calculateHash(const Block& block) const;
    void createGenesisBlock();
    bool validProof(const Block& block) const;
};

#endif // BLOCKCHAIN_H
