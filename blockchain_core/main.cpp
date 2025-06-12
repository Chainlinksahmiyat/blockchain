// Ahmiyat Blockchain - Example Usage
// Written from scratch in C++

#include "blockchain.h"
#include <iostream>
#include <cstring>

int main(int argc, char* argv[]) {
    Blockchain chain;
    chain.loadFromFile("chain.txt");
    if (argc > 1) {
        if (strcmp(argv[1], "add-tx") == 0 && argc == 6) {
            Transaction t = {argv[2], argv[3], std::stod(argv[4]), argv[5]};
            chain.addTransaction(t);
            chain.saveToFile("chain.txt");
            std::cout << "Transaction added\n";
            return 0;
        } else if (strcmp(argv[1], "add-content") == 0 && argc == 6) {
            Content c = {argv[2], argv[3], argv[4], argv[5], std::time(nullptr)};
            chain.addContent(c, argv[4]);
            chain.mineBlock(argv[4]);
            chain.saveToFile("chain.txt");
            std::cout << "Content added and block mined\n";
            return 0;
        } else if (strcmp(argv[1], "explorer") == 0) {
            for (const auto& block : chain.getChain()) {
                std::cout << "Block " << block.index << ": " << block.hash << "\n";
                std::cout << "  Miner: " << block.miner << "\n";
                std::cout << "  Nonce: " << block.nonce << "\n";
                std::cout << "  Difficulty: " << block.difficulty << "\n";
                for (const auto& tx : block.transactions) {
                    std::cout << "    TX: " << tx.sender << " -> " << tx.receiver << " | " << tx.amount << " | sig: " << tx.signature << "\n";
                }
                for (const auto& c : block.contents) {
                    std::cout << "    CT: " << c.type << ": " << c.filename << " by " << c.uploader << "\n";
                }
            }
            return 0;
        }
    }
    // Print balances
    for (const auto& [user, bal] : chain.getBalances()) {
        std::cout << user << " balance: " << bal << " Ahmiyat Coin\n";
    }
    // Validate chain
    std::cout << "Chain valid: " << (chain.isValidChain() ? "YES" : "NO") << std::endl;
    // Save/load demo
    chain.saveToFile("chain.txt");
    Blockchain loaded;
    loaded.loadFromFile("chain.txt");
    std::cout << "Loaded chain blocks: " << loaded.getChain().size() << std::endl;
    return 0;
}
