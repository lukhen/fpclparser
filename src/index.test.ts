import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/lib/Option"
import { sequenceT } from "fp-ts/lib/Apply"
import * as A from "fp-ts/lib/Array"

interface Command1 {
    _tag: "comm1",
    arg: string
    o1: string,
    o2: string
}

// constructor
function comm1(arg: string, o1: O.Option<string>, o2: O.Option<string>): E.Either<Error, Command1> {
    return pipe(
        sequenceT(O.option)(o1, o2),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<string>) => E.right({
                _tag: "comm1",
                arg,
                o1: x[0],
                o2: x[1]
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
function comm2(arg: string, o3: O.Option<string>, o4: O.Option<string>): E.Either<Error, Command2> {
    return pipe(
        sequenceT(O.option)(o3, o4),
        O.fold(
            () => E.left(Error("Option missing")),
            (x: Array<string>) => E.right({
                _tag: "comm2",
                arg,
                o3: x[0],
                o4: x[1]
            })
        )
    )
}

function getOpt(argv: string[], optName: string): O.Option<string> {
    return pipe(
        argv.findIndex(el => el == `--${optName}`),
        i => i == -1 ? O.none : O.some(argv[i + 1])
    )
}

function parseArgv(argv: Array<string>): E.Either<Error, Command1 | Command2> {
    return argv[0] == "comm1"
        ? comm1(argv[1], getOpt(argv, "o1"), getOpt(argv, "o2"))
        : comm2(argv[1], getOpt(argv, "o3"), getOpt(argv, "o4"))

}

describe("comm1", () => {
    test("all options", () => {
        const expectedCommand = comm1("lukh", O.some("someoption1"), O.some("someoption2"))
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1", "--o2", "someoption2"]))
            .toEqual(expectedCommand)
    })

    test("options in different order", () => {
        const expectedCommand = comm1("arg2", O.some("someoption11"), O.some("someoption22"))
        expect(parseArgv(["comm1", "arg2", "--o2", "someoption22", "--o1", "someoption11"]))
            .toEqual(expectedCommand)
    })
    test("missing option o2", () => {
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1"]))
            .toEqual(E.left(Error("Option missing")))
    })

    test("missing option o1", () => {
        expect(parseArgv(["comm1", "lukh", "--o2", "someoption2"]))
            .toEqual(E.left(Error("Option missing")))
    })
})

describe("comm2", () => {
    test("all options", () => {
        const expectedCommand = comm2("lukh", O.some("someoption3"), O.some("someoption4"))
        const actualCommand = parseArgv(["comm2", "lukh", "--o3", "someoption3", "--o4", "someoption4"])
        expect(actualCommand)
            .toEqual(expectedCommand)
    })

    test("options in different order", () => {
        const expectedCommand = comm2("arg2", O.some("someoption11"), O.some("someoption22"))
        expect(parseArgv(["comm2", "arg2", "--o4", "someoption22", "--o3", "someoption11"]))
            .toEqual(expectedCommand)
    })
    test("missing option o4", () => {
        expect(parseArgv(["comm2", "lukh", "--o3", "someoption1"]))
            .toEqual(E.left(Error("Option missing")))
    })

    test("missing option o3", () => {
        expect(parseArgv(["comm2", "lukh", "--o4", "someoption2"]))
            .toEqual(E.left(Error("Option missing")))
    })
})
