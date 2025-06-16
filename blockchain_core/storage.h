#ifndef STORAGE_H
#define STORAGE_H

#include <string>
#include <vector>
#include "blockchain.h"

class IStorage {
public:
    virtual bool saveChain(const std::vector<Block>& chain, const std::string& filename) = 0;
    virtual bool loadChain(std::vector<Block>& chain, const std::string& filename) = 0;
    virtual ~IStorage() {}
};

class FileStorage : public IStorage {
public:
    bool saveChain(const std::vector<Block>& chain, const std::string& filename) override;
    bool loadChain(std::vector<Block>& chain, const std::string& filename) override;
};

// In the future, you can add DatabaseStorage : public IStorage

#endif // STORAGE_H
