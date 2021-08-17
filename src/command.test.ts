import * as C from "./fpclparser"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import { pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"


export interface Command1 {
    _tag: "comm1";
    arg: string;
    o1: string;
    o2: string;
}

export interface Command2 {
    _tag: "comm2";
    arg: string;
    o3: string;
    o4: string;
}
export interface Command3 {
    _tag: "comm3";
    arg: string;
    req: string;
    opt: O.Option<string>;
}
export interface Command4 {
    _tag: "comm4";
    arg1: string;
    arg2: string;
    opt1: string;
    opt2: string;
}


export const comm1_: C.CommandConstructor<Command1> = C.getConstructor({
    tagOfA: "comm1",
    argCount: 1,
    reqOpts: ["o1", "o2"],
    innerConstructor: ([_, args, opts]) => (E.right({
        _tag: "comm1",
        arg: args[0],
        o1: opts["o1"][0],
        o2: opts["o2"][0]
    }))
}
)

export const comm3_: C.CommandConstructor<Command3> = C.getConstructor({
    tagOfA: "comm3",
    argCount: 1,
    reqOpts: ["req"],
    innerConstructor: ([name, args, opts]) => (E.right({
        _tag: "comm3",
        arg: args[0],
        req: opts["req"][0],
        opt: pipe(
            O.fromNullable(opts["opt"]),
            O.map(opt => opt[0])
        )

    }))
}
)


export const comm4_: C.CommandConstructor<Command4> = C.getConstructor({
    tagOfA: "comm4",
    argCount: 2,
    reqOpts: ["opt1", "opt2"],
    innerConstructor: ([name, args, opts]) => (E.right({
        _tag: "comm4",
        arg1: args[0],
        arg2: args[1],
        opt1: opts["opt1"][0],
        opt2: opts["opt2"][0]
    }))
}
)


export const comm2_: C.CommandConstructor<Command2> = C.getConstructor({
    tagOfA: "comm2",
    argCount: 1,
    reqOpts: ["o3", "o4"],
    innerConstructor: ([name, args, opts]) => (E.right({
        _tag: "comm2",
        arg: args[0],
        o3: opts["o3"][0],
        o4: opts["o4"][0]
    }))
}
)


export const comms = [comm1_, comm2_, comm3_]

export function isCommand1(c: Command1 | Command2 | Command3 | Command4): c is Command1 {
    return c._tag == "comm1"
}
export function isCommand2(c: Command1 | Command2 | Command3 | Command4): c is Command2 {
    return c._tag == "comm2"
}
export function isCommand3(c: Command1 | Command2 | Command3 | Command4): c is Command3 {
    return c._tag == "comm3"
}
export function isCommand4(c: Command1 | Command2 | Command3 | Command4): c is Command4 {
    return c._tag == "comm4"
}

const oeF_ = C.getEitherFoldable4Instance({ isA: isCommand1, isB: isCommand2, isC: isCommand3, isD: isCommand4 })


describe("___ Either4 map", () => {
    test("error", () => {
        pipe(
            E.left(["error message"]),
            oeF_.map({
                onA: c => "a",
                onB: c => "b",
                onC: c => "c",
                onD: c => "d"
            }),
            x => { expect(x).toEqual(E.left(["error message"])) }
        )
    })

    test("a", () => {
        pipe(
            E.right({ _tag: "comm1", arg: "arg", o1: "", o2: "" } as Command1),
            oeF_.map({
                onA: c => "a",
                onB: c => "b",
                onC: c => "c",
                onD: c => "d"
            }),
            x => { expect(x).toEqual(E.right("a")) }
        )
    })

    test("b", () => {
        pipe(
            E.right({ _tag: "comm2", arg: "arg", o3: "", o4: "" } as Command2),
            oeF_.map({
                onA: c => "a",
                onB: c => "b",
                onC: c => "c",
                onD: c => "d"
            }),
            x => { expect(x).toEqual(E.right("b")) }
        )
    })

    test("c", () => {
        pipe(
            E.right({ _tag: "comm3", arg: "arg", req: "", opt: O.none } as Command3),
            oeF_.map({
                onA: c => "a",
                onB: c => "b",
                onC: c => "c",
                onD: c => "d"
            }),
            x => { expect(x).toEqual(E.right("c")) }
        )
    })

    test("d", () => {
        pipe(
            E.right({ _tag: "comm4", arg1: "arg1", arg2: "arg2", opt1: "", opt2: "" } as Command4),
            oeF_.map({
                onA: c => "a",
                onB: c => "b",
                onC: c => "c",
                onD: c => "d"
            }),
            x => { expect(x).toEqual(E.right("d")) }
        )
    })


})

describe("___ Command fold", () => {

    test("should produce error string", () => {
        pipe(
            E.left([""]),
            oeF_.fold({
                onError: (e) => "error",
                onA: c => "command1",
                onB: c => "command2",
                onC: c => "command3",
                onD: c => "command4"
            }),
            x => { expect(x).toEqual("error") }
        )
    })


    test("should produce command1 string for Command1", () => {
        pipe(
            E.right({ _tag: "comm1", arg: "arg", o1: "", o2: "" } as Command1),
            oeF_.fold({
                onError: (e) => "error",
                onA: c => "command1",
                onB: c => "command2",
                onC: c => "command3",
                onD: c => "command4"
            }),
            x => { expect(x).toEqual("command1") }
        )
    })

    test("should produce command2 string for Command2", () => {
        pipe(
            E.right({ _tag: "comm2", arg: "arg", o3: "", o4: "" } as Command2),
            oeF_.fold({
                onError: (e) => "error",
                onA: c => "command1",
                onB: c => "command2",
                onC: c => "command3",
                onD: c => "command4"
            }),
            x => { expect(x).toEqual("command2") }
        )
    })

    test("should produce command3 string for Command3", () => {
        pipe(
            E.right({ _tag: "comm3", arg: "arg", req: "", opt: O.none } as Command3),
            oeF_.fold({
                onError: (e) => "error",
                onA: c => "command1",
                onB: c => "command2",
                onC: c => "command3",
                onD: c => "command4"
            }),
            x => { expect(x).toEqual("command3") }
        )
    })
})




describe("comm1_", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm1_(["comm1", ["arg"], { o1: ["asd"], o2: ["qewr"] }]),
            a => {
                expect(a).toEqual(
                    E.right({
                        _tag: "comm1",
                        arg: "arg",
                        o1: "asd",
                        o2: "qewr"
                    } as Command1))
            }
        )
    })


    test("command name valid, arg valid, option o1 is missing", () => {
        pipe(
            comm1_(["comm1", ["arg"], { o4: ["asd"], o2: ["qewr"] }]),
            er => { expect(er).toEqual(E.left(["Option o1 is missing"])) }
        )
    })

    test("command name valid, arg valid, option o2 is missing", () => {
        pipe(
            comm1_(["comm1", ["arg"], { o1: ["asd"], o5: ["qewr"] }]),
            er => { expect(er).toEqual(E.left(["Option o2 is missing"])) }
        )
    })

    test("command name valid, arg valid, option o1 and o2 are missing", () => {
        pipe(
            comm1_(["comm1", ["arg"], {}]),
            er => { expect(er).toEqual(E.left(["Option o1 is missing"])) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm1_(["invalidcommadn", ["arg"], { o1: ["value3"], o2: ["value4"] }]),
            x => { expect(E.isLeft(x)).toBeTruthy() }
        )
    })

})

