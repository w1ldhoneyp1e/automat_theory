#include <fstream>
#include <iostream>
#include "../include/Parser.h"
#include "../include/Vm.h"

int main(int argc, char* argv[])
{
	std::string source;
	if (argc > 1)
	{
		std::ifstream input(argv[1]);
		if (!input)
		{
			std::cerr << "Не удалось открыть файл: " << argv[1] << std::endl;
			return 1;
		}
		source.assign(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
	}
	else
	{
		source.assign(std::istreambuf_iterator<char>(std::cin), std::istreambuf_iterator<char>());
	}

	try
	{
		Parser parser;
		std::vector<Instruction> code = parser.ParseBytecode(source);
		Vm vm;
		vm.Load(code);
		int result = vm.Run();
		std::cout << result << std::endl;
		return 0;
	}
	catch (const std::exception& e)
	{
		std::cerr << "Ошибка: " << e.what() << std::endl;
		return 1;
	}
}
