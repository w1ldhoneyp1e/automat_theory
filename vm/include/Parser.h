#ifndef VM_PARSER_H
#define VM_PARSER_H

#include "Opcodes.h"
#include <string>
#include <vector>

class Parser {
  public:
    std::vector<Instruction> ParseBytecode(const std::string &source);
};

#endif
