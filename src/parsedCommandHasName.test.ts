import { parsedCommandHasName, ensureParsedCommandArgsSize } from "./fpclparser"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"

describe("", () => {
    test("", () => {
        expect(parsedCommandHasName("name")(["othername", ["arg1", "arg2"], { opt1: ["value"] }])).toEqual(
            O.none
        )
    })

    test("", () => {
        expect(parsedCommandHasName("name")(["name", ["arg1", "arg2"], { opt1: ["value"] }])).toEqual(
            O.some(["name", ["arg1", "arg2"], { opt1: ["value"] }])
        )
    })

})


describe("ensureParsedCommandArgsSize", () => {
    test("0 args", () => {
        expect(ensureParsedCommandArgsSize(0)(["somename", [], {}])).toEqual(
            E.right(["somename", [], {}])
        )
    })

    test("0 args, fail", () => {
        expect(E.isLeft(ensureParsedCommandArgsSize(1)(["somename", [], {}]))).toBeTruthy()
    })

    test("2 args", () => {
        expect(ensureParsedCommandArgsSize(2)(["somename", ["arg1", "arg2"], {}])).toEqual(
            E.right(["somename", ["arg1", "arg2"], {}])
        )
    })
})




