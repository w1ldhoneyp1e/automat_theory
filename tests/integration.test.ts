import {mealyToMoore, mooreToMealy} from '../src/converter'
import {generateMealyDot, generateMooreDot} from '../src/generator'
import {detectMachineType, parse} from '../src/parser'

describe('Интеграционные тесты', () => {
	it('должен корректно конвертировать автомат Мили в автомат Мура', () => {
		const mealyInput = `digraph machine {
                S1 [label = "S1"]
                S2 [label = "S2"]
                S3 [label = "S3"]
                S4 [label = "S4"]

                S1 -> S3 [label = "1/w1"]
                S1 -> S2 [label = "2/w1"]
                S2 -> S3 [label = "1/w2"]
                S3 -> S4 [label = "1/w2"]
            }`

		const dotGraph = parse(mealyInput)
		expect(detectMachineType(dotGraph)).toBe('mealy')

		const mooreMachine = mealyToMoore(dotGraph)
		const mooreOutput = generateMooreDot(mooreMachine)

		expect(mooreOutput).toContain('digraph MooreMachine {')
		expect(mooreOutput).toContain('S3_w1 [label="S3_w1 / w1"]')
		expect(mooreOutput).toContain('S2_w1 [label="S2_w1 / w1"]')
		expect(mooreOutput).toContain('S3_w2 [label="S3_w2 / w2"]')
		expect(mooreOutput).toContain('S4_w2 [label="S4_w2 / w2"]')
		expect(mooreOutput).toContain('S1_w1 -> S3_w1 [label="1"]')
		expect(mooreOutput).toContain('S1_w1 -> S2_w1 [label="2"]')
		expect(mooreOutput).toContain('S2_w2 -> S3_w2 [label="1"]')
		expect(mooreOutput).toContain('S3_w2 -> S4_w2 [label="1"]')
	})

	it('должен корректно конвертировать автомат Мура в автомат Мили', () => {
		const mooreInput = `digraph MooreMachine {
                S2_w1 [label="S2_w1 / w1"];
                S3_w1 [label="S3_w1 / w1"];
                S3_w2 [label="S3_w2 / w2"];
                S4_w2 [label="S4_w2 / w2"];
                S1_w1 -> S3_w1 [label="1"];
                S1_w1 -> S2_w1 [label="2"];
                S2_w1 -> S3_w2 [label="1"];
                S3_w1 -> S4_w2 [label="1"];
            }`

		const dotGraph = parse(mooreInput)
		expect(detectMachineType(dotGraph)).toBe('moore')

		const mealyMachine = mooreToMealy(dotGraph)
		const mealyOutput = generateMealyDot(mealyMachine)

		expect(mealyOutput).toContain('digraph MealyMachine {')
		expect(mealyOutput).toContain('S2_w1 [label="S2_w1"]')
		expect(mealyOutput).toContain('S3_w1 [label="S3_w1"]')
		expect(mealyOutput).toContain('S3_w2 [label="S3_w2"]')
		expect(mealyOutput).toContain('S4_w2 [label="S4_w2"]')
		expect(mealyOutput).toContain('S1_w1 -> S3_w1 [label="1/w1"]')
		expect(mealyOutput).toContain('S1_w1 -> S2_w1 [label="2/w1"]')
		expect(mealyOutput).toContain('S2_w1 -> S3_w2 [label="1/w2"]')
		expect(mealyOutput).toContain('S3_w1 -> S4_w2 [label="1/w2"]')
	})
})
