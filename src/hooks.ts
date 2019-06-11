import { Component } from "./component";
import { Effect, composeEffects } from "./effects";

export function beforeUpdate({ update, dispose }: Component, hook: Effect) {
    return {
        update: composeEffects(hook, update),
        dispose: dispose,
    };
}

export function afterUpdate({ update, dispose }: Component, hook: Effect) {
    return {
        update: composeEffects(update, hook),
        dispose: dispose,
    };
}

export function beforeDispose({ update, dispose }: Component, hook: Effect) {
    return {
        update: update,
        dispose: composeEffects(hook, dispose),
    };
}

export function afterDispose({ update, dispose }: Component, hook: Effect) {
    return {
        update: update,
        dispose: composeEffects(dispose, hook),
    };
}
