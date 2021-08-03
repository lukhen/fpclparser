import { parseArgv2 } from "./fpclparser"

describe("parseArgv2", () => {
    test("empty argv", () => {
        expect(parseArgv2([])).toEqual(["", [], {}])
    })

    test("just name", () => {
        expect(parseArgv2(["comm1"])).toEqual(["comm1", [], {}])
    })

    test("name, arg", () => {
        expect(parseArgv2(["comm1", "arg"])).toEqual(["comm1", ["arg"], {}])
    })

    test("name, arg1, arg2", () => {
        expect(parseArgv2(["comm1", "arg1", "arg2"])).toEqual(["comm1", ["arg1", "arg2"], {}])
    })

    test("name, arg1, arg2, opt1, opt2", () => {
        expect(parseArgv2(["comm1", "arg1", "arg2", "--opt1", "val1", "--opt2", "val2"]))
            .toEqual(["comm1", ["arg1", "arg2"], { opt1: ["val1"], opt2: ["val2"] }])
    })


})
