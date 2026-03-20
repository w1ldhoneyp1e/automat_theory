import {
	type Instruction,
	type Value,
	Opcode,
} from './types'

class Vm {
	private instructions: Instruction[] = []

	load(code: Instruction[]): void {
		this.instructions = code
	}

	run(): Value {
		const stack: Value[] = []
		let ip = 0

		const pop = (): Value => {
			if (stack.length === 0) {
				throw new Error(`Стек пуст при выполнении инструкции ${ip}`)
			}

			return stack.pop()!
		}

		const peek = (): Value => {
			if (stack.length === 0) {
				throw new Error(`Стек пуст при выполнении инструкции ${ip}`)
			}

			return stack[stack.length - 1]
		}

		while (ip < this.instructions.length) {
			const instr = this.instructions[ip]

			switch (instr.op) {
				case Opcode.Const:
					stack.push(instr.value)
					ip++
					break

				case Opcode.Return:
					return stack.length > 0
						? peek()
						: 0

				case Opcode.Add: {
					const b = pop() as number
					const a = pop() as number
					stack.push(a + b)
					ip++
					break
				}

				case Opcode.Sub: {
					const b = pop() as number
					const a = pop() as number
					stack.push(a - b)
					ip++
					break
				}

				case Opcode.Mul: {
					const b = pop() as number
					const a = pop() as number
					stack.push(a * b)
					ip++
					break
				}

				case Opcode.Div: {
					const b = pop() as number
					const a = pop() as number
					if (b === 0) {
						throw new Error(`Деление на ноль по адресу ${ip}`)
					}
					stack.push(a / b)
					ip++
					break
				}

				case Opcode.Mod: {
					const b = pop() as number
					const a = pop() as number
					if (b === 0) {
						throw new Error(`Деление на ноль по адресу ${ip}`)
					}
					stack.push(a % b)
					ip++
					break
				}

				case Opcode.Neg:
					stack.push(-(pop() as number))
					ip++
					break

				case Opcode.Print:
					console.log(pop())
					ip++
					break

				default:
					throw new Error(`Неизвестная инструкция по адресу ${ip}`)
			}
		}

		return stack.length > 0
			? peek()
			: 0
	}
}

export {
	Vm,
}
