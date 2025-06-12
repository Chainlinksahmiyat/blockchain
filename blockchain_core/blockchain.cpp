// Ahmiyat Blockchain - Core Implementation
// Written from scratch in C++

#include "blockchain.h"
#include <sstream>
#include <iostream>
#include <openssl/sha.h>
#include <fstream>
#include <iomanip>
#include <random>

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

bool Blockchain::addTransaction(const Transaction& tx) {
    // For demo: skip signature verification
    mempool.push_back(tx);
    return true;
}

bool Blockchain::addContent(const Content& content, const std::string& miner) {
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
    std::ofstream out(filename);
    if (!out) return false;
    for (const auto& block : chain) {
        out << block.index << ' ' << block.prevHash << ' ' << block.hash << ' ' << block.timestamp << ' ' << block.miner << ' ' << block.nonce << ' ' << block.difficulty << '\n';
        for (const auto& tx : block.transactions) {
            out << "TX " << tx.sender << ' ' << tx.receiver << ' ' << tx.amount << ' ' << tx.signature << '\n';
        }
        for (const auto& c : block.contents) {
            out << "CT " << c.type << ' ' << c.filename << ' ' << c.uploader << ' ' << c.hash << ' ' << c.timestamp << '\n';
        }
    }
    return true;
}

bool Blockchain::loadFromFile(const std::string& filename) {
    std::ifstream in(filename);
    if (!in) return false;
    chain.clear();
    std::string line;
    Block block;
    while (std::getline(in, line)) {
        if (line.substr(0, 2) == "TX") {
            std::istringstream iss(line.substr(3));
            Transaction tx;
            iss >> tx.sender >> tx.receiver >> tx.amount >> tx.signature;
            block.transactions.push_back(tx);
        } else if (line.substr(0, 2) == "CT") {
            std::istringstream iss(line.substr(3));
            Content c;
            iss >> c.type >> c.filename >> c.uploader >> c.hash >> c.timestamp;
            block.contents.push_back(c);
        } else {
            if (block.index != 0 || !block.hash.empty()) chain.push_back(block);
            block = Block();
            std::istringstream iss(line);
            iss >> block.index >> block.prevHash >> block.hash >> block.timestamp >> block.miner >> block.nonce >> block.difficulty;
        }
    }
    if (block.index != 0 || !block.hash.empty()) chain.push_back(block);
    return true;
}

Wallet::Wallet() {
    // Simple random address and private key (for demo)
    address = generateAddress();
    privateKey = generateAddress();
}

std::string Wallet::generateAddress() {
    static const char alphanum[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    std::string addr;
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, sizeof(alphanum) - 2);
    for (int i = 0; i < 32; ++i) addr += alphanum[dis(gen)];
    return addr;
}

std::string Wallet::sign(const std::string& data, const std::string& privKey) {
    // For demo: just return hash(data+privKey)
    std::string input = data + privKey;
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)input.c_str(), input.size(), hash);
    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    return ss.str();
}

bool Wallet::verify(const std::string& data, const std::string& signature, const std::string& address) {
    // For demo: just check if signature == sign(data, address)
    return sign(data, address) == signature;
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
