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



function parseArgv(argv: Array<string>): Command1 {
    return {

        _tag: "comm1",
        arg: argv[1],
        o1: argv[3],
        o2: argv[5]
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
})
