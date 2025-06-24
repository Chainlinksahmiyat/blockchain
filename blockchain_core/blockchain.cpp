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
#include "base58.h"
#include <nlohmann/json.hpp>

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

// --- Production-Readiness & Security Improvements ---

// Log consensus events (mining, staking, delegation, block addition)
void Blockchain::logConsensusEvent(const std::string& event, const std::string& detail) {
    std::ofstream log("blockchain_event.log", std::ios::app);
    std::time_t now = std::time(nullptr);
    log << std::put_time(std::localtime(&now), "%Y-%m-%d %H:%M:%S") << " [CONSENSUS] " << event << ": " << detail << std::endl;
}

// Example: Call in mining/staking/delegation
// logConsensusEvent("PoW mined", miner);
// logConsensusEvent("PoS staked", selectedMiner);
// logConsensusEvent("DPoS delegated", selectedDelegate);
// logConsensusEvent("Block added", std::to_string(newBlock.index));

// --- Security: Wallet encryption/hardware wallet stubs ---
bool Wallet::encryptPrivateKey(const std::string& password) {
    // TODO: Use OpenSSL AES to encrypt privateKeyPem with password
    // For now, stub returns true
    return true;
}
bool Wallet::decryptPrivateKey(const std::string& password) {
    // TODO: Use OpenSSL AES to decrypt privateKeyPem with password
    // For now, stub returns true
    return true;
}
bool Wallet::importFromHardwareWallet() {
    // TODO: Integrate with hardware wallet APIs (Ledger, Trezor, etc.)
    // For now, stub returns false
    return false;
}

// --- Peer Reputation & DDoS Resistance ---
void Blockchain::reportPeerMisbehavior(const std::string& peerAddress) {
    peerReputation[peerAddress]--;
    if (peerReputation[peerAddress] < -3) {
        blockPeer(peerAddress);
        logError("Peer blocked for repeated misbehavior: " + peerAddress);
    }
}
void Blockchain::rewardPeer(const std::string& peerAddress) {
    peerReputation[peerAddress]++;
}

// --- BFT/Fork Resolution Stub ---
bool Blockchain::resolveFork(const std::vector<Block>& candidateChain) {
    // TODO: Implement fork resolution (longest chain, most work, BFT signatures, etc.)
    // For now, stub returns false
    logError("Fork resolution attempted (stub)");
    return false;
}

// --- Monitoring/Observability Hook ---
void Blockchain::emitMetric(const std::string& metric, double value) {
    // TODO: Integrate with Prometheus, Grafana, or custom monitoring
    // For now, just print
    std::cout << "[METRIC] " << metric << ": " << value << std::endl;
}

void Blockchain::setTxFee(double fee) { txFee = fee; }
double Blockchain::getTxFee() const { return txFee; }
void Blockchain::setHalvingInterval(int interval) { halvingInterval = interval; }
int Blockchain::getHalvingInterval() const { return halvingInterval; }
double Blockchain::getBlockReward(int blockIndex) const {
    int halvings = blockIndex / halvingInterval;
    double reward = initialReward;
    for (int i = 0; i < halvings; ++i) reward /= 2.0;
    if (reward < 0.0001) reward = 0.0001;
    return reward;
}

