import { describe, it, expect } from "vitest";
import {
  calculateDebts,
  addExpense,
  toggleExpenseDelete,
  settleWithPerson,
  getDashboardSummary,
  type Expense,
} from "./ledger";

describe("Hisab Ledger Backend Core", () => {
  const sampleExpenses: Expense[] = [
    {
      id: "test-1",
      title: "Team Lunch",
      amount: 300,
      group: "Flat 402",
      paidBy: "You",
      shares: { You: 100, Sam: 100, Devanshu: 100 },
      source: "manual",
      category: "Food",
      date: "Today",
      currency: "INR",
    },
    {
      id: "test-2",
      title: "Uber Cab",
      amount: 200,
      group: "roadtrip",
      paidBy: "Sam",
      shares: { You: 100, Sam: 100 },
      source: "manual",
      category: "Trip",
      date: "Today",
      currency: "INR",
    },
    {
      id: "test-3",
      title: "Archived Snacks",
      amount: 50,
      group: "roadtrip",
      paidBy: "You",
      shares: { You: 25, Sam: 25 },
      source: "manual",
      category: "Food",
      date: "Yesterday",
      deleted: true,
      currency: "INR",
    },
  ];

  it("calculates multi-person debts accurately", () => {
    const { debts, balance, totalOwed, totalOwing } = calculateDebts(sampleExpenses);
    // Sam: You paid 100 for Sam (Sam owes +100), but Sam paid 100 for You (You owe Sam -100). Net = 0.
    // Devanshu: You paid 100 for Devanshu. Net = +100.
    // Total owed to you: 100 (Devanshu). Total owing: 0. Balance = 100.
    expect(debts["Sam"]).toBe(0);
    expect(debts["Devanshu"]).toBe(100);
    expect(totalOwed).toBe(100);
    expect(totalOwing).toBe(0);
    expect(balance).toBe(100);
  });

  it("ignores soft-deleted and settled expenses when computing ledger balances", () => {
    const settledSample: Expense[] = [
      ...sampleExpenses,
      {
        id: "test-4",
        title: "Old Settled Dinner",
        amount: 500,
        group: "Flat 402",
        paidBy: "You",
        shares: { You: 250, Sam: 250 },
        source: "manual",
        category: "Food",
        date: "Last week",
        settled: true,
        currency: "INR",
      },
    ];
    const { debts } = calculateDebts(settledSample);
    expect(debts["Sam"]).toBe(0);
  });

  it("adds an expense and persists to ledger summary", () => {
    const newExp = addExpense({
      title: "Blue Tokai Coffee",
      amount: 240,
      group: "amit",
      paidBy: "You",
      shares: { You: 120, amit: 120 },
      source: "manual",
      category: "Food",
      date: "Today",
      currency: "INR",
    });

    expect(newExp.id).toBeDefined();
    expect(newExp.title).toBe("Blue Tokai Coffee");

    const summary = getDashboardSummary();
    const found = summary.expenses.find((e) => e.id === newExp.id);
    expect(found).toBeDefined();
    expect(summary.debts["amit"]).toBeGreaterThanOrEqual(120);
  });

  it("supports soft deletion and restoration via toggleExpenseDelete", () => {
    const newExp = addExpense({
      title: "Temporary Toll",
      amount: 80,
      group: "roadtrip",
      paidBy: "You",
      shares: { You: 40, Rahul: 40 },
      source: "manual",
      category: "Trip",
      date: "Today",
      currency: "INR",
    });

    const toggled = toggleExpenseDelete(newExp.id);
    expect(toggled?.deleted).toBe(true);

    const restored = toggleExpenseDelete(newExp.id);
    expect(restored?.deleted).toBe(false);
  });
});
