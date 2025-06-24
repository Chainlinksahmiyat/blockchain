cmake_minimum_required(VERSION 3.10)
project(ahmiyat_blockchain)
set(CMAKE_CXX_STANDARD 17)
add_executable(ahmiyat_blockchain main.cpp blockchain.cpp ecdsa_utils.cpp base58.cpp storage.cpp)

# add OpenSSL for SHA256
find_package(OpenSSL REQUIRED)
target_link_libraries(ahmiyat_blockchain PRIVATE OpenSSL::Crypto)

# add SQLite3 for database
find_package(SQLite3 REQUIRED)
target_link_libraries(ahmiyat_blockchain PRIVATE SQLite::SQLite3)

target_link_libraries(ahmiyat_blockchain PRIVATE pthread)
# add nlohmann_json for JSON serialization
find_package(nlohmann_json 3.2.0 REQUIRED)
target_link_libraries(ahmiyat_blockchain PRIVATE nlohmann_json::nlohmann_json)