bool Blockchain::addTransaction(const Transaction& tx) {
    // Enforce signature verification using public key
    std::string expectedAddress = Wallet::publicKeyToAddress(tx.publicKeyPem);
    if (tx.sender != expectedAddress) {
        logError("Transaction sender address does not match public key (Base58).");
        return false;
    }
    if (!Wallet::verify(tx.sender + tx.receiver + std::to_string(tx.amount), tx.signature, tx.publicKeyPem)) {
        logError(std::string("Invalid transaction signature for sender: ") + tx.sender);
        return false;
    }
    if (balances[tx.sender] < tx.amount + txFee) {
        logError("Insufficient balance for transaction + fee.");
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
    double reward = getBlockReward(newBlock.index);
    double totalFees = 0;
    for (const auto& tx : mempool) {
        balances[tx.sender] -= (tx.amount + txFee);
        balances[tx.receiver] += tx.amount;
        totalFees += txFee;
    }
    balances[miner] += reward + totalFees;
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
    char* errMsg = nullptr;
    sqlite3_exec(db, "DELETE FROM blocks;", nullptr, nullptr, &errMsg);
    for (const auto& block : chain) {
        nlohmann::json jblock;
        jblock["index"] = block.index;
        jblock["prevHash"] = block.prevHash;
        jblock["hash"] = block.hash;
        jblock["timestamp"] = block.timestamp;
        jblock["miner"] = block.miner;
        jblock["nonce"] = block.nonce;
        jblock["difficulty"] = block.difficulty;
        // Transactions
        for (const auto& tx : block.transactions) {
            nlohmann::json jtx;
            jtx["sender"] = tx.sender;
            jtx["receiver"] = tx.receiver;
            jtx["amount"] = tx.amount;
            jtx["signature"] = tx.signature;
            jtx["publicKeyPem"] = tx.publicKeyPem;
            jblock["transactions"].push_back(jtx);
        }
        // Contents
        for (const auto& c : block.contents) {
            nlohmann::json jc;
            jc["type"] = c.type;
            jc["filename"] = c.filename;
            jc["uploader"] = c.uploader;
            jc["hash"] = c.hash;
            jc["timestamp"] = c.timestamp;
            jc["publicKeyPem"] = c.publicKeyPem;
            jblock["contents"].push_back(jc);
        }
        std::string sql = "INSERT INTO blocks (id, data) VALUES (" + std::to_string(block.index) + ", '" + jblock.dump() + "');";
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
            nlohmann::json jblock = nlohmann::json::parse(reinterpret_cast<const char*>(data));
            Block block;
            block.index = jblock["index"];
            block.prevHash = jblock["prevHash"];
            block.hash = jblock["hash"];
            block.timestamp = jblock["timestamp"];
            block.miner = jblock["miner"];
            block.nonce = jblock["nonce"];
            block.difficulty = jblock["difficulty"];
            // Transactions
            for (const auto& jtx : jblock["transactions"]) {
                Transaction tx;
                tx.sender = jtx["sender"];
                tx.receiver = jtx["receiver"];
                tx.amount = jtx["amount"];
                tx.signature = jtx["signature"];
                tx.publicKeyPem = jtx["publicKeyPem"];
                block.transactions.push_back(tx);
            }
            // Contents
            for (const auto& jc : jblock["contents"]) {
                Content c;
                c.type = jc["type"];
                c.filename = jc["filename"];
                c.uploader = jc["uploader"];
                c.hash = jc["hash"];
                c.timestamp = jc["timestamp"];
                c.publicKeyPem = jc["publicKeyPem"];
                block.contents.push_back(c);
            }
            chain.push_back(block);
        }
    }
    sqlite3_finalize(stmt);
    return true;
}

Wallet::Wallet() {
    // Generate ECDSA key pair
    generateKeyPair(privateKeyPem, publicKeyPem);
    address = publicKeyToAddress(publicKeyPem);
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

std::string Wallet::publicKeyToAddress(const std::string& pubKeyPem) {
    // Hash public key (SHA256), then Base58 encode with checksum
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char*)pubKeyPem.data(), pubKeyPem.size(), hash);
    std::vector<uint8_t> hashVec(hash, hash + SHA256_DIGEST_LENGTH);
    return Base58::encodeWithChecksum(hashVec);
}

void Blockchain::setConsensusMode(ConsensusMode mode) {
    consensusMode = mode;
}

ConsensusMode Blockchain::getConsensusMode() const {
    return consensusMode;
}

bool Blockchain::stake(const std::string& address, double amount) {
    if (balances[address] < amount || amount <= 0) return false;
    balances[address] -= amount;
    stakes[address] += amount;
    return true;
}

std::map<std::string, double> Blockchain::getStakes() const {
    return stakes;
}

bool Blockchain::delegateStake(const std::string& from, const std::string& to, double amount) {
    if (balances[from] < amount || amount <= 0) return false;
    balances[from] -= amount;
    delegations[from][to] += amount;
    delegatedStakes[to] += amount;
    return true;
}

std::map<std::string, double> Blockchain::getDelegatedStakes() const {
    return delegatedStakes;
}

bool Blockchain::mineBlockPoS() {
    if (mempool.empty() && pendingContents.empty()) return false;
    // Select staker weighted by stake
    double totalStake = 0;
    for (const auto& s : stakes) totalStake += s.second;
    if (totalStake == 0) return false;
    double r = ((double)rand() / RAND_MAX) * totalStake;
    double acc = 0;
    std::string selectedMiner;
    for (const auto& s : stakes) {
        acc += s.second;
        if (acc >= r) {
            selectedMiner = s.first;
            break;
        }
    }
    if (selectedMiner.empty()) return false;
    Block newBlock;
    newBlock.index = chain.size();
    newBlock.prevHash = chain.back().hash;
    newBlock.timestamp = std::time(nullptr);
    newBlock.transactions = mempool;
    newBlock.contents = pendingContents;
    newBlock.miner = selectedMiner;
    newBlock.difficulty = 1; // PoS blocks are easy to validate
    newBlock.nonce = 0;
    newBlock.hash = calculateHash(newBlock);
    if (!validateBlock(newBlock, chain.back())) {
        logError("Invalid PoS block mined, not adding to chain.");
        return false;
    }
    chain.push_back(newBlock);
    // Reward staker with halved block reward and total transaction fees
    double reward = getBlockReward(newBlock.index);
    double totalFees = 0;
    for (const auto& tx : mempool) {
        balances[tx.sender] -= (tx.amount + txFee);
        balances[tx.receiver] += tx.amount;
        totalFees += txFee;
    }
    balances[selectedMiner] += reward + totalFees;
    mempool.clear();
    pendingContents.clear();
    return true;
}

