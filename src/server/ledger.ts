import fs from "node:fs";
import path from "node:path";
import type { Theme } from "../components/settl/mascot";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  group: string;
  paidBy: string;
  shares: Record<string, number>;
  source: "manual" | "voice" | "scan";
  category: string;
  date: string;
  deleted?: boolean;
  settled?: boolean;
  currency: string;
  notes?: string;
};

export type Group = {
  name: string;
  emoji: string;
  members: string[];
  currency: string;
  imported?: boolean;
};

export type UserProfile = {
  name: string;
  email: string;
  theme: Theme;
  currency: string;
  notifications: boolean;
};

export type DashboardStats = {
  totalSpentMonth: number;
  expensesCountMonth: number;
  totalOwed: number;
  totalOwing: number;
  categoryBreakdown: Record<string, number>;
};

export type DashboardData = {
  profile: UserProfile;
  balance: number;
  debts: Record<string, number>;
  stats: DashboardStats;
  ticker: string[];
  expenses: Expense[];
  friends: string[];
  groups: Group[];
};

// Default seed data for Hisab
const defaultProfile: UserProfile = {
  name: "Rahul",
  email: "rahul@hisab.app",
  theme: "soot",
  currency: "INR",
  notifications: true,
};

const defaultFriends: string[] = ["amit", "Rahul", "Sam", "Devanshu", "Priya"];

const defaultGroups: Group[] = [
  { name: "roadtrip", emoji: "🚗", members: ["You", "amit", "Rahul"], currency: "INR" },
  { name: "Flat 402", emoji: "🏡", members: ["You", "Sam", "Devanshu"], currency: "INR" },
  { name: "Weekend Getaway", emoji: "🏕️", members: ["You", "Priya", "Sam"], currency: "INR" },
  { name: "Personal Ledger", emoji: "⚡", members: ["You"], currency: "INR" },
];

const defaultExpenses: Expense[] = [
  {
    id: "1",
    title: "Dinner & Mocktails",
    amount: 280,
    group: "amit",
    paidBy: "You",
    shares: { You: 140, amit: 140 },
    source: "manual",
    category: "Food",
    date: "Today",
    currency: "INR",
  },
  {
    id: "2",
    title: "Expressway Toll & Fuel",
    amount: 100,
    group: "roadtrip",
    paidBy: "You",
    shares: { You: 100 },
    source: "voice",
    category: "Trip",
    date: "Today",
    settled: true,
    currency: "INR",
  },
  {
    id: "3",
    title: "Groceries & Snacks",
    amount: 100,
    group: "Rahul",
    paidBy: "You",
    shares: { You: 50, Rahul: 50 },
    source: "manual",
    category: "Food",
    date: "Today",
    currency: "INR",
  },
  {
    id: "4",
    title: "Blue Tokai Coffee",
    amount: 60,
    group: "amit",
    paidBy: "You",
    shares: { You: 30, amit: 30 },
    source: "manual",
    category: "Food",
    date: "Yesterday",
    deleted: true,
    currency: "INR",
  },
];

// Persistent state storage file
const DATA_FILE = path.resolve(process.cwd(), ".hisab-ledger.json");

type PersistentState = {
  profile: UserProfile;
  friends: string[];
  groups: Group[];
  expenses: Expense[];
};

function loadState(): PersistentState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read persistent state, using defaults:", err);
  }
  return {
    profile: { ...defaultProfile },
    friends: [...defaultFriends],
    groups: [...defaultGroups],
    expenses: [...defaultExpenses],
  };
}

function saveState(state: PersistentState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist state to file:", err);
  }
}

// In-memory state synchronized with file
let state: PersistentState = loadState();

export function calculateDebts(expenses: Expense[]): {
  debts: Record<string, number>;
  balance: number;
  totalOwed: number;
  totalOwing: number;
  categoryBreakdown: Record<string, number>;
} {
  const debts: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};

  for (const expense of expenses.filter((e) => !e.deleted && !e.settled && e.currency === "INR")) {
    // Tally category
    categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;

    if (expense.paidBy === "You") {
      for (const [person, share] of Object.entries(expense.shares)) {
        if (person !== "You") {
          debts[person] = (debts[person] || 0) + share;
        }
      }
    } else {
      debts[expense.paidBy] = (debts[expense.paidBy] || 0) - (expense.shares["You"] || 0);
    }
  }

  let totalOwed = 0;
  let totalOwing = 0;
  for (const amount of Object.values(debts)) {
    if (amount > 0) totalOwed += amount;
    else totalOwing += Math.abs(amount);
  }

  const balance = totalOwed - totalOwing;
  return { debts, balance, totalOwed, totalOwing, categoryBreakdown };
}

export function getDashboardSummary(): DashboardData {
  const { debts, balance, totalOwed, totalOwing, categoryBreakdown } = calculateDebts(state.expenses);

  const activeExpenses = state.expenses.filter((e) => !e.deleted);
  const totalSpentMonth = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesCountMonth = activeExpenses.length;

  const topDebtors = Object.entries(debts)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const debtorText = topDebtors.length > 0
    ? `${topDebtors[0][0]} owes you ₹${topDebtors[0][1].toFixed(2)}`
    : "All accounts are square!";

  const ticker = [
    debtorText,
    "Sync or import external groups instantly >",
    `₹${totalSpentMonth.toFixed(2)} tracked across all circles this month`,
    `${expensesCountMonth} active expenses in your ledger`,
  ];

  return {
    profile: state.profile,
    balance,
    debts,
    stats: {
      totalSpentMonth,
      expensesCountMonth,
      totalOwed,
      totalOwing,
      categoryBreakdown,
    },
    ticker,
    expenses: state.expenses,
    friends: state.friends,
    groups: state.groups,
  };
}

export function addExpense(expense: Omit<Expense, "id">): Expense {
  const newExpense: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    date: expense.date || "Today",
  };
  state.expenses = [newExpense, ...state.expenses];
  saveState(state);
  return newExpense;
}

export function toggleExpenseDelete(id: string): Expense | null {
  const index = state.expenses.findIndex((e) => e.id === id);
  if (index === -1) return null;
  state.expenses[index].deleted = !state.expenses[index].deleted;
  saveState(state);
  return state.expenses[index];
}

export function settleWithPerson(person: string): { success: boolean; settledAmount: number } {
  let settledAmount = 0;
  for (const expense of state.expenses) {
    if (!expense.deleted && !expense.settled) {
      if (expense.paidBy === "You" && expense.shares[person]) {
        settledAmount += expense.shares[person];
        delete expense.shares[person];
        if (Object.keys(expense.shares).length <= 1) {
          expense.settled = true;
        }
      } else if (expense.paidBy === person && expense.shares["You"]) {
        settledAmount -= expense.shares["You"];
        delete expense.shares["You"];
        if (Object.keys(expense.shares).length <= 1) {
          expense.settled = true;
        }
      }
    }
  }
  saveState(state);
  return { success: true, settledAmount };
}

export function updateProfile(update: Partial<UserProfile>): UserProfile {
  state.profile = { ...state.profile, ...update };
  saveState(state);
  return state.profile;
}

export function addFriend(name: string): string[] {
  const trimmed = name.trim();
  if (trimmed && !state.friends.includes(trimmed)) {
    state.friends = [...state.friends, trimmed];
    saveState(state);
  }
  return state.friends;
}

export function addGroup(group: Group): Group[] {
  if (!state.groups.some((g) => g.name === group.name)) {
    state.groups = [...state.groups, group];
    saveState(state);
  }
  return state.groups;
}
