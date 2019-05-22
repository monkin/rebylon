# Rebylon

Reactive programming library designed to use with BabylonJs

## Effects

```typescript
// Effect is just a function withouth arguments
const e1: Effect = () => console.log("test");
const e2: Effect = noop; // Do nothing

// Combine effects. In this case will return e1, because e2 is noop
const e3: Effect = composeEffects(e1, e2);
```

## Parameters

```typescript
// Parameter declaration
const a: Param<number> = 5; // constant parameter
const b: Param<string> = () => Date.now().toFixed(); // variable parameter

// Parameters mapping
const c: Param<[number, string]> = map(a, b)((a: number, b: string) => {
    return [a * 5, b + "_mapped"];
});

// React on parameters change.
// Parameters modification will be checked on each `update` call
const update: Effect = changes(a, b)((a: number, b: string) => {
    console.log("Current parameters:", a, b);
});

// React on parameters change with some disposable state
const disposable: Component = stream(a, b)((a, b) => {
    if (a % 2) {
        const timeout = setTimeout(doSomething, 1000);
        return () => clearTimeout(timeout);
    }
});

// Write some parameters to object fields
const updateFields: Effect = write(myObject, {
    count: a,
    caption: b,
});
```

## Components

Component is just an object with `update` and `dispose` effects.
Minimal component is `{ update: noop, dispose: noop }`.

```typescript
// Some component pseudocode
function exampleComponent(scene, { color, position }: { position: Param<number>, color: Param<Color3> }): Component {
    const sphere = scene.createSphere(1);
    const update = write(sphere, { color, position });
    return {
        update: update,
        dispose: () => sphere.dispose(),
    };
}

// Optionaly append component to the scene
const visible: Param<boolean> = () => !(Date.now() % 2);
const optinalComponent: Component = optional(visible, () => {
    return exampleComponent(scene, { color: someColor, position: somePosition });
}); // component will be created/disposed depending on the `visible` flag

// Combine few components to one
const combined: Component = group(component1, component2, component3);

// Create a list of components
const someList: Param<number[]> = () => [1, 2, 3];
const many: Component = list(
    someList, // array parameter
    (value: number) => value, // key computation function (similar to React's key attribute)
    (value: number) => createMyComponent(scene, value) // function to create a component from the list item
);

// Cache havy calculations or parametrs that can change during updating
const time: Param<number> = () => Date.now();
const items: Param<number[]> = () => range(0, Date.now() % 100);
const cached: Component = cache(time, items)((time, items) => {
    return createMyComponent(
        scene, {
            // cached parameter time won't change during updating of my component and it's children
            time: time,
            // `items` parameter can be used multiple times without performance issues
            size: map(items)(items => items.length * 10),
            values: items
        },
    );
});
```

## Animations

```typescript
// Animated component example
interface AnimatedComponentProps {
    time: Param<number>;
    position: Param<"left" | "right">;
}

function animatedComponent(scene, { time, position }: AnimatedComponentProps): Component {
    const x: Param<number> = map(position)(p => p === "left" ? -1 : 1);
    const animatedX: Param<number> = numberTransition({
        time: time,
        value: x,
        duration: 300,
    });

    return createMyComponent(scene, {
        position: map(animatedX)(x => new Vector3(x, 0, 0)),
    });
}

// Create custom transition
export const vector3Transition = createTransition<Vector3>({
    equals: (a: Vector3, b: Vector3) => a.equals(b), // objects compare function
    mix: (a: Vector3, b: Vector3, t: number) => a.scale(1 - t).add(b.scale(t)), // objects mix function
});
```
