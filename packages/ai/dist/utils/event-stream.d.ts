/**
 * Event Stream - Simple async iterable with end callback
 * Core streaming abstraction for Axiom AI
 */
type EndPredicate = (event: any) => boolean;
type TransformFn = (event: any) => any;
export declare class EventStream<T, TEnd> {
    private readonly endPredicate;
    private readonly transformFn;
    private buffer;
    private ended;
    private endValue?;
    private endError?;
    private resolvers;
    constructor(endPredicate: EndPredicate, transformFn: TransformFn);
    push(event: T): void;
    end(value: TEnd): void;
    error(err: Error): void;
    result(): Promise<TEnd>;
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
export declare function createEventStream<T, TEnd>(endPredicate: EndPredicate, transformFn: TransformFn): EventStream<T, TEnd>;
export {};
//# sourceMappingURL=event-stream.d.ts.map