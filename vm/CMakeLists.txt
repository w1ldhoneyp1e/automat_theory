cmake_minimum_required(VERSION 3.16)
project(vm LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
# Clang: cmake -DCMAKE_CXX_COMPILER=clang++ ..

add_executable(vm
	src/main.cpp
	src/Parser.cpp
	src/Vm.cpp
)

target_include_directories(vm PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
