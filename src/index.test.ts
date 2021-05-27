import * as E from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/function"
import * as O from "fp-ts/lib/Option"
interface Command1 {
    _tag: "comm1",
    arg: string
    o1: string,
    o2: string
}

interface Command2 {
    _tag: "comm2",
    o3: string,
    o4: string
}



function getO2(argv: string[]): E.Either<Error, string> {
    return pipe(
        argv.findIndex(el => el == "--o2"),
        i => i == -1 ? E.left(Error("Required option (o2) is missing.")) : E.right(argv[i + 1])
    )
}

function getO1(argv: string[]): string {
    return argv[argv.findIndex(el => el == "--o1") + 1]
}

function parseArgv(argv: Array<string>): E.Either<Error, Command1> {
    return pipe(
        getO2(argv),
        E.fold(
            e => E.left(e),
            o2 => E.right({

                _tag: "comm1",
                arg: argv[1],
                o1: getO1(argv),
                o2: o2
            })

        )
    )
}

describe("", () => {
    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "lukh",
            o1: "someoption1",
            o2: "someoption2"
        }
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1", "--o2", "someoption2"]))
            .toEqual(E.right(comm1))
    })

    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "arg2",
            o1: "someoption11",
            o2: "someoption22"
        }
        expect(parseArgv(["comm1", "arg2", "--o1", "someoption11", "--o2", "someoption22"]))
            .toEqual(E.right(comm1))
    })

    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "arg2",
            o1: "someoption11",
            o2: "someoption22"
        }
        expect(parseArgv(["comm1", "arg2", "--o2", "someoption22", "--o1", "someoption11"]))
            .toEqual(E.right(comm1))
    })
    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "lukh",
            o1: "someoption1",
            o2: "someoption2"
        }
        expect(parseArgv(["comm1", "lukh", "--o1", "someoption1"]))
            .toEqual(E.left(Error("Required option (o2) is missing.")))
    })

})