describe("comm2_", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm2_(["comm2", ["arg"], { o3: ["asd"], o4: ["qewr"] }]),
            a => {
                expect(a).toEqual(
                    E.right({
                        _tag: "comm2",
                        arg: "arg",
                        o3: "asd",
                        o4: "qewr"
                    } as Command2))
            }
        )
    })

    test("command name valid, arg valid, option o3 is missing", () => {
        pipe(
            comm2_(["comm2", ["arg"], { o100: ["asd"], o4: ["qewr"] }]),
            er => { expect(er).toEqual(E.left(["Option o3 is missing"])) }
        )
    })

    test("command name valid, arg valid, option o4 is missing", () => {
        pipe(
            comm2_(["comm2", ["arg"], { o3: ["asd"], o100: ["qewr"] }]),
            er => { expect(er).toEqual(E.left(["Option o4 is missing"])) }
        )
    })

    test("command name valid, arg valid, option o3 and o4 are missing", () => {
        pipe(
            comm2_(["comm2", ["arg"], {}]),
            er => { expect(er).toEqual(E.left(["Option o3 is missing"])) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm2_(["invalidcommadn", ["arg"], { o3: ["value3"], o4: ["value4"] }]),
            x => { expect(E.isLeft(x)).toBeTruthy() }
        )
    })
})

