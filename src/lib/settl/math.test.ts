import { describe,it,expect } from "vitest";
import { splitAmount,validSplit,parseCsv } from "./math";
describe("Settl split rules", () => {
 it("equally divides 280 into 140 each", () => expect(splitAmount(280,["You","amit"],"Equally",[])).toEqual([140,140]));
 it("requires exact amounts to total 280", () => { expect(validSplit(280,[100,180])).toBe(true); expect(validSplit(280,[100,170])).toBe(false); });
 it("uses percentage weights", () => expect(splitAmount(280,["You","amit"],"Percent",[25,75])).toEqual([70,210]));
 it("divides by parts", () => expect(splitAmount(280,["You","amit"],"Parts",[1,3])).toEqual([70,210]));
 it("assigns all 280 to one person", () => expect(splitAmount(280,["You","amit"],"One pays",[],1)).toEqual([0,280]));
 it("never loses fractional cents", () => expect(splitAmount(100,["You","amit","Sam"],"Equally",[])).toEqual([33.34,33.33,33.33]));
 it("imports group balances from sample CSV", () => expect(parseCsv("group,name,balance\nGoa trip,Sam,250")).toEqual([{group:"Goa trip",name:"Sam",balance:250}]));
});