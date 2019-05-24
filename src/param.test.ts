import { map, isMapping, unwrap, isValue } from "./param";

describe("Param", () => {
    it("should destinguish values and mappings", () => {
        expect(isValue(5)).toBe(true);
        expect(isValue({ test: 1 })).toBe(true);
        expect(isValue(() => 5)).toBe(false);
        
        expect(isMapping(1)).toBe(false);
        expect(isMapping("1")).toBe(false);
        expect(isMapping(() => 1)).toBe(true);
    });

    it("should be correctly unwrapped", () => {
        expect(unwrap(5)).toBe(5);
        expect(unwrap("test")).toBe("test");
        expect(unwrap(() => 5)).toBe(5);
        expect(unwrap(() => "test")).toBe("test");
    });

    it("should map values to a simple value", () => {
        expect(map(5)(v => v * 2)).toBe(10);
        expect(map(7, "test")((a, b) => a + b)).toBe("7test");
    });

    it("should map functions to function", () => {
        const m1 = map(() => 2, () => 9)((a, b) => a * b);
        expect(isMapping(m1)).toBe(true);
        expect(unwrap(m1)).toBe(18);

        const m2 = map(2, () => 3, () => "_test")((a, b, c) => (a * b) + c);
        expect(isMapping(m2)).toBe(true);
        expect(unwrap(m2)).toBe("6_test");
    });
});