describe("comm3_", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm3_(["comm3", ["arg"], { req: ["asd"], opt: ["qewr"] }]),
            a => {
                expect(a).toEqual(
                    E.right({
                        _tag: "comm3",
                        arg: "arg",
                        req: "asd",
                        opt: O.some("qewr")
                    } as Command3))
            }
        )
    })

    test("command name valid, arg valid, option req is missing", () => {
        pipe(
            comm3_(["comm3", ["arg"], { xxx: ["asd"], opt: ["qewr"] }]),
            er => { expect(er).toEqual(E.left(["Option req is missing"])) }
        )
    })

    test("command name valid, arg valid, option opt is missing", () => {
        pipe(
            comm3_(["comm3", ["arg"], { req: ["asd"], xxx: ["qewr"] }]),
            a => {
                expect(a).toEqual(
                    E.right({
                        _tag: "comm3",
                        arg: "arg",
                        req: "asd",
                        opt: O.none
                    } as Command3))
            }
        )
    })

    test("command name valid, arg valid, option req and opt are missing", () => {
        pipe(
            comm3_(["comm3", ["arg"], {}]),
            er => { expect(er).toEqual(E.left(["Option req is missing"])) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm3_(["invalidcommadn", ["arg"], { req: ["value3"], opt: ["value4"] }]),
            x => { expect(E.isLeft(x)).toBeTruthy() }
        )
    })
})



describe("comm1_ with error", () => {
    test("error if o1 is an empty string", pipe(
        C.getConstructor<Command1>({
            tagOfA: "comm1",
            argCount: 1,
            reqOpts: ["o1", "o2"],
            innerConstructor: ([name, args, opts]) =>
                opts["o1"][0] == "" ?
                    E.left(["o1 is not allowed to be an empty string"]) :
                    E.right({
                        _tag: "comm1",
                        arg: args[0],
                        o1: opts["o1"][0],
                        o2: opts["o2"][0]
                    })
        }
        ),
        c => () => {
            expect(c(["comm1", ["asdf"], { o1: [""], o2: ["asdf"] }])).toEqual(
                E.left(["o1 is not allowed to be an empty string"])
            )
        }
    ))

    test("produce Command1 if o1 is not an empty string", pipe(
        C.getConstructor<Command1>({
            tagOfA: "comm1",
            argCount: 1,
            reqOpts: ["o1", "o2"],
            innerConstructor: ([name, args, opts]) =>
                opts["o1"][0] == "" ?
                    E.left(["o1 is not allowed to be an empty string"]) :
                    E.right({
                        _tag: "comm1",
                        arg: args[0],
                        o1: opts["o1"][0],
                        o2: opts["o2"][0]
                    })
        }
        ),
        c => () => {
            expect(c(["comm1", ["asdf"], { o1: ["notEmpty"], o2: ["asdf"] }])).toEqual(
                E.right({ _tag: "comm1", arg: "asdf", o1: "notEmpty", o2: "asdf" })
            )
        }
    ))

})
