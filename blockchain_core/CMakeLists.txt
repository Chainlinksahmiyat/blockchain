cmake_minimum_required(VERSION 3.10)
project(ahmiyat_blockchain)
set(CMAKE_CXX_STANDARD 17)
add_executable(ahmiyat_blockchain main.cpp blockchain.cpp)

# add OpenSSL for SHA256
find_package(OpenSSL REQUIRED)
target_link_libraries(ahmiyat_blockchain PRIVATE OpenSSL::Crypto)
