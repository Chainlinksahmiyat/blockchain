// Ahmiyat Blockchain - Example Usage
// Written from scratch in C++

#include "blockchain.h"
#include <iostream>
#include <cstring>
#include <fstream>

int main(int argc, char* argv[]) {
    Blockchain chain;
    chain.loadFromDb();
    if (argc > 1) {
        if (strcmp(argv[1], "create-wallet") == 0) {
            Wallet w;
            std::cout << "Address: " << w.address << std::endl;
            std::cout << "Public Key PEM:\n" << w.publicKeyPem << std::endl;
            std::cout << "Private Key PEM (keep secret!):\n" << w.privateKeyPem << std::endl;
            // Optionally save to file
            std::ofstream out((w.address + ".wallet").c_str());
            out << w.privateKeyPem;
            out.close();
            return 0;
        } else if (strcmp(argv[1], "balance") == 0 && argc == 3) {
            auto bals = chain.getBalances();
            std::string addr = argv[2];
            std::cout << "Balance for " << addr << ": " << (bals.count(addr) ? bals[addr] : 0.0) << std::endl;
            return 0;
        } else if (strcmp(argv[1], "send") == 0 && argc == 6) {
            std::string from = argv[2];
            std::string to = argv[3];
            double amount = std::stod(argv[4]);
            std::string privFile = argv[5];
            std::ifstream in(privFile.c_str());
            std::string privPem((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
            in.close();
            Wallet w;
            w.privateKeyPem = privPem;
            // Derive public key and address
            // (Assume Wallet can derive publicKeyPem from privateKeyPem if needed)
            // For demo, require user to provide correct publicKeyPem
            std::cout << "Enter public key PEM for sender (end with EOF):\n";
            std::string pubPem, line;
            while (std::getline(std::cin, line)) pubPem += line + "\n";
            w.publicKeyPem = pubPem;
            w.address = Wallet::publicKeyToAddress(pubPem);
            std::string data = from + to + std::to_string(amount);
            std::string sig = Wallet::sign(data, privPem);
            Transaction t = {from, to, amount, sig, pubPem};
            if (chain.addTransaction(t)) {
                chain.saveToDb();
                std::cout << "Transaction added\n";
            } else {
                std::cout << "Transaction failed\n";
            }
            return 0;
        } else if (strcmp(argv[1], "stake") == 0 && argc == 4) {
            std::string addr = argv[2];
            double amt = std::stod(argv[3]);
            if (chain.stake(addr, amt)) {
                chain.saveToDb();
                std::cout << "Staked successfully\n";
            } else {
                std::cout << "Stake failed\n";
            }
            return 0;
        } else if (strcmp(argv[1], "delegate") == 0 && argc == 5) {
            std::string from = argv[2];
            std::string to = argv[3];
            double amt = std::stod(argv[4]);
            if (chain.delegateStake(from, to, amt)) {
                chain.saveToDb();
                std::cout << "Delegated successfully\n";
            } else {
                std::cout << "Delegation failed\n";
            }
            return 0;
        } else if (strcmp(argv[1], "set-consensus") == 0 && argc == 3) {
            std::string mode = argv[2];
            if (mode == "pow") chain.setConsensusMode(ConsensusMode::PoW);
            else if (mode == "pos") chain.setConsensusMode(ConsensusMode::PoS);
            else if (mode == "dpos") chain.setConsensusMode(ConsensusMode::PoW); // For demo, treat as PoW
            chain.saveToDb();
            std::cout << "Consensus mode set\n";
            return 0;
        } else if (strcmp(argv[1], "add-tx") == 0 && argc == 6) {
            Transaction t = {argv[2], argv[3], std::stod(argv[4]), argv[5]};
            chain.addTransaction(t);
            chain.saveToDb();
            std::cout << "Transaction added\n";
            return 0;
        } else if (strcmp(argv[1], "add-content") == 0 && argc == 6) {
            Content c = {argv[2], argv[3], argv[4], argv[5], std::time(nullptr)};
            chain.addContent(c, argv[4]);
            chain.mineBlock(argv[4]);
            chain.saveToDb();
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
        } else if (strcmp(argv[1], "set-fee") == 0 && argc == 3) {
            double fee = std::stod(argv[2]);
            chain.setTxFee(fee);
            chain.saveToDb();
            std::cout << "Transaction fee set\n";
            return 0;
        } else if (strcmp(argv[1], "get-fee") == 0) {
            std::cout << "Current transaction fee: " << chain.getTxFee() << std::endl;
            return 0;
        } else if (strcmp(argv[1], "set-halving") == 0 && argc == 3) {
            int interval = std::stoi(argv[2]);
            chain.setHalvingInterval(interval);
            chain.saveToDb();
            std::cout << "Halving interval set\n";
            return 0;
        } else if (strcmp(argv[1], "get-halving") == 0) {
            std::cout << "Current halving interval: " << chain.getHalvingInterval() << std::endl;
            return 0;
        } else if (strcmp(argv[1], "p2p-server") == 0 && argc == 3) {
            int port = std::stoi(argv[2]);
            chain.startP2PServer(port);
            std::cout << "Press Enter to stop server..." << std::endl;
            std::cin.get();
            chain.stopP2PServer();
            return 0;
        } else if (strcmp(argv[1], "p2p-connect") == 0 && argc == 4) {
            std::string host = argv[2];
            int port = std::stoi(argv[3]);
            chain.connectToPeerTCP(host, port);
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
    chain.saveToDb();
    Blockchain loaded;
    loaded.loadFromDb();
    std::cout << "Loaded chain blocks: " << loaded.getChain().size() << std::endl;
    return 0;
}
