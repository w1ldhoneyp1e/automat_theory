import * as fs from 'fs'
import * as path from 'path'
import {mealyToMoore, mooreToMealy} from './converter'
import {generateMealyDot, generateMooreDot} from './generator'
import {detectMachineType, parse} from './parser'

function generateOutputFileName(inputFile: string): string {
	const ext = path.extname(inputFile)
	const baseName = path.basename(inputFile, ext)
	const dir = path.dirname(inputFile)
	return path.join(dir, `${baseName}_converted${ext}`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const inputFile = args[0]
	const outputFile = args[1] || generateOutputFileName(inputFile)

	try {
		const inputContent = fs.readFileSync(inputFile, 'utf-8')
		console.log(`Читаем файл: ${inputFile}`)

		const dotGraph = parse(inputContent)
		console.log('DOT граф успешно распарсен')

		const machineType = detectMachineType(dotGraph)
		console.log(`Определён тип автомата: ${machineType === 'mealy'
			? 'Мили'
			: 'Мура'}`)

		let outputContent: string

		if (machineType === 'mealy') {
			console.log('Конвертируем из Мили в Мура...')
			const mooreMachine = mealyToMoore(dotGraph)
			outputContent = generateMooreDot(mooreMachine)
			console.log('Конвертация завершена: Мили -> Мура')
		}
		else {
			console.log('Конвертируем из Мура в Мили...')
			const mealyMachine = mooreToMealy(dotGraph)
			outputContent = generateMealyDot(mealyMachine)
			console.log('Конвертация завершена: Мура -> Мили')
		}

		fs.writeFileSync(outputFile, outputContent, 'utf-8')
		console.log(`Результат сохранён в файл: ${outputFile}`)

		console.log('')
		console.log('Результат:')
		console.log(outputContent)

	}
	catch (error) {
		console.error('Ошибка:', error instanceof Error
			? error.message
			: error)
		process.exit(1)
	}
}

if (require.main === module) {
	main().catch(console.error)
}
