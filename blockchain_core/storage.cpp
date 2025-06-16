#include "storage.h"
#include <fstream>
#include <sstream>

bool FileStorage::saveChain(const std::vector<Block>& chain, const std::string& filename) {
    std::ofstream out(filename);
    if (!out) return false;
    for (const auto& block : chain) {
        out << block.index << ' ' << block.prevHash << ' ' << block.hash << ' ' << block.timestamp << ' ' << block.miner << ' ' << block.nonce << ' ' << block.difficulty << '\n';
        for (const auto& tx : block.transactions) {
            out << "TX " << tx.sender << ' ' << tx.receiver << ' ' << tx.amount << ' ' << tx.signature << ' ' << tx.publicKeyPem << '\n';
        }
        for (const auto& c : block.contents) {
            out << "CT " << c.type << ' ' << c.filename << ' ' << c.uploader << ' ' << c.hash << ' ' << c.timestamp << ' ' << c.publicKeyPem << '\n';
        }
    }
    return true;
}

bool FileStorage::loadChain(std::vector<Block>& chain, const std::string& filename) {
    std::ifstream in(filename);
    if (!in) return false;
    chain.clear();
    std::string line;
    Block block;
    while (std::getline(in, line)) {
        if (line.substr(0, 2) == "TX") {
            std::istringstream iss(line.substr(3));
            Transaction tx;
            iss >> tx.sender >> tx.receiver >> tx.amount >> tx.signature >> tx.publicKeyPem;
            block.transactions.push_back(tx);
        } else if (line.substr(0, 2) == "CT") {
            std::istringstream iss(line.substr(3));
            Content c;
            iss >> c.type >> c.filename >> c.uploader >> c.hash >> c.timestamp >> c.publicKeyPem;
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
