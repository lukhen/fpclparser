import * as E from "fp-ts/lib/Either"
import * as O from "fp-ts/lib/Option"
import {
    comm1,
    comm2,
    comm3,
    defaultCommandMetas,
    xcomm1,
    xcomm2
} from "./command"
import { parseArgv2, getOptionDict, getAllOptionList, parseArgv, explodeTailTip, getOpt } from "./fpclparser"


describe("parseArgv2", () => {
    test("Command 1 from xcomm1 constructor", () => {
        expect(parseArgv2(["comm1", "arg1", "--o1", "Łukasz", "--o2", "Hen"],
            [xcomm1])).toEqual(xcomm1(
                "comm1",
                "arg1",
                getOptionDict(getAllOptionList(["comm1", "arg1", "--o1", "Łukasz", "--o2", "Hen"]))
            ))
    })

    test("Command2 from xcomm2 constructor", () => {
        expect(parseArgv2(["comm2", "arg1", "--o3", "value1", "--o4", "value2"],
            [xcomm1, xcomm2])).toEqual(xcomm2(
                "comm2",
                "arg1",
                getOptionDict(getAllOptionList(["comm2", "arg1", "--o3", "value1", "--o4", "value2"]))
            ))
    })

    test("Bad command", () => {
        expect(parseArgv2(["badcommand ", "arg1", "--o1", "value1", "--o2", "value2"],
            [xcomm1, xcomm2])).toEqual(O.none)
    })


})


describe("comm1", () => {
    test("all options", () => {
        const expectedCommand = comm1("lukh", O.some(["someoption1"]), O.some(["someoption2"]))
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1", "--o2", "someoption2"], defaultCommandMetas))
            .toEqual(expectedCommand)
    })

    test("options in different order", () => {
        const expectedCommand = comm1("arg2", O.some(["someoption11"]), O.some(["someoption22"]))
        expect(parseArgv(["comm1", "arg2", "--o2", "someoption22", "--o1", "someoption11"], defaultCommandMetas))
            .toEqual(expectedCommand)
    })
    test("missing option o2", () => {
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1"], defaultCommandMetas))
            .toEqual(E.left(Error("Option missing")))
    })

    test("missing option o1", () => {
        expect(parseArgv(["comm1", "lukh", "--o2", "someoption2"], defaultCommandMetas))
            .toEqual(E.left(Error("Option missing")))
    })
})

describe("comm2", () => {
    test("all options", () => {
        const expectedCommand = comm2("lukh", O.some(["someoption3"]), O.some(["someoption4"]))
        const actualCommand = parseArgv(["comm2", "lukh", "--o3", "someoption3", "--o4", "someoption4"], defaultCommandMetas)
        expect(actualCommand)
            .toEqual(expectedCommand)
    })

    test("options in different order", () => {
        const expectedCommand = comm2("arg2", O.some(["someoption11"]), O.some(["someoption22"]))
        expect(parseArgv(["comm2", "arg2", "--o4", "someoption22", "--o3", "someoption11"], defaultCommandMetas))
            .toEqual(expectedCommand)
    })
    test("missing option o4", () => {
        expect(parseArgv(["comm2", "lukh", "--o3", "someoption1"], defaultCommandMetas))
            .toEqual(E.left(Error("Option missing")))
    })

    test("missing option o3", () => {
        expect(parseArgv(["comm2", "lukh", "--o4", "someoption2"], defaultCommandMetas))
            .toEqual(E.left(Error("Option missing")))
    })
})

describe("wrong command", () => {
    test("should produce E.left(error)", () => {
        expect(parseArgv(["wrongcomm", "lukh", "--o1", "someoption1", "--o2", "someoption2"], defaultCommandMetas))
            .toEqual(E.left(Error("Invalid command")))
    })
})


describe("comm3, optional option", () => {
    test("optional option present", () => {
        const expectedCommand = comm3("somearg", O.some(["required"]), O.some(["optional"]))
        const actualCommand = parseArgv(["comm3", "somearg", "--req", "required", "--opt", "optional"], defaultCommandMetas)
        expect(actualCommand)
            .toEqual(expectedCommand)
    })

    test("optional option missing", () => {
        const expectedCommand = comm3("somearg", O.some(["required"]), O.none)
        const actualCommand = parseArgv(["comm3", "somearg", "--req", "required"], defaultCommandMetas)
        expect(actualCommand)
            .toEqual(expectedCommand)
    })

    test("optional option present, required option missing", () => {
        const actualCommand = parseArgv(["comm3", "somearg", "--opt", "optional"], defaultCommandMetas)
        expect(actualCommand)
            .toEqual(E.left(Error("Option missing")))
    })
})



