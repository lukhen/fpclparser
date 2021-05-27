import * as E from "fp-ts/lib/Either"

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



function getO2(argv: string[]): string {
    return argv[argv.findIndex(el => el == "--o2") + 1]
}

function getO1(argv: string[]): string {
    return argv[argv.findIndex(el => el == "--o1") + 1]
}

function parseArgv(argv: Array<string>): Command1 {
    return {

        _tag: "comm1",
        arg: argv[1],
        o1: getO1(argv),
        o2: getO2(argv)
    }
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
            .toEqual(comm1)
    })

    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "arg2",
            o1: "someoption11",
            o2: "someoption22"
        }
        expect(parseArgv(["comm1", "arg2", "--o1", "someoption11", "--o2", "someoption22"]))
            .toEqual(comm1)
    })

    test("", () => {
        const comm1: Command1 = {
            _tag: "comm1",
            arg: "arg2",
            o1: "someoption11",
            o2: "someoption22"
        }
        expect(parseArgv(["comm1", "arg2", "--o2", "someoption22", "--o1", "someoption11"]))
            .toEqual(comm1)
    })

})
