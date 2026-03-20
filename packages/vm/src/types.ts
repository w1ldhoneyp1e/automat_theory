enum Opcode
{
	Const = 'OP_CONST',
	Return = 'OP_RETURN',
}

interface ConstInstruction
{
	op: Opcode.Const
	value: number
}

interface ReturnInstruction
{
	op: Opcode.Return
}

type Instruction = ConstInstruction | ReturnInstruction

export {
	Opcode,
	ConstInstruction,
	ReturnInstruction,
	Instruction,
}
