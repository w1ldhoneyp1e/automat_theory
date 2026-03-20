import { Instruction, Opcode } from './types'

class Vm
{
	private instructions: Instruction[] = []

	load(code: Instruction[]): void
	{
		this.instructions = code
	}

	run(): number
	{
		const stack: number[] = []
		let ip = 0

		while (ip < this.instructions.length)
		{
			const instr = this.instructions[ip]

			switch (instr.op)
			{
				case Opcode.Const:
					stack.push(instr.value)
					ip++
					break

				case Opcode.Return:
					return stack.length > 0 ? stack[stack.length - 1] : 0

				default:
					throw new Error(`Неизвестная инструкция по адресу ${ip}`)
			}
		}

		return stack.length > 0 ? stack[stack.length - 1] : 0
	}
}

export {
	Vm,
}
