import { Component } from "./component";
import { Param } from "./param";

export function state<T>(initial: T, child: (param: Param<T>, setter: (value: T) => void) => Component) {
    let value = initial;
    return child(() => value, v => value = v);
}