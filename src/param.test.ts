import { map, isMapping, unwrap, isValue, changes, stream } from "./param";

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

    it("should stream changes", () => {
        let a = 1,
            b = "x";
        const r: { a: number, b: string }[] = [],
            updater = changes(() => a, () => b)((a, b) => {
                r.push({ a, b });
            });
        
        expect(r).toEqual([{ a: 1, b: "x" }]);
        
        updater();
        updater();
        expect(r).toEqual([{ a: 1, b: "x" }]);

        b = "y";
        updater();
        updater();
        expect(r).toEqual([
            { a: 1, b: "x" },
            { a: 1, b: "y" },
        ]);

        a = 2;

        updater();
        expect(r).toEqual([
            { a: 1, b: "x" },
            { a: 1, b: "y" },
            { a: 2, b: "y" },
        ]);

        updater();
        expect(r).toEqual([
            { a: 1, b: "x" },
            { a: 1, b: "y" },
            { a: 2, b: "y" },
        ]);
    });


    it("should stream changes and dispose previous state", () => {
        let a = 1,
            b = "x";
        const r: string[] = [],
            component = stream(() => a, () => b)((a, b) => {
                r.push(`${a}_${b}`);
                return () => r.push(`/${a}_${b}`);
            });
        
        expect(r).toEqual(["1_x"]);

        component.update();
        expect(r).toEqual(["1_x"]);

        a = 2;
        component.update();
        expect(r).toEqual(["1_x", "/1_x", "2_x"]);

        component.update();
        expect(r).toEqual(["1_x", "/1_x", "2_x"]);

        b = "y";
        component.update();
        expect(r).toEqual(["1_x", "/1_x", "2_x", "/2_x", "2_y"]);

        component.dispose();
        expect(r).toEqual(["1_x", "/1_x", "2_x", "/2_x", "2_y", "/2_y"]);
    });
});
