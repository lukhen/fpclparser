import * as C from "./command"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import { pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"

describe("Command fold", () => {

    test("should produce command1 string for Command1", () => {
        pipe(
            { _tag: "comm1", arg: "arg", o1: "", o2: "" } as C.Command1,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command1") }
        )
    })

    test("should produce command2 string for Command2", () => {
        pipe(
            { _tag: "comm2", arg: "arg", o3: "", o4: "" } as C.Command2,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command2") }
        )
    })

    test("should produce command3 string for Command3", () => {
        pipe(
            { _tag: "comm3", arg: "arg", req: "", opt: O.none } as C.Command3,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command3") }
        )
    })
})

describe("xcomm1", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o1: ["asd"], o2: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm1",
                            arg: "arg",
                            o1: "asd",
                            o2: "qewr"
                        } as C.Command1)))
            }
        )
    })

    test("command name valid, arg valid, option o1 is missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o4: ["asd"], o2: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o2 is missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o1: ["asd"], o5: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o2 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o1 and o2 are missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            C.xcomm1("invalidcommadn", "arg", { o1: ["value3"], o2: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})
