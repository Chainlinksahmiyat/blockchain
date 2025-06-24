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
#include "sqlite3.h" // Add SQLite include
#include "base58.h"
#include <set>
#include <thread>
#include <atomic>

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
    std::string merkleRoot;
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
    static std::string publicKeyToAddress(const std::string& pubKeyPem);
    static bool encryptPrivateKey(const std::string& password);
    static bool decryptPrivateKey(const std::string& password);
    static bool importFromHardwareWallet();
};

enum class ConsensusMode { PoW, PoS };

class Blockchain {
public:
    Blockchain();
    ~Blockchain();
    bool addTransaction(const Transaction& tx);
    bool addContent(const Content& content, const std::string& miner);
    bool mineBlock(const std::string& miner);
    bool mineBlockPoS();
    void setConsensusMode(ConsensusMode mode);
    ConsensusMode getConsensusMode() const;
    bool stake(const std::string& address, double amount);
    std::map<std::string, double> getStakes() const;
    std::vector<Block> getChain() const;
    std::map<std::string, double> getBalances() const;
    bool isValidChain() const;
    bool saveToDb();
    bool loadFromDb();
    std::vector<Transaction> getMempool() const;
    bool delegateStake(const std::string& from, const std::string& to, double amount);
    bool mineBlockDPoS();
    bool validateBlockBFT(const Block& block) const;
    void setTxFee(double fee);
    double getTxFee() const;
    void setHalvingInterval(int interval);
    int getHalvingInterval() const;
    double getBlockReward(int blockIndex) const;
    std::map<std::string, double> getDelegatedStakes() const;
    std::string calculateMerkleRoot(const std::vector<Transaction>& transactions) const;
    // --- Peer-to-Peer Networking Stubs ---
public:
    void connectToPeer(const std::string& peerAddress);
    void broadcastBlock(const Block& block);
    void receiveBlock(const Block& block);
    void addPeer(const std::string& peerAddress);
    void removePeer(const std::string& peerAddress);
    std::set<std::string> getPeers() const;
    void listenForPeers(int port);
    void gossipBlock(const Block& block);
    void gossipTransaction(const Transaction& tx);
    void discoverPeers();
    // --- Security Features ---
    void sendEncrypted(const std::string& peerAddress, const std::string& data);
    std::string receiveEncrypted(const std::string& peerAddress);
    bool isPeerBlocked(const std::string& peerAddress) const;
    void blockPeer(const std::string& peerAddress);
    void unblockPeer(const std::string& peerAddress);
    // --- Production-Readiness & Security Improvements ---
    void logConsensusEvent(const std::string& event, const std::string& detail);
    // --- Peer Reputation & DDoS Resistance ---
    void reportPeerMisbehavior(const std::string& peerAddress);
    void rewardPeer(const std::string& peerAddress);
    // --- BFT/Fork Resolution Stub ---
    bool resolveFork(const std::vector<Block>& candidateChain);
    // --- Monitoring/Observability Hook ---
    void emitMetric(const std::string& metric, double value);
    // P2P networking (basic TCP server/client)
    void startP2PServer(int port);
    void stopP2PServer();
    void connectToPeerTCP(const std::string& host, int port);
private:
    std::vector<Block> chain;
    std::vector<Transaction> mempool;
    std::vector<Content> pendingContents;
    std::map<std::string, double> balances;
    int difficulty = 3;
    int targetBlockTime = 30; // seconds
    int adjustmentInterval = 5; // adjust every 5 blocks
    ConsensusMode consensusMode = ConsensusMode::PoW;
    std::map<std::string, double> stakes;
    std::map<std::string, double> delegatedStakes; // delegate address -> total delegated
    std::map<std::string, std::map<std::string, double>> delegations; // delegator -> (delegate -> amount)
    std::set<std::string> peers;
    std::set<std::string> blockedPeers;
    std::map<std::string, int> peerReputation;
    std::string calculateHash(const Block& block) const;
    void createGenesisBlock();
    bool validProof(const Block& block) const;
    void adjustDifficulty();
    bool validateBlock(const Block& newBlock, const Block& prevBlock) const;
    void logError(const std::string& message);
    sqlite3* db = nullptr; // SQLite database handle
    double txFee = 0.01; // default transaction fee
    int halvingInterval = 100; // blocks per halving
    double initialReward = 1.0;
    std::atomic<bool> p2pServerRunning{false};
    std::thread p2pServerThread;
    void p2pServerLoop(int port);
};

#endif // BLOCKCHAIN_H
