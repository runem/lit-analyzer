export function mapMerge<K, T>(...maps: (Map<K, T> | Map<K, T>[])[]): Map<K, T> {
	return new Map(
		(function*() {
			for (const map of maps) {
				if (Array.isArray(map)) {
					for (const m of map) {
						yield* m;
					}
				} else {
					yield* map;
				}
			}
		})()
	);
}

export function mapMap<K, T, U>(map: Map<K, T>, callback: (key: K, val: T) => U): Map<K, U> {
	return new Map(
		(function*() {
			for (const [key, val] of map.entries()) {
				yield [key, callback(key, val)] as [K, U];
			}
		})()
	);
}

export function arrayToMap<K, T>(array: T[], callback: (val: T) => K): Map<K, T> {
	return new Map(
		(function*() {
			for (const val of array) {
				yield [callback(val), val] as [K, T];
			}
		})()
	);
}
