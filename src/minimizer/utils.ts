function createStateMapping(partitions: string[][]): Map<string, string> {
	const stateMapping = new Map<string, string>()

	partitions.forEach(partition => {
		const newStateName = partition[0]
		partition.forEach(oldStateName => {
			stateMapping.set(oldStateName, newStateName)
		})
	})

	return stateMapping
}

export {createStateMapping}

