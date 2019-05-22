export type Effect = () => void;

/**
 * Do nothing
 */
export function noop() {}

/**
 * Return function that runs all the effects sequentialy, ignores `noop` operations
 */
export function composeEffects(...effects: Effect[]): Effect {
    const filtered = effects.filter(e => e !== noop);
    if (filtered.length === 0) {
        return noop;
    } else if (filtered.length === 1) {
        return filtered[0];
    } else {
        return () => filtered.forEach(v => v());
    }
}
