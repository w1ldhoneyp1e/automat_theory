import {
	type Token,
	Lexer,
	TokenType,
} from '../lexer/Lexer'

describe('Lexer', () => {
	describe('Базовые токены', () => {
		it('должен распознавать символ CHAR (цифра не в начале)', () => {
			const lexer = new Lexer('0')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.NUMBER)
			expect(token.value).toBe('0')
			expect(token.position).toBe(0)
		})

		it('должен распознавать оператор UNION (|)', () => {
			const lexer = new Lexer('|')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.UNION)
			expect(token.position).toBe(0)
		})

		it('должен распознавать оператор STAR (*)', () => {
			const lexer = new Lexer('*')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.STAR)
			expect(token.position).toBe(0)
		})

		it('должен распознавать оператор PLUS (+)', () => {
			const lexer = new Lexer('+')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.PLUS)
			expect(token.position).toBe(0)
		})

		it('должен распознавать оператор MINUS (-)', () => {
			const lexer = new Lexer('-')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.MINUS)
			expect(token.position).toBe(0)
		})

		it('должен распознавать левую скобку', () => {
			const lexer = new Lexer('(')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.LPAREN)
			expect(token.position).toBe(0)
		})

		it('должен распознавать правую скобку', () => {
			const lexer = new Lexer(')')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.RPAREN)
			expect(token.position).toBe(0)
		})
	})

	describe('Идентификаторы', () => {
		it('должен распознавать простой идентификатор', () => {
			const lexer = new Lexer('abc')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('abc')
			expect(token.position).toBe(0)
		})

		it('должен распознавать идентификатор с подчеркиванием', () => {
			const lexer = new Lexer('my_var')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('my_var')
		})

		it('должен распознавать идентификатор с цифрами', () => {
			const lexer = new Lexer('var123')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('var123')
		})

		it('должен распознавать идентификатор, начинающийся с подчеркивания', () => {
			const lexer = new Lexer('_private')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('_private')
		})
	})

	describe('Числа', () => {
		it('должен распознавать целое число', () => {
			const lexer = new Lexer('123')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.NUMBER)
			expect(token.value).toBe('123')
			expect(token.position).toBe(0)
		})

		it('должен распознавать число с плавающей точкой', () => {
			const lexer = new Lexer('123.456')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.NUMBER)
			expect(token.value).toBe('123.456')
		})

		it('должен обрабатывать точку как неизвестный символ, если она не часть числа', () => {
			const lexer = new Lexer('.5')
			expect(() => lexer.Get()).toThrow('Неизвестный символ')
		})

		it('должен обрабатывать только одну точку в числе', () => {
			const lexer = new Lexer('12.34.56')
			const token1 = lexer.Get()
			expect(token1.type).toBe(TokenType.NUMBER)
			expect(token1.value).toBe('12.34')
		})
	})

	describe('Оператор присваивания', () => {
		it('должен распознавать оператор :=', () => {
			const lexer = new Lexer(':=')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ASSIGN)
			expect(token.value).toBe(':=')
			expect(token.position).toBe(0)
		})
	})

	describe('Последовательность токенов', () => {
		it('должен читать несколько токенов подряд', () => {
			const lexer = new Lexer('a b c')
			const token1 = lexer.Get()
			const token2 = lexer.Get()
			const token3 = lexer.Get()
			expect(token1.value).toBe('a')
			expect(token2.value).toBe('b')
			expect(token3.value).toBe('c')
		})

		it('должен правильно обрабатывать позиции токенов', () => {
			const lexer = new Lexer('a  b   c')
			const token1 = lexer.Get()
			const token2 = lexer.Get()
			const token3 = lexer.Get()
			expect(token1.position).toBe(0)
			expect(token2.position).toBe(3)
			expect(token3.position).toBe(7)
		})

		it('должен парсить сложное выражение', () => {
			const lexer = new Lexer('(ab*a | b)*')
			const tokens: Token[] = []
			while (!lexer.Empty()) {
				tokens.push(lexer.Get())
			}
			expect(tokens[0].type).toBe(TokenType.LPAREN)
			expect(tokens[1].type).toBe(TokenType.ID)
			expect(tokens[1].value).toBe('ab')
			expect(tokens[2].type).toBe(TokenType.STAR)
			expect(tokens[3].type).toBe(TokenType.ID)
			expect(tokens[3].value).toBe('a')
			expect(tokens[4].type).toBe(TokenType.UNION)
			expect(tokens[5].type).toBe(TokenType.ID)
			expect(tokens[5].value).toBe('b')
			expect(tokens[6].type).toBe(TokenType.RPAREN)
			expect(tokens[7].type).toBe(TokenType.STAR)
		})
	})

	describe('Пробелы', () => {
		it('должен пропускать пробелы', () => {
			const lexer = new Lexer('   a   ')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('a')
		})

		it('должен пропускать табуляции и переводы строк', () => {
			const lexer = new Lexer('\t\n\r a')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe('a')
		})
	})

	describe('EOF', () => {
		it('должен возвращать EOF в конце входных данных', () => {
			const lexer = new Lexer('a')
			lexer.Get()
			const eof = lexer.Get()
			expect(eof.type).toBe(TokenType.EOF)
		})

		it('должен возвращать EOF для пустой строки', () => {
			const lexer = new Lexer('')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.EOF)
		})

		it('должен возвращать EOF для строки только с пробелами', () => {
			const lexer = new Lexer('   ')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.EOF)
		})
	})

	describe('Метод Peek', () => {
		it('должен возвращать следующий токен без продвижения позиции', () => {
			const lexer = new Lexer('ab')
			const peek1 = lexer.Peek()
			const peek2 = lexer.Peek()
			const token1 = lexer.Get()
			expect(peek1.type).toBe(TokenType.ID)
			expect(peek1.value).toBe('ab')
			expect(peek2.type).toBe(TokenType.ID)
			expect(peek2.value).toBe('ab')
			expect(token1.type).toBe(TokenType.ID)
			expect(token1.value).toBe('ab')
		})
	})

	describe('Метод Empty', () => {
		it('должен возвращать true для пустой строки', () => {
			const lexer = new Lexer('')
			expect(lexer.Empty()).toBe(true)
		})

		it('должен возвращать false, если есть токены', () => {
			const lexer = new Lexer('a')
			expect(lexer.Empty()).toBe(false)
		})

		it('должен возвращать true после чтения всех токенов', () => {
			const lexer = new Lexer('a')
			lexer.Get()
			lexer.Get()
			expect(lexer.Empty()).toBe(true)
		})
	})

	describe('Валидация длины идентификаторов', () => {
		it('должен принимать идентификатор максимальной длины', () => {
			const longId = 'a'.repeat(255)
			const lexer = new Lexer(longId)
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.ID)
			expect(token.value).toBe(longId)
		})

		it('должен выбрасывать ошибку для слишком длинного идентификатора', () => {
			const tooLongId = 'a'.repeat(256)
			const lexer = new Lexer(tooLongId)
			expect(() => lexer.Get()).toThrow('Идентификатор слишком длинный')
		})
	})

	describe('Валидация длины чисел', () => {
		it('должен принимать число максимальной длины', () => {
			const longNumber = '1'.repeat(30)
			const lexer = new Lexer(longNumber)
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.NUMBER)
			expect(token.value).toBe(longNumber)
		})

		it('должен выбрасывать ошибку для слишком длинного числа', () => {
			const tooLongNumber = '1'.repeat(31)
			const lexer = new Lexer(tooLongNumber)
			expect(() => lexer.Get()).toThrow('Число слишком длинное')
		})

		it('должен выбрасывать ошибку для слишком длинного числа с точкой', () => {
			const tooLongNumber = '1'.repeat(29) + '.5'
			const lexer = new Lexer(tooLongNumber)
			expect(() => lexer.Get()).toThrow('Число слишком длинное')
		})
	})

	describe('Обработка ошибок', () => {
		it('должен выбрасывать ошибку для неизвестного символа', () => {
			const lexer = new Lexer('@')
			expect(() => lexer.Get()).toThrow('Неизвестный символ')
		})

		it('должен выбрасывать ошибку с правильной позицией', () => {
			const lexer = new Lexer('abc @')
			lexer.Get()
			try {
				lexer.Get()
			}
			catch (error: unknown) {
				if (error instanceof Error) {
					expect(error.message).toContain('позиции 4')
				}
			}
		})
	})

	describe('Разделение идентификаторов и чисел', () => {
		it('должен различать идентификатор и число', () => {
			const lexer = new Lexer('abc 123')
			const token1 = lexer.Get()
			const token2 = lexer.Get()
			expect(token1.type).toBe(TokenType.ID)
			expect(token1.value).toBe('abc')
			expect(token2.type).toBe(TokenType.NUMBER)
			expect(token2.value).toBe('123')
		})

		it('должен различать идентификатор, начинающийся с буквы, и число', () => {
			const lexer = new Lexer('a1 1a')
			const token1 = lexer.Get()
			const token2 = lexer.Get()
			const token3 = lexer.Get()
			expect(token1.type).toBe(TokenType.ID)
			expect(token1.value).toBe('a1')
			expect(token2.type).toBe(TokenType.NUMBER)
			expect(token2.value).toBe('1')
			expect(token3.type).toBe(TokenType.ID)
			expect(token3.value).toBe('a')
		})
	})

	describe('CHAR токены', () => {
		it('должен использовать CHAR для одиночных символов, не являющихся началом идентификатора', () => {
			const lexer = new Lexer('0')
			const token = lexer.Get()
			expect(token.type).toBe(TokenType.NUMBER)
		})
	})
})

