import * as fs from 'fs'
import { Parser } from './Parser'
import { Vm } from './Vm'

function main(): void
{
	const args = process.argv.slice(2)
	let source: string

	if (args.length > 0)
	{
		source = fs.readFileSync(args[0], 'utf-8')
	}
	else
	{
		source = fs.readFileSync('/dev/stdin', 'utf-8')
	}

	const parser = new Parser()
	const code = parser.parseBytecode(source)

	const vm = new Vm()
	vm.load(code)

	const result = vm.run()
	console.log(result)
}

main()
