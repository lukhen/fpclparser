import * as E from "fp-ts/lib/Either"
import * as O from "fp-ts/lib/Option"
import {
    comm1_,
    comm2_
} from "./command.test"
import { getOptionDict, getAllOptionList, explodeTailTip, getOpt, parseArgv } from "./fpclparser"


describe("parseArgv_", () => {
    test("Command 1 from xcomm1 constructor", () => {
        expect(parseArgv([comm1_])(["comm1", "arg1", "--o1", "Łukasz", "--o2", "Hen"])).toEqual(comm1_([
            "comm1",
            ["arg1"],
            getOptionDict(getAllOptionList(["comm1", "arg1", "--o1", "Łukasz", "--o2", "Hen"]))
        ]
        ))
    })

    test("Command2 from xcomm2 constructor", () => {
        expect(parseArgv([comm1_, comm2_])(["comm2", "arg1", "--o3", "value1", "--o4", "value2"]))
            .toEqual(comm2_([
                "comm2",
                ["arg1"],
                getOptionDict(getAllOptionList(["comm2", "arg1", "--o3", "value1", "--o4", "value2"]))
            ]))
    })

    test("Bad command", () => {
        expect(E.isLeft(parseArgv([comm1_, comm2_])(["badcommand ", "arg1", "--o1", "value1", "--o2", "value2"])))
            .toBeTruthy()
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

