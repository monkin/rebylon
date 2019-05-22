import { Param, unwrap, isValue, map } from "./param";

function ease(t: number) {
    return t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;
}

export interface TransitionProps<T> {
    time: Param<number>;
    value: Param<T>;
    initial?: T;
    duration: Param<number>;
    delay?: Param<number>;
    easing?: (t: number) => number;
}

export function createTransition<T>({ equals, mix }: {
    equals(v1: T, v2: T): boolean;
    mix(v1: T, v2: T, position: number): T;
}) {
    return ({
        time,
        value,
        initial = unwrap(value),
        delay = 0,
        duration,
        easing = ease,
    }: TransitionProps<T>): Param<T> => {
        if (isValue(value) && equals(value, initial)) {
            return value;
        } else {
            let source = initial,
                target = unwrap(value),
                changeTime = unwrap(time),
                transitionDelay = unwrap(delay),
                transitionDuration = unwrap(duration);

            const update = () => {
                const newValue = unwrap(value);
                if (!equals(target, newValue)) {
                    source = unwrap(compute);
                    target = newValue;
                    changeTime = unwrap(time);
                    transitionDelay = unwrap(delay);
                    transitionDuration = unwrap(duration);
                }
            };

            const compute = map(time)(time => {
                const transitionTime = time - changeTime;
                if (transitionTime >= transitionDelay + transitionDuration || equals(source, target)) {
                    return target;
                } else if (transitionTime <= transitionDelay) {
                    return source;
                } else {
                    const t = (transitionTime - transitionDelay) / transitionDuration;
                    return mix(source, target, easing(t));
                }
            });

            return () => {
                update();
                return unwrap(compute);
            }
        }
    }
}

export const numberTransition = createTransition<number>({
    equals: (a, b) => a === b,
    mix: (a, b, t) => a * (1 - t) + b * t,
});