bool Blockchain::mineBlockDPoS() {
    if (mempool.empty() && pendingContents.empty()) return false;
    // Select delegate weighted by delegated stake
    double totalDelegated = 0;
    for (const auto& d : delegatedStakes) totalDelegated += d.second;
    if (totalDelegated == 0) return false;
    double r = ((double)rand() / RAND_MAX) * totalDelegated;
    double acc = 0;
    std::string selectedDelegate;
    for (const auto& d : delegatedStakes) {
        acc += d.second;
        if (acc >= r) {
            selectedDelegate = d.first;
            break;
        }
    }
    if (selectedDelegate.empty()) return false;
    Block newBlock;
    newBlock.index = chain.size();
    newBlock.prevHash = chain.back().hash;
    newBlock.timestamp = std::time(nullptr);
    newBlock.transactions = mempool;
    newBlock.contents = pendingContents;
    newBlock.miner = selectedDelegate;
    newBlock.difficulty = 1;
    newBlock.nonce = 0;
    newBlock.hash = calculateHash(newBlock);
    if (!validateBlockBFT(newBlock)) {
        logError("DPoS block did not pass BFT validation.");
        return false;
    }
    chain.push_back(newBlock);
    // Reward delegate with halved block reward and total transaction fees
    double reward = getBlockReward(newBlock.index);
    double totalFees = 0;
    for (const auto& tx : mempool) {
        balances[tx.sender] -= (tx.amount + txFee);
        balances[tx.receiver] += tx.amount;
        totalFees += txFee;
    }
    balances[selectedDelegate] += reward + totalFees;
    mempool.clear();
    pendingContents.clear();
    return true;
}

bool Blockchain::validateBlockBFT(const Block& block) const {
    // BFT stub: always true for now, can be extended to require >2/3 delegate signatures
    return true;
}

void Blockchain::addPeer(const std::string& peerAddress) {
    peers.insert(peerAddress);
    std::cout << "Peer added: " << peerAddress << std::endl;
}

void Blockchain::removePeer(const std::string& peerAddress) {
    peers.erase(peerAddress);
    std::cout << "Peer removed: " << peerAddress << std::endl;
}

std::set<std::string> Blockchain::getPeers() const {
    return peers;
}

void Blockchain::listenForPeers(int port) {
    // TODO: Implement TCP socket server to accept peer connections
    std::cout << "Listening for peers on port " << port << std::endl;
}

void Blockchain::gossipBlock(const Block& block) {
    // TODO: Relay block to all peers
    std::cout << "Gossiping block " << block.index << " to peers..." << std::endl;
}

void Blockchain::gossipTransaction(const Transaction& tx) {
    // TODO: Relay transaction to all peers
    std::cout << "Gossiping transaction from " << tx.sender << " to peers..." << std::endl;
}

void Blockchain::discoverPeers() {
    // TODO: Implement peer discovery (broadcast/receive peer list)
    std::cout << "Discovering peers..." << std::endl;
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

void Blockchain::sendEncrypted(const std::string& peerAddress, const std::string& data) {
    // TODO: Use OpenSSL to encrypt and send data to peer
    std::cout << "[SECURE] Sending encrypted data to " << peerAddress << std::endl;
}

std::string Blockchain::receiveEncrypted(const std::string& peerAddress) {
    // TODO: Use OpenSSL to receive and decrypt data from peer
    std::cout << "[SECURE] Receiving encrypted data from " << peerAddress << std::endl;
    return "";
}

bool Blockchain::isPeerBlocked(const std::string& peerAddress) const {
    return blockedPeers.count(peerAddress) > 0;
}

void Blockchain::blockPeer(const std::string& peerAddress) {
    blockedPeers.insert(peerAddress);
    std::cout << "[SECURITY] Blocked peer: " << peerAddress << std::endl;
}

void Blockchain::unblockPeer(const std::string& peerAddress) {
    blockedPeers.erase(peerAddress);
    std::cout << "[SECURITY] Unblocked peer: " << peerAddress << std::endl;
}
