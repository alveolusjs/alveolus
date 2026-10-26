export class Lines {
	private readonly starts: number[] = [0];

	public constructor(text: string) {
		for (let index = 0; index < text.length; index++) {
			if (text[index] === '\n') {
				this.starts.push(index + 1);
			}
		}
	}

	public at(offset: number): number {
		let low = 0;
		let high = this.starts.length - 1;

		while (low < high) {
			const middle = Math.ceil((low + high) / 2);

			if ((this.starts[middle] ?? 0) <= offset) {
				low = middle;
			} else {
				high = middle - 1;
			}
		}

		return low + 1;
	}
}
