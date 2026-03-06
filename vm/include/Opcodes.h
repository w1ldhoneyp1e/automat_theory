#ifndef VM_OPCODES_H
#define VM_OPCODES_H

enum class Opcode
{
	Const,
	Return,
};

struct Instruction
{
	Opcode Op;
	int Value;
};

#endif
