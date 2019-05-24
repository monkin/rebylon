import { noop, Effect, composeEffects } from "./effects";
import { Component } from "./component";

/**
 * Constant parameter or parameter that can be changed from time to time
 */
export type Param<T> = (() => T) | T;

type Unwrap<T> = T extends () => infer R ? R : T;
type UnwrapList<T extends Param<any>[]> =
    T extends [any, any, any, any, any, any] ? [Unwrap<T[0]>, Unwrap<T[1]>, Unwrap<T[2]>, Unwrap<T[3]>, Unwrap<T[4]>, Unwrap<T[5]>] :
    T extends [any, any, any, any, any] ? [Unwrap<T[0]>, Unwrap<T[1]>, Unwrap<T[2]>, Unwrap<T[3]>, Unwrap<T[4]>] :
    T extends [any, any, any, any] ? [Unwrap<T[0]>, Unwrap<T[1]>, Unwrap<T[2]>, Unwrap<T[3]>] :
    T extends [any, any, any] ? [Unwrap<T[0]>, Unwrap<T[1]>, Unwrap<T[2]>] :
    T extends [any, any] ? [Unwrap<T[0]>, Unwrap<T[1]>] :
    T extends [any] ? [Unwrap<T[0]>] : [];

/**
 * Is constant parameter
 */
export function isValue<T>(v: Param<T>): v is T {
    return !(v instanceof Function);
}

/**
 * Is variable parameter
 */
export function isMapping<T>(v: Param<T>): v is () => T {
    return (v instanceof Function);
}

/**
 * Returns the current value of the parameter
 */
export function unwrap<T>(v: Param<T>) {
    return isValue(v) ? v : v();
}

/**
 * Map set of parameters to a new parameter
 */
export function map<P extends Param<any>[]>(...input: P) {
    if (input.every(v => isValue(v))) {
        return <T>(mapping: (...params: UnwrapList<P>) => T): Param<T> => {
            return mapping(...(input as any));
        }
    } else {
        return <T>(mapping: (...params: UnwrapList<P>) => T): Param<T> => {
            return () => mapping(...(input.map(unwrap) as any));
        }
    }
}

/**
 * Pass changes of parameters to a function.
 * @returns Updater function that looks for parameter changes.
 */
export function changes<P extends Param<any>[]>(...input: P) {
    if (input.every(v => isValue(v))) {
        return (mapping: (...params: UnwrapList<P>) => void | Effect): Effect => {
            mapping(...(input as any));
            return noop;
        }
    } else {
        return (mapping: (...params: UnwrapList<P>) => void | Effect): Effect => {
            let values = input.map(unwrap) as any;
            mapping(...values);
            return () => {
                const newValues = input.map(unwrap);
                if (newValues.some((v, i) => v !== values[i])) {
                    values = newValues;
                    mapping(...values);
                }
            };
        }
    }
}

/**
 * The same as `changes`, but the effect can have some disposable data.
 * See also ReactJS `useEffect` hook.
 */
export function stream<P extends Param<any>[]>(...input: P) {
    if (input.every(v => isValue(v))) {
        return (mapping: (...params: UnwrapList<P>) => void | Effect): Component => {
            const dispose = mapping(...(input as any));
            return {
                update: noop,
                dispose: dispose || noop
            };
        }
    } else {
        return (mapping: (...params: UnwrapList<P>) => void | Effect): Component => {
            let values = input.map(unwrap) as any,
                dispose = mapping(...values);
            return {
                update() {
                    const newValues = input.map(unwrap);
                    if (newValues.some((v, i) => v !== values[i])) {
                        dispose && dispose();
                        values = newValues;
                        dispose = mapping(...values);
                    }
                },
                dispose() {
                    dispose && dispose();
                }
            };
        }
    }
}

type ParamMap<T> = {
    [key in keyof T]?: Param<T[key]>;
};

/**
 * Returns a function that writes parametrs map to the coresponding fields of the target
 */
export function write<T>(target: T, props: ParamMap<T>): Effect {
    const updaters: Effect[] = [];
    for (let i in props) {
        ((i) => {
            updaters.push(changes(props[i])((value: any) => {
                target[i] = value;
            }));
        })(i);
    }
    return composeEffects(...updaters);
}
