import { composeEffects, noop } from "./effects"

describe("Effect", () => {
    it("should compose multiple noops to a sinle one", () => {
        const effect = composeEffects(noop, noop, noop);
        expect(effect).toBe(noop);
    });

    it("should compose noops and function to a function", () => {
        const f = () => {},
            effect = composeEffects(noop, f, noop);
        expect(effect).toBe(f);
    });

    it("should compose multiple effects to a single one", () => {
        const r: number[] = [],
            f1 = () => r.push(1),
            f2 = () => r.push(2),
            effect = composeEffects(f1, f2);
        
        expect(effect).toBeInstanceOf(Function);

        effect();
        expect(r).toEqual([1, 2]);
    });
});