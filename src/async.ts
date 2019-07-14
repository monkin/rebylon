import { Component } from "./component";
import { noop } from "./effects";

export function asyncComponent(component: PromiseLike<Component>): Component {
    let disposed = false,
        update = noop,
        dispose = () => {
            disposed = true;
        };
    
    component.then(component => {
        if (!disposed) {
            update = component.update;
            dispose = component.dispose;
        } else {
            component.dispose();
        }
    });
    
    return {
        update: () => update(),
        dispose: () => dispose()
    };
}

export function asyncContrucor<PropsType extends any[]>(constructor: (...props: PropsType) => PromiseLike<Component>) {
    return (...props: PropsType): Component => {
        return asyncComponent(constructor(...props));
    };
}
