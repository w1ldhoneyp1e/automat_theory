import {
	type Instruction,
	type NoArgOpcode,
	Opcode,
} from './types'

const NO_ARG_OPCODES: Record<string, NoArgOpcode> = {
	'OP_RETURN': Opcode.Return,
	'RETURN': Opcode.Return,
	'ADD': Opcode.Add,
	'SUB': Opcode.Sub,
	'MUL': Opcode.Mul,
	'DIV': Opcode.Div,
	'MOD': Opcode.Mod,
	'NEG': Opcode.Neg,
	'PRINT': Opcode.Print,
}

class Parser {
	parseBytecode(source: string): Instruction[] {
		const lines = source.split(/\r?\n/)
		const instructions: Instruction[] = []

		for (const line of lines) {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith(';')) {
				continue
			}
			instructions.push(this.parseLine(trimmed))
		}

		return instructions
	}

	private parseLine(line: string): Instruction {
		const parts = line.split(/\s+/)
		const op = parts[0].toUpperCase()

		if (op === 'OP_CONST' || op === 'CONST') {
			const value = Number(parts[1])
			if (parts.length < 2 || Number.isNaN(value)) {
				throw new Error(`CONST требует числовой операнд: ${line}`)
			}

			return {
				op: Opcode.Const,
				value,
			}
		}

		if (op in NO_ARG_OPCODES) {
			return {op: NO_ARG_OPCODES[op]}
		}

		throw new Error(`Неизвестная инструкция: ${op}`)
	}
}

export {
	Parser,
}
