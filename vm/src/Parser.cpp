#include "../include/Parser.h"
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include <cctype>

static std::string Trim(const std::string& s)
{
	auto start = s.find_first_not_of(" \t\r\n");
	if (start == std::string::npos)
		return "";
	auto end = s.find_last_not_of(" \t\r\n");
	return s.substr(start, end - start + 1);
}

static std::string ToUpper(const std::string& s)
{
	std::string r = s;
	std::transform(r.begin(), r.end(), r.begin(),
		[](unsigned char c) { return std::toupper(c); });
	return r;
}

static Instruction ParseLine(const std::string& line)
{
	std::string trimmed = Trim(line);
	if (trimmed.empty() || (trimmed.length() >= 1 && trimmed[0] == ';'))
	{
		return {Opcode::Return, 0};
	}
	std::istringstream iss(trimmed);
	std::string op;
	iss >> op;
	op = ToUpper(op);
	if (op == "OP_CONST" || op == "CONST")
	{
		int value;
		if (!(iss >> value))
		{
			throw std::runtime_error("OP_CONST требует числовой операнд: " + line);
		}
		return {Opcode::Const, value};
	}
	if (op == "OP_RETURN" || op == "RETURN")
	{
		return {Opcode::Return, 0};
	}
	throw std::runtime_error("Неизвестная инструкция: " + op);
}

std::vector<Instruction> Parser::ParseBytecode(const std::string& source)
{
	std::vector<Instruction> instructions;
	std::istringstream iss(source);
	std::string line;
	while (std::getline(iss, line))
	{
		std::string trimmed = Trim(line);
		if (trimmed.empty() || (trimmed.length() >= 1 && trimmed[0] == ';'))
		{
			continue;
		}
		Instruction instr = ParseLine(line);
		if (instr.Op == Opcode::Return && instructions.empty())
		{
			continue;
		}
		instructions.push_back(instr);
	}
	return instructions;
}
