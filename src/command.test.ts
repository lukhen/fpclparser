import * as C from "./command"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import { pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"

describe("Command fold", () => {
    function fail(msg: NEA.NonEmptyArray<string>): void {
        expect(msg).toEqual([])
    }

    test("onCommand1: command name valid, arg valid, all options valid", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o1: ["asd"], o2: ["qewr"] }),
            O.map(E.map(
                (c: C.Command) => C.fold<string>({
                    onCommand1: c => c._tag,
                    onCommand2: c => c._tag,
                    onCommand3: c => c._tag,
                }, c))

            ),
            O.fold(
                () => { fail(["x"]) },
                e => pipe(
                    e,
                    E.fold(
                        er => { fail(["y"]) },
                        a => { expect(a).toEqual("comm1") }
                    )
                )
            )
        )
    })
})