describe("explodeTailTip", () => {
    test("different", () => {
        expect(explodeTailTip([])).toEqual({ body: [], tailTip: O.none })
        expect(explodeTailTip([1])).toEqual({ body: [], tailTip: O.some(1) })
        expect(explodeTailTip([1, 2, 3, 4, 5])).toEqual({ body: [1, 2, 3, 4], tailTip: O.some(5) })
    })
})

describe("getOptionsDict", () => {
    test("empty CommandOpion list", () => {
        expect(getOptionDict([])).toEqual({})
    })

    test("CommandOpion list with one flag option", () => {
        expect(getOptionDict([{ name: "o1", values: [] }])).toEqual({ o1: [] })
    })

    test("CommandOpion list with one option with 2 values", () => {
        expect(getOptionDict([{ name: "o1", values: ["value1", "value2"] }]))
            .toEqual({ o1: ["value1", "value2"] })
    })

    test("CommandOpion list with multiple different options.", () => {
        expect(getOptionDict([{ name: "o1", values: ["value1", "value2"] },
        { name: "o2", values: [] },
        { name: "o3", values: ["value3", "value4", "value5"] }]))
            .toEqual({ o1: ["value1", "value2"], o2: [], o3: ["value3", "value4", "value5"] })
    })

    test("CommandOpion list with multiple options, 2 options with equal names.", () => {
        expect(getOptionDict([{ name: "o1", values: ["value1", "value2"] },
        { name: "o2", values: [] },
        { name: "o1", values: ["value3", "value4", "value5"] }]))
            .toEqual({ o1: ["value1", "value2", "value3", "value4", "value5"], o2: [] })
    })
})

describe("getAllOptionList", () => {
    test("empty", () => {
        expect(getAllOptionList([])).toEqual([])
    })

    test("one flag option", () => {
        expect(getAllOptionList(["--o1"])).toEqual([{ name: "o1", values: [] }])
    })

    test("two flag options", () => {
        expect(getAllOptionList(["--o1", "--o2"]))
            .toEqual([{ name: "o1", values: [] }, { name: "o2", values: [] }])
    })

    test("five flag options", () => {
        expect(getAllOptionList(["--o1", "--o2", "--o3", "--o4", "--o5"]))
            .toEqual([{ name: "o1", values: [] },
            { name: "o2", values: [] },
            { name: "o3", values: [] },
            { name: "o4", values: [] },
            { name: "o5", values: [] }])
    })

    test("one option with single value", () => {
        expect(getAllOptionList(["--o1", "value"]))
            .toEqual([{ name: "o1", values: ["value"] }])
    })

    test("one option with 2 values", () => {
        expect(getAllOptionList(["--o1", "value1", "value2"]))
            .toEqual([{ name: "o1", values: ["value1", "value2"] }])
    })

    test("one option with many values", () => {
        expect(getAllOptionList(["--o1", "value1", "value2", "value3", "value4", "value5"]))
            .toEqual([{ name: "o1", values: ["value1", "value2", "value3", "value4", "value5"] }])
    })

    test("2 options with single values", () => {
        expect(getAllOptionList(["--o1", "value1", "--o2", "value2"]))
            .toEqual([{ name: "o1", values: ["value1"] }, { name: "o2", values: ["value2"] }])
    })

    test("Multiple options with multiple values and flag values", () => {
        expect(getAllOptionList([
            "--o1", "value1", "value2", "value3", "value4",
            "--o2", "value5", "value6", "value7",
            "--o3", "value8", "value9", "value10",
            "--o4",
            "--o5", "value11", "value12", "value13",

        ]))
            .toEqual([
                {
                    name: "o1", values: ["value1", "value2", "value3", "value4"]
                }, {
                    name: "o2", values: ["value5", "value6", "value7"]
                }, {
                    name: "o3", values: ["value8", "value9", "value10"]
                }, {
                    name: "o4", values: []
                }, {
                    name: "o5", values: ["value11", "value12", "value13"]
                }])
    })
    test("no option at the begginning", () => {
        expect(getAllOptionList(["value1", "--o1", "value1"]))
            .toEqual([{ name: "o1", values: ["value1"] }])
    })
})

describe("getOpt", () => {
    test("single option, option string only", () => {
        expect(getOpt(["--o1", "val1"])("o1")).toEqual(
            O.fromNullable(getOptionDict(getAllOptionList(["--o1", "val1"]))["o1"]))
    })
})

