/* eslint-disable @typescript-eslint/naming-convention */

enum TokenType {
	CHAR = 'CHAR',
	UNION = 'UNION',
	STAR = 'STAR',
	PLUS = 'PLUS',
	LPAREN = 'LPAREN',
	RPAREN = 'RPAREN',
	EOF = 'EOF',
	ID = 'ID',
	NUMBER = 'NUMBER',
	ASSIGN = 'ASSIGN',
	MINUS = 'MINUS',
	MULTIPLY = 'MULTIPLY',
}

interface Token {
	type: TokenType,
	value?: string,
	position: number,
}

class Lexer {
	private static readonly MAX_ID_LENGTH = 255
	private static readonly MAX_NUMBER_LENGTH = 30

	private input: string
	private position: number

	constructor(input: string) {
		this.input = input.trim()
		this.position = 0
	}

	private skipWhitespace(): void {
		while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
			this.position++
		}
	}

	private currentChar(): string | null {
		if (this.position >= this.input.length) {
			return null
		}
		return this.input[this.position]
	}

	private isValidChar(char: string): boolean {
		return /[a-zA-Z0-9]/.test(char)
	}

	private isIdStart(char: string): boolean {
		return /[a-zA-Z_]/.test(char)
	}

	private isIdChar(char: string): boolean {
		return /[a-zA-Z0-9_]/.test(char)
	}

	private isDigit(char: string): boolean {
		return /[0-9]/.test(char)
	}

	private readId(): string {
		let id = ''
		while (this.position < this.input.length) {
			const char = this.currentChar()
			if (char && this.isIdChar(char)) {
				if (id.length >= Lexer.MAX_ID_LENGTH) {
					throw new Error(`Идентификатор слишком длинный (максимум ${Lexer.MAX_ID_LENGTH} символов) в позиции ${this.position}`)
				}
				id += char
				this.position++
			}
			else {
				break
			}
		}
		if (id.length === 0) {
			throw new Error(`Пустой идентификатор в позиции ${this.position}`)
		}
		return id
	}

	private readNumber(): string {
		let number = ''
		let hasDot = false
		while (this.position < this.input.length) {
			const char = this.currentChar()
			if (char && this.isDigit(char)) {
				if (number.length >= Lexer.MAX_NUMBER_LENGTH) {
					throw new Error(`Число слишком длинное (максимум ${Lexer.MAX_NUMBER_LENGTH} символов) в позиции ${this.position}`)
				}
				number += char
				this.position++
			}
			else if (char === '.' && !hasDot) {
				if (number.length >= Lexer.MAX_NUMBER_LENGTH) {
					throw new Error(`Число слишком длинное (максимум ${Lexer.MAX_NUMBER_LENGTH} символов) в позиции ${this.position}`)
				}
				number += char
				hasDot = true
				this.position++
			}
			else {
				break
			}
		}
		if (number.length === 0) {
			throw new Error(`Пустое число в позиции ${this.position}`)
		}
		return number
	}

	Get(): Token {
		this.skipWhitespace()

		if (this.position >= this.input.length) {
			return {
				type: TokenType.EOF,
				position: this.position,
			}
		}

		const startPos = this.position
		const char = this.currentChar()

		if (!char) {
			return {
				type: TokenType.EOF,
				position: this.position,
			}
		}

		if (this.isIdStart(char)) {
			const id = this.readId()
			return {
				type: TokenType.ID,
				value: id,
				position: startPos,
			}
		}

		if (this.isDigit(char)) {
			const number = this.readNumber()
			return {
				type: TokenType.NUMBER,
				value: number,
				position: startPos,
			}
		}

		if (char === ':' && this.position + 1 < this.input.length && this.input[this.position + 1] === '=') {
			this.position += 2
			return {
				type: TokenType.ASSIGN,
				value: ':=',
				position: startPos,
			}
		}

		switch (char) {
			case '+':
				this.position++
				return {
					type: TokenType.PLUS,
					position: startPos,
				}
			case '*':
				this.position++
				return {
					type: TokenType.STAR,
					position: startPos,
				}
			case '-':
				this.position++
				return {
					type: TokenType.MINUS,
					position: startPos,
				}
			case '(':
				this.position++
				return {
					type: TokenType.LPAREN,
					position: startPos,
				}
			case ')':
				this.position++
				return {
					type: TokenType.RPAREN,
					position: startPos,
				}
			case '|':
				this.position++
				return {
					type: TokenType.UNION,
					position: startPos,
				}
			default:
				if (this.isValidChar(char)) {
					this.position++
					return {
						type: TokenType.CHAR,
						value: char,
						position: startPos,
					}
				}
				throw new Error(`Неизвестный символ в позиции ${startPos}: ${char}`)
		}
	}

	Peek(): Token {
		const savedPosition = this.position
		const token = this.Get()
		this.position = savedPosition
		return token
	}

	Empty(): boolean {
		this.skipWhitespace()
		return this.position >= this.input.length
	}
}

export {
	TokenType,
	type Token,
	Lexer,
}
