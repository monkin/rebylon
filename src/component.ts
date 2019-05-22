import { Effect, composeEffects } from "./effects";
import { Param, stream, changes, isValue } from "./param";

export interface Component {
    update: Effect;
    dispose: Effect;
}

export function optional(flag: Param<boolean>, createComponent: () => Component): Component {
    let component: Component | null;
    const updater = stream(flag)(isVisible => {
        if (isVisible) {
            component = createComponent();
            return () => {
                if (component) {
                    component.dispose();
                    component = null;
                }
            };
        }
    });

    return group(updater, {
        update: () => component && component.update(),
        dispose: () => component && component.dispose(),
    });
}

export function list<T>(items: Param<T[]>, key: (v: T, i: number) => string | number, createComponent: (item: Param<T>) => Component): Component {
    const children = new Map<string | number, Component>(),
        values = new Map<string | number, T>();

    const update = changes(items)(items => {
        const keys = new Set<string | number>();
        items.forEach((v, i) => {
            const k = key(v, i);
            keys.add(k);
            
            values.set(k, v);

            if (!children.has(k)) {
                children.set(k, createComponent(() => {
                    return values.get(k)!;
                }))
            }
        });
        
        Array.from(children.keys()).forEach(k => {
            if (!keys.has(k)) {
                children.get(k)!.dispose();
                children.delete(k);
                values.delete(k);
            }
        });
    });

    return {
        dispose: () => children.forEach((component: Component) => component.dispose()),
        update: composeEffects(update, () => {
            children.forEach((component: Component) => component.update());
        }),
    };
}

export function group(...components: Component[]): Component {
    return {
        update: composeEffects(...components.map(c => c.update)),
        dispose: composeEffects(...components.map(c => c.dispose)),
    };
}

export function cache<P extends Param<any>[]>(...input: P) {
    const values: any[] = [],
        params = input.map((v, i) => isValue(v) ? v : (() => values[i])) as P,
        update = composeEffects(...input.map((v: any, i: number) => changes(v)(v => values[i] = v)));

    return (mapping: (...params: P) => Component): Component => {
        const child = mapping(...params);
        return {
            update: composeEffects(update, child.update),
            dispose: child.dispose,
        };
    };
}
