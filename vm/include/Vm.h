#ifndef VM_VM_H
#define VM_VM_H

#include <vector>
#include "Opcodes.h"

class Vm
{
public:
	void Load(const std::vector<Instruction>& instructions);
	int Run();

private:
	std::vector<Instruction> instructions;
};

#endif
