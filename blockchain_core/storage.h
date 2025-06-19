#ifndef STORAGE_H
#define STORAGE_H

#include <string>
#include <vector>

// Forward declare Block instead of including blockchain.h
struct Block;

class IStorage {
public:
    virtual bool saveChain(const std::vector<Block>& chain, const std::string& filename) const = 0;
    virtual bool loadChain(std::vector<Block>& chain, const std::string& filename) const = 0;
    virtual ~IStorage() {}
};

// In the future, you can add DatabaseStorage : public IStorage

#endif // STORAGE_H
