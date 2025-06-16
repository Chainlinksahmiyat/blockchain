// Ahmiyat Blockchain - Core Implementation
// Written from scratch in C++

#include "blockchain.h"
#include "ecdsa_utils.h"
#include "storage.h"
#include <sstream>
#include <iostream>
#include <openssl/sha.h>
#include <fstream>
#include <iomanip>
#include <random>
#include <ctime>

Blockchain::Blockchain() {
    createGenesisBlock();
}

void Blockchain::createGenesisBlock() {
    Block genesis;
    genesis.index = 0;
    genesis.prevHash = "0";
    genesis.timestamp = std::time(nullptr);
    genesis.hash = calculateHash(genesis);
    genesis.miner = "genesis";
    chain.push_back(genesis);
}

std::string Blockchain::calculateHash(const Block& block) const {
    std::stringstream ss;
    ss << block.index << block.prevHash << block.timestamp << block.miner << block.nonce << block.difficulty;
    for (const auto& tx : block.transactions) {
        ss << tx.sender << tx.receiver << tx.amount << tx.signature;
    }
    for (const auto& c : block.contents) {
        ss << c.type << c.filename << c.uploader << c.hash << c.timestamp;
    }
    unsigned char hash[SHA256_DIGEST_LENGTH];
    std::string input = ss.str();
    SHA256((unsigned char*)input.c_str(), input.size(), hash);
    std::stringstream out;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) out << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    return out.str();
}

void Blockchain::logError(const std::string& message) {
    std::ofstream log("blockchain_error.log", std::ios::app);
    std::time_t now = std::time(nullptr);
    log << std::put_time(std::localtime(&now), "%Y-%m-%d %H:%M:%S") << " [ERROR] " << message << std::endl;
}

bool Blockchain::addTransaction(const Transaction& tx) {
    // Enforce signature verification using public key
    std::string expectedAddress;
    {
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256((const unsigned char*)tx.publicKeyPem.data(), tx.publicKeyPem.size(), hash);
        std::stringstream ss;
        for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
        expectedAddress = ss.str();
    }
    if (tx.sender != expectedAddress) {
        logError("Transaction sender address does not match public key.");
        return false;
    }
    if (!Wallet::verify(tx.sender + tx.receiver + std::to_string(tx.amount), tx.signature, tx.publicKeyPem)) {
        logError("Invalid transaction signature for sender: " + tx.sender);
        return false;
    }
    mempool.push_back(tx);
    return true;
}

bool Blockchain::addContent(const Content& content, const std::string& miner) {
    // Optionally, verify content signature if you add one
    pendingContents.push_back(content);
    return true;
}

bool Blockchain::mineBlock(const std::string& miner) {
    if (mempool.empty() && pendingContents.empty()) return false;
    Block newBlock;
    newBlock.index = chain.size();
    newBlock.prevHash = chain.back().hash;
    newBlock.timestamp = std::time(nullptr);
    newBlock.transactions = mempool;
    newBlock.contents = pendingContents;
    newBlock.miner = miner;
    newBlock.difficulty = difficulty;
    newBlock.nonce = 0;
    // Proof-of-Work
    do {
        newBlock.nonce++;
        newBlock.hash = calculateHash(newBlock);
    } while (newBlock.hash.substr(0, difficulty) != std::string(difficulty, '0'));
    chain.push_back(newBlock);
    // Update balances
    for (const auto& tx : mempool) {
        balances[tx.sender] -= tx.amount;
        balances[tx.receiver] += tx.amount;
    }
    balances[miner] += 1.0; // mining reward
    mempool.clear();
    pendingContents.clear();
    return true;
}

bool Blockchain::isValidChain() const {
    for (size_t i = 1; i < chain.size(); ++i) {
        const Block& prev = chain[i-1];
        const Block& curr = chain[i];
        if (curr.prevHash != prev.hash) return false;
        if (curr.hash != calculateHash(curr)) return false;
        if (curr.hash.substr(0, curr.difficulty) != std::string(curr.difficulty, '0')) return false;
    }
    return true;
}

bool Blockchain::saveToFile(const std::string& filename) const {
    return fileStorage.saveChain(chain, filename);
}

bool Blockchain::loadFromFile(const std::string& filename) {
    return fileStorage.loadChain(chain, filename);
}

Wallet::Wallet() {
    // Generate ECDSA key pair
    generateKeyPair(privateKeyPem, publicKeyPem);
    // Use hash of public key as address
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char*)publicKeyPem.data(), publicKeyPem.size(), hash);
    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    address = ss.str();
}

bool Wallet::generateKeyPair(std::string& privPem, std::string& pubPem) {
    return ECDSAUtils::generateKeyPair(privPem, pubPem);
}

std::string Wallet::sign(const std::string& data, const std::string& privKeyPem) {
    return ECDSAUtils::sign(data, privKeyPem);
}

bool Wallet::verify(const std::string& data, const std::string& signature, const std::string& pubKeyPem) {
    return ECDSAUtils::verify(data, signature, pubKeyPem);
}

std::vector<Block> Blockchain::getChain() const {
    return chain;
}

std::map<std::string, double> Blockchain::getBalances() const {
    return balances;
}

std::vector<Transaction> Blockchain::getMempool() const {
    return mempool;
}
