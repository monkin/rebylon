function isPromise<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
    return value !== null && typeof value === "object" && typeof (value as any).then === "function";
}

class ResolvedImmediate<T> implements PromiseLike<T> {
    constructor(private value: T) {}
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        _?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
    ): PromiseLike<TResult1 | TResult2> {
        if (onfulfilled) {
            const value = onfulfilled(this.value);
            if (isPromise(value)) {
                return new Immediate(value);
            } else {
                return new ResolvedImmediate(value);
            }
        } else {
            return this as any;
        }
    }
}

class RejectedImmediate<T> implements PromiseLike<T> {
    constructor(private reason: any) {}
    then<TResult1 = T, TResult2 = never>(
        _?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
    ): PromiseLike<TResult1 | TResult2> {
        if (onrejected) {
            const value = onrejected(this.reason);
            if (isPromise(value)) {
                return new Immediate(value);
            } else {
                return new ResolvedImmediate(value);
            }
        } else {
            return this as any;
        }
    }
}

export class Immediate<T> implements PromiseLike<T> {
    private result: PromiseLike<T> | null = null;

    constructor(private promise: PromiseLike<T>) {
        if (promise instanceof ResolvedImmediate || promise instanceof RejectedImmediate || promise instanceof Immediate) {
            this.result = promise;
        } else {
            promise.then(
                value => {
                    this.result = new ResolvedImmediate(value);
                },
                reason => {
                    this.result = new RejectedImmediate(reason);
                }
            );
        }
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
    ): PromiseLike<TResult1 | TResult2> {
        if (this.result) {
            return this.result.then(onfulfilled, onrejected);
        } else {
            return this.promise.then(onfulfilled, onrejected);
        }
    }

    static resolve<T>(value: T): PromiseLike<T> {
        return new ResolvedImmediate(value);
    }
    static reject<T = any>(reason: any): PromiseLike<T> {
        return new RejectedImmediate<T>(reason);
    }

    static wrap<P extends any[], R>(callback: (...a: P) => PromiseLike<R>): (...a: P) => PromiseLike<R> {
        return (...a: P) => new Immediate(callback(...a));
    }
}