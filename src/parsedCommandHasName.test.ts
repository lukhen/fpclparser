import { parsedCommandHasName } from "./fpclparser"
import * as O from "fp-ts/lib/Option"
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
