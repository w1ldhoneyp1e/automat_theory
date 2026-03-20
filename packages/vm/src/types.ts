/* eslint-disable @typescript-eslint/naming-convention */
type Value = number

enum Opcode {
	Const = 'OP_CONST',
	Return = 'OP_RETURN',

	Add = 'ADD',
	Sub = 'SUB',
	Mul = 'MUL',
	Div = 'DIV',
	Mod = 'MOD',
	Neg = 'NEG',

	Print = 'PRINT',
}

interface ConstInstruction {
	op: Opcode.Const,
	value: number,
}

type NoArgOpcode =
	| Opcode.Return
	| Opcode.Add
	| Opcode.Sub
	| Opcode.Mul
	| Opcode.Div
	| Opcode.Mod
	| Opcode.Neg
	| Opcode.Print

interface NoArgInstruction {
	op: NoArgOpcode,
}

type Instruction = ConstInstruction | NoArgInstruction

export {
	Value,
	Opcode,
	NoArgOpcode,
	ConstInstruction,
	NoArgInstruction,
	Instruction,
}
