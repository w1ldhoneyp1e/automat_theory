import * as fs from 'fs'
import * as path from 'path'
import {detectMachineType, parse} from './parser'
import {processAsIs, processConversion} from './processor'

function generateOutputFileName(inputFile: string): string {
	const ext = path.extname(inputFile)
	const baseName = path.basename(inputFile, ext)
	const dir = path.dirname(inputFile)
	return path.join(dir, `${baseName}_converted${ext}`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const inputFile = args[0]
	const shouldConvert = args.includes('-c')
	const shouldMinimize = args.includes('--minimize') || args.includes('-m')
	const outputFile = args.find(arg => !arg.startsWith('-') && arg !== inputFile) || generateOutputFileName(inputFile)

	try {
		const inputContent = fs.readFileSync(inputFile, 'utf-8')
		const dotGraph = parse(inputContent)
		const machineType = detectMachineType(dotGraph)
		const outputContent = shouldConvert
			? processConversion(dotGraph, machineType, shouldMinimize)
			: processAsIs(inputContent)

		fs.writeFileSync(outputFile, outputContent, 'utf-8')
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
