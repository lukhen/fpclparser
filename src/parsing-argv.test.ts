import { parseArgv2 } from "./fpclparser"

describe("", () => {
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


})
