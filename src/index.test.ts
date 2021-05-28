import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/lib/Option"
import { sequenceT } from "fp-ts/lib/Apply"
interface Command1 {
    _tag: "comm1",
    arg: string
    o1: string,
    o2: string
}

// constructor
function comm1(arg: string, o1: string, o2: string): Command1 {
    return { _tag: "comm1", arg, o1, o2 }
}

interface Command2 {
    _tag: "comm2",
    arg: string,
    o3: string,
    o4: string
}

// constructor
function comm2(arg: string, o3: string, o4: string): Command2 {
    return { _tag: "comm2", arg, o3, o4 }
}



function getO2(argv: string[]): E.Either<Error, string> {
    return pipe(
        argv.findIndex(el => el == "--o2"),
        i => i == -1 ? E.left(Error("Required option (o2) is missing.")) : E.right(argv[i + 1])
    )
}

function getO1(argv: string[]): E.Either<Error, string> {
    return pipe(
        argv.findIndex(el => el == "--o1"),
        i => i == -1 ? E.left(Error("Required option (o1) is missing.")) : E.right(argv[i + 1])
    )

}

function getO3(argv: string[]): E.Either<Error, string> {
    return pipe(
        argv.findIndex(el => el == "--o3"),
        i => i == -1 ? E.left(Error("Required option (o3) is missing.")) : E.right(argv[i + 1])
    )
}

function getO4(argv: string[]): E.Either<Error, string> {
    return pipe(
        argv.findIndex(el => el == "--o4"),
        i => i == -1 ? E.left(Error("Required option (o4) is missing.")) : E.right(argv[i + 1])
    )
}


function parseArgv(argv: Array<string>): E.Either<Error, Command1 | Command2> {
    return argv[0] == "comm1"
        ? pipe(
            sequenceT(E.either)(getO1(argv), getO2(argv)),
            E.fold(
                e => E.left(e),
                opts => E.right(comm1(argv[1], opts[0], opts[1]))
            )
        )
        : pipe(
            sequenceT(E.either)(getO3(argv), getO4(argv)),
            E.fold(
                e => E.left(e),
                opts => E.right(comm2(argv[1], opts[0], opts[1]))
            )
        )

}

describe("comm1", () => {
    test("all options", () => {
        const expectedCommand = comm1("lukh", "someoption1", "someoption2")
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1", "--o2", "someoption2"]))
            .toEqual(E.right(expectedCommand))
    })

    test("options in different order", () => {
        const expectedCommand = comm1("arg2", "someoption11", "someoption22")
        expect(parseArgv(["comm1", "arg2", "--o2", "someoption22", "--o1", "someoption11"]))
            .toEqual(E.right(expectedCommand))
    })
    test("missing option o2", () => {
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1"]))
            .toEqual(E.left(Error("Required option (o2) is missing.")))
    })

    test("missing option o1", () => {
        expect(parseArgv(["comm1", "lukh", "--o2", "someoption2"]))
            .toEqual(E.left(Error("Required option (o1) is missing.")))
    })
})

describe("comm2", () => {
    test("all options", () => {
        const expectedCommand = comm2("lukh", "someoption3", "someoption4")
        expect(parseArgv(["comm2", "lukh", "--o3", "someoption3", "--o4", "someoption4"]))
            .toEqual(E.right(expectedCommand))
    })

})
