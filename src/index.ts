import * as fs from 'fs'
import * as path from 'path'
import {mealyToMoore, mooreToMealy} from './converter'
import {generateMealyDot, generateMooreDot} from './generator'
import {minimizeMealy} from './minimizer/mealy'
import {minimizeMoore} from './minimizer/moore'
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
	const shouldMinimize = args.includes('--minimize') || args.includes('-m')
	const outputFile = args.find(arg => !arg.startsWith('-') && arg !== inputFile) || generateOutputFileName(inputFile)

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
			let mooreMachine = mealyToMoore(dotGraph)

			if (shouldMinimize) {
				console.log('Минимизируем автомат Мура...')
				mooreMachine = minimizeMoore(mooreMachine)
				console.log('Минимизация завершена')
			}

			outputContent = generateMooreDot(mooreMachine)
			console.log('Конвертация завершена: Мили -> Мура')
		}
		else {
			console.log('Конвертируем из Мура в Мили...')
			let mealyMachine = mooreToMealy(dotGraph)

			if (shouldMinimize) {
				console.log('Минимизируем автомат Мили...')
				mealyMachine = minimizeMealy(mealyMachine)
				console.log('Минимизация завершена')
			}

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
