import { Instruction, Opcode } from './types'

class Parser
{
	parseBytecode(source: string): Instruction[]
	{
		const lines = source.split(/\r?\n/)
		const instructions: Instruction[] = []

		for (const line of lines)
		{
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith(';'))
			{
				continue
			}
			const instr = this.parseLine(trimmed)
			if (instr !== null)
			{
				instructions.push(instr)
			}
		}

		return instructions
	}

	private parseLine(line: string): Instruction | null
	{
		const parts = line.split(/\s+/)
		const op = parts[0].toUpperCase()

		if (op === 'OP_CONST' || op === 'CONST')
		{
			const value = Number(parts[1])
			if (parts.length < 2 || Number.isNaN(value))
			{
				throw new Error(`OP_CONST требует числовой операнд: ${line}`)
			}

			return { op: Opcode.Const, value }
		}

		if (op === 'OP_RETURN' || op === 'RETURN')
		{
			return { op: Opcode.Return }
		}

		throw new Error(`Неизвестная инструкция: ${op}`)
	}
}

export {
	Parser,
}
