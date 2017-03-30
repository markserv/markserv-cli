module.exports = () => {
	const $ops = {}

	const get = name => {
		if (Reflect.has($ops, name)) {
			return $ops[name]
		}

		return false
	}

	const set = (name, value) => {
		const result = $ops[name] = value
		return result
	}

	const remove = name => {
		if (Reflect.has($ops, name)) {
			return delete $ops[name]
		}

		return false
	}

	$ops.get = get
	$ops.set = set
	$ops.remove = remove

	return $ops
}
