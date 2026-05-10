/**
 * Event Stream - Simple async iterable with end callback
 * Core streaming abstraction for Axiom AI
 */

type EndPredicate = (event: any) => boolean;
type TransformFn = (event: any) => any;

export class EventStream<T, TEnd> {
	private buffer: T[] = [];
	private ended = false;
	private endValue?: TEnd;
	private endError?: Error;
	private resolvers: Array<(iterator: any) => void> = [];

	constructor(
		private readonly endPredicate: EndPredicate,
		private readonly transformFn: TransformFn,
	) {}

	push(event: T): void {
		if (this.ended) return;

		if (this.endPredicate(event)) {
			// Set ended=true so result() can complete - iterator will return after this event
			this.ended = true;
			this.buffer.push(event);
			this.endValue = this.transformFn(event);
			// Resolve waiting iterators
			for (const resolve of this.resolvers) {
				resolve(undefined);
			}
			this.resolvers = [];
		} else {
			this.buffer.push(event);
			// Also resolve waiting iterators when new event arrives
			for (const resolve of this.resolvers) {
				resolve(undefined);
			}
			this.resolvers = [];
		}
	}

	end(value: TEnd): void {
		if (this.ended) return;
		this.endValue = value;
		this.ended = true;
		// Resolve all waiting iterators
		for (const resolve of this.resolvers) {
			resolve(undefined);
		}
		this.resolvers = [];
	}

	error(err: Error): void {
		if (this.ended) return;
		this.endError = err;
		this.ended = true;
	}

	async result(): Promise<TEnd> {
		if (this.endError) throw this.endError;
		if (!this.ended) {
			await new Promise<void>((resolve) => {
				const check = () => {
					if (this.ended) resolve();
					else setTimeout(check, 10);
				};
				check();
			});
		}
		if (this.endError) throw this.endError;
		return this.endValue as TEnd;
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T> {
		let index = 0;
		while (true) {
			if (index < this.buffer.length) {
				const event = this.buffer[index++];
				// If this was the last event (endPredicate triggered), mark ended after yielding
				if (this.ended && index >= this.buffer.length) {
					this.ended = true;
				}
				yield event;
			} else if (this.ended) {
				return;
			} else {
				await new Promise<void>((resolve) => {
					this.resolvers.push(() => resolve());
				});
			}
		}
	}
}

export function createEventStream<T, TEnd>(
	endPredicate: EndPredicate,
	transformFn: TransformFn,
): EventStream<T, TEnd> {
	return new EventStream(endPredicate, transformFn);
}