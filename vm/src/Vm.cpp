#include "../include/Vm.h"
#include <stack>
#include <stdexcept>
#include <string>

void Vm::Load(const std::vector<Instruction>& code)
{
	instructions = code;
}

int Vm::Run()
{
	std::stack<int> stack;
	size_t ip = 0;

	while (ip < instructions.size())
	{
		const Instruction& instr = instructions[ip];
		switch (instr.Op)
		{
		case Opcode::Const:
			stack.push(instr.Value);
			ip++;
			break;
		case Opcode::Return:
			if (stack.empty())
				return 0;
			{
				int value = stack.top();
				stack.pop();
				return value;
			}
		default:
			throw std::runtime_error("Неизвестная инструкция по адресу " + std::to_string(ip));
		}
	}

	return stack.empty() ? 0 : stack.top();
}
