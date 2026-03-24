import {type LL1Row, type TraceStep} from '../types'

const MAX_STEPS = 500

function traceLL1(table: LL1Row[], inputTokens: string[]): TraceStep[] {
	const tokens = [...inputTokens, '$']
	const steps: TraceStep[] = []
	const stack: number[] = []
	let currentRowId = table[0]?.id ?? 1
	let tokenIndex = 0

	while (steps.length < MAX_STEPS) {
		const row = table.find(r => r.id === currentRowId)

		if (!row) {
			steps.push({
				rowId: currentRowId,
				tokenIndex,
				tokens,
				stackSnapshot: [...stack],
				action: 'error',
				description: `Строка ${currentRowId} не найдена в таблице`,
			})
			break
		}

		const token = tokens[tokenIndex] ?? '$'
		const tokenInNM = row.nm.includes(token)

		if (row.shift) {
			if (!tokenInNM) {
				steps.push({
					rowId: row.id,
					tokenIndex,
					tokens,
					stackSnapshot: [...stack],
					action: 'error',
					description: `Ошибка: ожидалось {${row.nm.join(', ')}}, получено «${token}»`,
				})
				break
			}

			steps.push({
				rowId: row.id,
				tokenIndex,
				tokens,
				stackSnapshot: [...stack],
				action: 'shift',
				description: `Сдвиг «${token}»`,
			})
			tokenIndex++

			if (row.transition !== null) {
				currentRowId = row.transition
			}
			else if (stack.length > 0) {
				currentRowId = stack.pop()!
			}
			else {
				steps.push({
					rowId: row.id,
					tokenIndex,
					tokens,
					stackSnapshot: [],
					action: 'accept',
					description: 'Разбор завершён успешно',
				})
				break
			}
		}
		else if (row.stack) {
			if (!tokenInNM) {
				steps.push({
					rowId: row.id,
					tokenIndex,
					tokens,
					stackSnapshot: [...stack],
					action: 'error',
					description: `Ошибка: ожидалось {${row.nm.join(', ')}}, получено «${token}»`,
				})
				break
			}

			const returnRow = row.id + 1
			steps.push({
				rowId: row.id,
				tokenIndex,
				tokens,
				stackSnapshot: [...stack],
				action: 'call',
				description: `Вызов «${row.symbol}»: стек ← ${returnRow}, переход → ${row.transition}`,
			})
			stack.push(returnRow)
			currentRowId = row.transition!
		}
		else if (tokenInNM) {
			if (row.transition === null) {
				steps.push({
					rowId: row.id,
					tokenIndex,
					tokens,
					stackSnapshot: [...stack],
					action: 'epsilon',
					description: `e-правило для «${row.symbol}»`,
				})

				if (stack.length > 0) {
					currentRowId = stack.pop()!
				}
				else {
					steps.push({
						rowId: row.id,
						tokenIndex,
						tokens,
						stackSnapshot: [],
						action: 'accept',
						description: 'Разбор завершён успешно',
					})
					break
				}
			}
			else {
				steps.push({
					rowId: row.id,
					tokenIndex,
					tokens,
					stackSnapshot: [...stack],
					action: 'dispatch',
					description: `Выбор варианта «${row.symbol}» → строка ${row.transition}`,
				})
				currentRowId = row.transition
			}
		}
		else if (!row.error) {
			currentRowId = row.id + 1
		}
		else {
			steps.push({
				rowId: row.id,
				tokenIndex,
				tokens,
				stackSnapshot: [...stack],
				action: 'error',
				description: `Ошибка: ожидалось {${row.nm.join(', ')}}, получено «${token}»`,
			})
			break
		}
	}

	if (steps.length >= MAX_STEPS) {
		steps.push({
			rowId: currentRowId,
			tokenIndex,
			tokens,
			stackSnapshot: [...stack],
			action: 'error',
			description: `Превышено максимальное число шагов (${MAX_STEPS})`,
		})
	}

	return steps
}

export {traceLL1}
