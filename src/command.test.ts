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

export type Command = O.Option<E.Either<Error, Command4 | Command1 | Command2 | Command3>>;

export const comm1: C.CommandConstructor<Command1> = C.getConstructor(
    "comm1",
    1,
    ["o1", "o2"],
    ([args, opts]) => (E.right({
        _tag: "comm1",
        arg: args[0],
        o1: opts["o1"][0],
        o2: opts["o2"][0]
    }))
)

export const comm3: C.CommandConstructor<Command3> = C.getConstructor(
    "comm3",
    1,
    ["req"],
    ([args, opts]) => (E.right({
        _tag: "comm3",
        arg: args[0],
        req: opts["req"][0],
        opt: pipe(
            O.fromNullable(opts["opt"]),
            O.map(opt => opt[0])
        )

    }))
)

export const comm4: C.CommandConstructor<Command4> = C.getConstructor(
    "comm4",
    2,
    ["opt1", "opt2"],
    ([args, opts]) => (E.right({
        _tag: "comm4",
        arg1: args[0],
        arg2: args[1],
        opt1: opts["opt1"][0],
        opt2: opts["opt2"][0]
    }))
)

export const comm2: C.CommandConstructor<Command2> = C.getConstructor(
    "comm2",
    1,
    ["o3", "o4"],
    ([args, opts]) => (E.right({
        _tag: "comm2",
        arg: args[0],
        o3: opts["o3"][0],
        o4: opts["o4"][0]
    }))
)


export const comms = [comm1, comm2, comm3]

export function foldSpecific<X>(handlers: {
    onNone: () => X,
    onError: (e: Error) => X,
    onCommand1: (c1: Command1) => X,
    onCommand2: (c2: Command2) => X,
    onCommand3: (c3: Command3) => X,
    onCommand4: (c4: Command4) => X
}): (c: Command) => X {
    return C.fold4({ isC1: isCommand1, isC2: isCommand2, isC3: isCommand3, isC4: isCommand4 },
        {
            onNone: handlers.onNone, onError: handlers.onError,
            onC1: handlers.onCommand1, onC2: handlers.onCommand2, onC3: handlers.onCommand3,
            onC4: handlers.onCommand4
        })
}


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




describe("Command fold", () => {

    test("should produce none string", () => {
        pipe(
            O.none,
            foldSpecific<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
                onCommand4: c => "command4"
            }),
            x => { expect(x).toEqual("none") }
        )
    })

    test("should produce error string", () => {
        pipe(
            O.some(E.left(Error(""))),
            foldSpecific<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
                onCommand4: c => "command4"
            }),
            x => { expect(x).toEqual("error") }
        )
    })


    test("should produce command1 string for Command1", () => {
        pipe(
            O.some(E.right({ _tag: "comm1", arg: "arg", o1: "", o2: "" } as Command1)),
            foldSpecific<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
                onCommand4: c => "command4"
            }),
            x => { expect(x).toEqual("command1") }
        )
    })

    test("should produce command2 string for Command2", () => {
        pipe(
            O.some(E.right({ _tag: "comm2", arg: "arg", o3: "", o4: "" } as Command2)),
            foldSpecific<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
                onCommand4: c => "command4"
            }),
            x => { expect(x).toEqual("command2") }
        )
    })

    test("should produce command3 string for Command3", () => {
        pipe(
            O.some(E.right({ _tag: "comm3", arg: "arg", req: "", opt: O.none } as Command3)),
            foldSpecific<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
                onCommand4: c => "command4"
            }),
            x => { expect(x).toEqual("command3") }
        )
    })
})

describe("comm1", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm1("comm1", ["arg"], { o1: ["asd"], o2: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm1",
                            arg: "arg",
                            o1: "asd",
                            o2: "qewr"
                        } as Command1)))
            }
        )
    })

    test("command name valid, arg valid, option o1 is missing", () => {
        pipe(
            comm1("comm1", ["arg"], { o4: ["asd"], o2: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o2 is missing", () => {
        pipe(
            comm1("comm1", ["arg"], { o1: ["asd"], o5: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o2 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o1 and o2 are missing", () => {
        pipe(
            comm1("comm1", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm1("invalidcommadn", ["arg"], { o1: ["value3"], o2: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})

describe("comm2", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm2("comm2", ["arg"], { o3: ["asd"], o4: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm2",
                            arg: "arg",
                            o3: "asd",
                            o4: "qewr"
                        } as Command2)))
            }
        )
    })

    test("command name valid, arg valid, option o3 is missing", () => {
        pipe(
            comm2("comm2", ["arg"], { o100: ["asd"], o4: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o3 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o4 is missing", () => {
        pipe(
            comm2("comm2", ["arg"], { o3: ["asd"], o100: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o4 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o3 and o4 are missing", () => {
        pipe(
            comm2("comm2", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o3 is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm2("invalidcommadn", ["arg"], { o3: ["value3"], o4: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})

describe("comm3", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            comm3("comm3", ["arg"], { req: ["asd"], opt: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm3",
                            arg: "arg",
                            req: "asd",
                            opt: O.some("qewr")
                        } as Command3)))
            }
        )
    })

    test("command name valid, arg valid, option req is missing", () => {
        pipe(
            comm3("comm3", ["arg"], { xxx: ["asd"], opt: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option req is missing")))) }
        )
    })

    test("command name valid, arg valid, option opt is missing", () => {
        pipe(
            comm3("comm3", ["arg"], { req: ["asd"], xxx: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm3",
                            arg: "arg",
                            req: "asd",
                            opt: O.none
                        } as Command3)))
            }
        )
    })

    test("command name valid, arg valid, option req and opt are missing", () => {
        pipe(
            comm3("comm3", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option req is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            comm3("invalidcommadn", ["arg"], { req: ["value3"], opt: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})

describe("comm1 with error", () => {
    test("error if o1 is an empty string", pipe(
        C.getConstructor<Command1>(
            "comm1",
            1,
            ["o1", "o2"],
            ([args, opts]) =>
                opts["o1"][0] == "" ?
                    E.left(Error("o1 is not allowed to be an empty string")) :
                    E.right({
                        _tag: "comm1",
                        arg: args[0],
                        o1: opts["o1"][0],
                        o2: opts["o2"][0]
                    })
        ),
        c => () => {
            expect(c("comm1", ["asdf"], { o1: [""], o2: ["asdf"] })).toEqual(
                O.some(E.left(Error("o1 is not allowed to be an empty string"))
                ))
        }
    ))

    test("produce Command1 if o1 is not an empty string", pipe(
        C.getConstructor<Command1>(
            "comm1",
            1,
            ["o1", "o2"],
            ([args, opts]) =>
                opts["o1"][0] == "" ?
                    E.left(Error("o1 is not allowed to be an empty string")) :
                    E.right({
                        _tag: "comm1",
                        arg: args[0],
                        o1: opts["o1"][0],
                        o2: opts["o2"][0]
                    })
        ),
        c => () => {
            expect(c("comm1", ["asdf"], { o1: ["notEmpty"], o2: ["asdf"] })).toEqual(
                O.some(E.right({ _tag: "comm1", arg: "asdf", o1: "notEmpty", o2: "asdf" })
                ))
        }
    ))

})
