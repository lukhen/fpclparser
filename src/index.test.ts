import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/lib/Option"
import { sequenceT } from "fp-ts/lib/Apply"
import * as A from "fp-ts/lib/Array"
import { } from "fp-ts/lib/Record"

interface Command1 {
    _tag: "comm1",
    arg: string
    o1: string,
    o2: string
}

// constructor
function comm1(arg: string, o1: O.Option<Array<string>>, o2: O.Option<Array<string>>): E.Either<Error, Command1> {
    return pipe(
        sequenceT(O.option)(o1, o2),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<Array<string>>) => E.right({
                _tag: "comm1",
                arg,
                o1: x[0][0],
                o2: x[1][0]
            })
        )
    )
}

interface Command2 {
    _tag: "comm2",
    arg: string,
    o3: string,
    o4: string
}

// constructor
function comm2(arg: string, o3: O.Option<Array<string>>, o4: O.Option<Array<string>>): E.Either<Error, Command2> {
    return pipe(
        sequenceT(O.option)(o3, o4),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<Array<string>>) => E.right({
                _tag: "comm2",
                arg,
                o3: x[0][0],
                o4: x[1][0]
            })
        )
    )
}

interface Command3 {
    _tag: "comm3",
    arg: string,
    req: string,
    opt: O.Option<Array<string>>
}

// constructor
function comm3(arg: string, req: O.Option<Array<string>>, opt: O.Option<Array<string>>): E.Either<Error, Command3> {
    return pipe(
        req,
        O.fold(
            () => E.left(Error("Option missing")),
            (value: Array<string>) => E.right({
                _tag: "comm3",
                arg,
                req: value[0],
                opt: opt
            })
        )
    )
}

function getOpt(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => pipe(
        argv.findIndex(el => el == `--${optName}`),
        i => i == -1 ? O.none : O.some([argv[i + 1]])
    )
}

type CommandMetas = {
    [key: string]: {
        constructor: (arg: string, ...opts: Array<O.Option<Array<string>>>) => E.Either<Error, Command1 | Command2 | Command3>,
        optNames: Array<string>
    }
}

const defaultCommandMetas: CommandMetas = {
    comm1: { constructor: comm1, optNames: ["o1", "o2"] },
    comm2: { constructor: comm2, optNames: ["o3", "o4"] },
    comm3: { constructor: comm3, optNames: ["req", "opt"] },
}

function parseArgv(argv: Array<string>, cms: CommandMetas): E.Either<Error, Command1 | Command2 | Command3> {
    return pipe(
        cms[argv[0]],
        O.fromNullable,
        E.fromOption(() => Error("Invalid command")),
        E.chain(cm => cm.constructor(argv[1], ...A.map(getOpt(argv))(cm.optNames)))
    )
}

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


function getOpt2(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => pipe(
        argv,
        A.reduce(
            O.none,
            (b: O.Option<string[]>, a) => {
                return pipe(
                    b,
                    O.fold(
                        () => pipe(
                            a,
                            O.fromPredicate(el => el == `--${optName}`),
                            O.map(() => [])
                        ),
                        y => O.some(y.length < 1 ? y.concat(a) : y)
                    )
                )
            }
        )
    )
}

describe("getOpt2", () => {
    test("single option, option string only", () => {
        expect(getOpt2(["--o1", "val1"])("o1")).toEqual(O.some(["val1"]))
    })
    test("single option, option string in the middle of other elements", () => {
        expect(getOpt2(["", "--o1", "val1", ""])("o1")).toEqual(O.some(["val1"]))
    })
    test("single option, option missing ", () => {
        expect(getOpt2(["", "--o2", "val1", ""])("o1")).toEqual(O.none)
    })
})


type OptionList = { name: string, values: string[] }[]
type OptionDict = { [optName: string]: string[] }

// !!! wish
function getAllOptionList(argv: string[]): OptionList {
    return pipe(
        argv,
        A.reduce(
            [],
            (b: OptionList, a) => [...b, { name: a.slice(2), values: [] }]
        )
    )
}
// !!! wish
function getOptions(q: OptionList): OptionDict {
    return {}
}

function getOpt3(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => O.fromNullable(getOptions(getAllOptionList(argv))[optName])
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


})

describe("getOpt3", () => {
    test("single option, option string only", () => {
        expect(getOpt3(["--o1", "val1"])("o1")).toEqual(
            O.fromNullable(getOptions(getAllOptionList(["--o1", "val1"]))["o1"]))
    })
})


