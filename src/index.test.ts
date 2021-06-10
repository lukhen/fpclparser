import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/lib/Option"
import * as A from "fp-ts/lib/Array"
import * as R from "fp-ts/lib/Record"
import {
    Command,
    comm1,
    comm2,
    comm3,
    defaultCommandMetas,
    CommandMetas,
    CommandOption,
    CommandOptionDict,
    xcomm1,
    xcomm2
} from "./command"


function parseArgv(argv: Array<string>, cms: CommandMetas): E.Either<Error, Command> {
    return pipe(
        cms[argv[0]],
        O.fromNullable,
        E.fromOption(() => Error("Invalid command")),
        E.chain(cm => cm.constructor(argv[1], ...A.map(getOpt(argv))(cm.optNames)))
    )
}
type Comm = (name: string, arg: string, opts: CommandOptionDict) => O.Option<E.Either<Error, Command>>

function parseArgv2(argv: Array<string>, comms: Comm[]): O.Option<E.Either<Error, Command>> {
    return pipe(
        comms,
        A.map(comm => comm(argv[0], argv[1], getOptionDict(getAllOptionList(argv)))),
        x => argv[0] == "comm1" ? x[0] : x[1]
    )
}




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


function getAllOptionList(argv: string[]): CommandOption[] {
    return pipe(
        argv,
        A.reduce(
            [],
            (soFar: CommandOption[], nextEl) => pipe(
                nextEl,
                E.fromPredicate(el => el.startsWith("--"), el => el),
                E.fold(
                    el => pipe(
                        soFar,
                        explodeTailTip,
                        ({ body, tailTip }) => O.fold(
                            () => [...body],
                            (co: CommandOption) => [
                                ...body,
                                { ...co, values: A.append(el)(co.values) }
                            ]
                        )(tailTip)
                    ),
                    el => [...soFar, { name: el.slice(2), values: [] }]
                )

            )
        )
    )
}

function explodeTailTip<A>(arr: Array<A>): { body: Array<A>, tailTip: O.Option<A> } {
    return { body: arr.slice(0, arr.length - 1), tailTip: O.fromNullable(arr[arr.length - 1]) }
}


describe("explodeTailTip", () => {
    test("different", () => {
        expect(explodeTailTip([])).toEqual({ body: [], tailTip: O.none })
        expect(explodeTailTip([1])).toEqual({ body: [], tailTip: O.some(1) })
        expect(explodeTailTip([1, 2, 3, 4, 5])).toEqual({ body: [1, 2, 3, 4], tailTip: O.some(5) })
    })
})


function getOptionDict(cos: CommandOption[]): CommandOptionDict {
    return R.fromFoldableMap(
        { concat: (x: string[], y: string[]) => [...x, ...y] },
        A.Foldable
    )(cos, co => [co.name, co.values])
}

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

function getOpt(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => O.fromNullable(getOptionDict(getAllOptionList(argv))[optName])
}

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

