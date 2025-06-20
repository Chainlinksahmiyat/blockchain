// Ahmiyat Blockchain - Core Implementation
// Written from scratch in C++

#include "blockchain.h"
#include "ecdsa_utils.h"
#include "storage.h"
#include "sqlite3.h"
#include <sstream>
#include <iostream>
#include <openssl/sha.h>
#include <fstream>
#include <iomanip>
#include <random>
#include <ctime>

Blockchain::Blockchain() {
    if (sqlite3_open("ahmiyat.db", &db) != SQLITE_OK) {
        std::cerr << "Failed to open database: " << sqlite3_errmsg(db) << std::endl;
        db = nullptr;
    } else {
        // Ensure blocks table exists
        const char* createTableSQL = "CREATE TABLE IF NOT EXISTS blocks (id INTEGER PRIMARY KEY, data TEXT);";
        char* errMsg = nullptr;
        if (sqlite3_exec(db, createTableSQL, nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "Failed to create blocks table: " << errMsg << std::endl;
            sqlite3_free(errMsg);
        }
    }
    createGenesisBlock();
}

Blockchain::~Blockchain() {
    if (db) sqlite3_close(db);
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

bool Blockchain::validProof(const Block& block) const {
    // Check if hash meets difficulty requirement
    return block.hash.substr(0, block.difficulty) == std::string(block.difficulty, '0');
}

void Blockchain::adjustDifficulty() {
    int n = adjustmentInterval;
    if (chain.size() <= n) return;
    const Block& last = chain.back();
    const Block& prev = chain[chain.size() - n - 1];
    int actualTime = static_cast<int>(last.timestamp - prev.timestamp);
    int expectedTime = n * targetBlockTime;
    if (actualTime < expectedTime / 2) {
        difficulty++;
    } else if (actualTime > expectedTime * 2 && difficulty > 1) {
        difficulty--;
    }
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
    // Improved Proof-of-Work: use validProof for clarity
    do {
        newBlock.nonce++;
        newBlock.hash = calculateHash(newBlock);
    } while (!validProof(newBlock));
    // Validate before adding
    if (!validateBlock(newBlock, chain.back())) {
        logError("Invalid block mined, not adding to chain.");
        return false;
    }
    chain.push_back(newBlock);
    adjustDifficulty();
    // Update balances
    double reward = 1.0 / std::max(1, difficulty);
    if (reward < 0.0001) reward = 0.0001;
    for (const auto& tx : mempool) {
        balances[tx.sender] -= tx.amount;
        balances[tx.receiver] += tx.amount;
    }
    balances[miner] += reward; // mining reward based on difficulty
    mempool.clear();
    pendingContents.clear();
    return true;
}

bool Blockchain::validateBlock(const Block& newBlock, const Block& prevBlock) const {
    if (newBlock.prevHash != prevBlock.hash) return false;
    if (newBlock.hash != calculateHash(newBlock)) return false;
    if (!validProof(newBlock)) return false;
    if (newBlock.timestamp < prevBlock.timestamp) return false;
    // Optionally: validate all transactions and contents
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

bool Blockchain::saveToDb() {
    if (!db) return false;
    // Example: Save all blocks to a table 'blocks' (id, data as JSON/text)
    char* errMsg = nullptr;
    // Clear table first (for demo)
    sqlite3_exec(db, "DELETE FROM blocks;", nullptr, nullptr, &errMsg);
    for (const auto& block : chain) {
        std::stringstream ss;
        ss << block.index << '|' << block.prevHash << '|' << block.hash << '|' << block.timestamp << '|' << block.miner << '|' << block.nonce << '|' << block.difficulty;
        std::string sql = "INSERT INTO blocks (id, data) VALUES (" + std::to_string(block.index) + ", '" + ss.str() + "');";
        if (sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "DB insert error: " << errMsg << std::endl;
            sqlite3_free(errMsg);
            return false;
        }
    }
    return true;
}

bool Blockchain::loadFromDb() {
    if (!db) return false;
    chain.clear();
    const char* sql = "SELECT data FROM blocks ORDER BY id ASC;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        std::cerr << "DB select error: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        const unsigned char* data = sqlite3_column_text(stmt, 0);
        if (data) {
            std::istringstream iss(reinterpret_cast<const char*>(data));
            Block block;
            char sep;
            iss >> block.index >> sep >> block.prevHash >> sep >> block.hash >> sep >> block.timestamp >> sep >> block.miner >> sep >> block.nonce >> sep >> block.difficulty;
            chain.push_back(block);
        }
    }
    sqlite3_finalize(stmt);
    return true;
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

// --- Peer-to-Peer Networking Stubs ---
void Blockchain::connectToPeer(const std::string& peerAddress) {
    // TODO: Implement peer connection logic (e.g., sockets, HTTP, etc.)
    std::cout << "Connecting to peer: " << peerAddress << std::endl;
}

void Blockchain::broadcastBlock(const Block& block) {
    // TODO: Implement block broadcasting to peers
    std::cout << "Broadcasting block: " << block.index << std::endl;
}

void Blockchain::receiveBlock(const Block& block) {
    // TODO: Implement block receiving and validation from peers
    std::cout << "Received block: " << block.index << std::endl;
    // Example: validate and add to chain if valid
    if (validateBlock(block, chain.back())) {
        chain.push_back(block);
        adjustDifficulty();
    } else {
        logError("Received invalid block from peer.");
    }
}
