import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Theme } from "./mascot";

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

export type Profile = {
  name: string;
  email: string;
};

export type Stats = {
  totalSpentMonth: number;
  expensesCountMonth: number;
  totalOwed: number;
  totalOwing: number;
  categoryBreakdown: Record<string, number>;
};

const initialExpenses: Expense[] = [
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

function useStoreValue() {
  const [theme, setTheme] = useState<Theme>("soot");
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [friends, setFriends] = useState(["amit", "Rahul", "Sam", "Devanshu", "Priya"]);
  const [groups, setGroups] = useState<Group[]>([
    { name: "roadtrip", emoji: "🚗", members: ["You", "amit", "Rahul"], currency: "INR" },
    { name: "Flat 402", emoji: "🏡", members: ["You", "Sam", "Devanshu"], currency: "INR" },
    { name: "Weekend Getaway", emoji: "🏕️", members: ["You", "Priya", "Sam"], currency: "INR" },
    { name: "Personal Ledger", emoji: "⚡", members: ["You"], currency: "INR" },
  ]);
  const [profile, setProfile] = useState<Profile>({
    name: "Rahul",
    email: "rahul@hisab.app",
  });
  const [currency, setCurrency] = useState("INR");
  const [notifications, setNotifications] = useState(true);
  const [importBalances, setImportBalances] = useState<Record<string, number>>({});
  const [backendConnected, setBackendConnected] = useState(false);
  const [serverTicker, setServerTicker] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSpentMonth: 480,
    expensesCountMonth: 4,
    totalOwed: 190,
    totalOwing: 0,
    categoryBreakdown: { Food: 380, Trip: 100 },
  });

  // Sync with backend on mount
  useEffect(() => {
    async function loadBackendDashboard() {
      try {
        const res = await fetch("/api/v1/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.expenses) setExpenses(data.expenses);
          if (data.friends) setFriends(data.friends);
          if (data.groups) setGroups(data.groups);
          if (data.ticker) setServerTicker(data.ticker);
          if (data.stats) setStats(data.stats);
          if (data.profile) {
            setProfile({ name: data.profile.name, email: data.profile.email });
            if (data.profile.theme) setTheme(data.profile.theme);
            if (data.profile.currency) setCurrency(data.profile.currency);
            if (typeof data.profile.notifications === "boolean") setNotifications(data.profile.notifications);
          }
          setBackendConnected(true);
        }
      } catch {
        // Fallback gracefully to local mock store
        setBackendConnected(false);
      }
    }
    loadBackendDashboard();
  }, []);

  // Compute live ledger balances
  const debts: Record<string, number> = { ...importBalances };
  for (const expense of expenses.filter((e) => !e.deleted && !e.settled && e.currency === "INR")) {
    if (expense.paidBy === "You") {
      for (const [person, share] of Object.entries(expense.shares)) {
        if (person !== "You") debts[person] = (debts[person] || 0) + share;
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

  // Backend mutation helpers
  const addExpenseApi = async (newExpense: Omit<Expense, "id">) => {
    const tempId = crypto.randomUUID();
    const optimistic: Expense = { ...newExpense, id: tempId };
    setExpenses((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });
      if (res.ok) {
        const saved = await res.json();
        setExpenses((prev) => prev.map((e) => (e.id === tempId ? saved : e)));
        setBackendConnected(true);
      }
    } catch (e) {
      console.warn("Offline/local mode - saved to local state only", e);
    }
  };

  const toggleDeleteApi = async (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, deleted: !e.deleted } : e))
    );

    try {
      const res = await fetch(`/api/v1/expenses/${id}/toggle-delete`, { method: "POST" });
      if (res.ok) setBackendConnected(true);
    } catch (e) {
      console.warn("Offline/local mode - toggled locally", e);
    }
  };

  const settleWithPersonApi = async (person: string) => {
    try {
      const res = await fetch("/api/v1/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person }),
      });
      if (res.ok) {
        const dashRes = await fetch("/api/v1/dashboard");
        if (dashRes.ok) {
          const data = await dashRes.json();
          if (data.expenses) setExpenses(data.expenses);
        }
      }
    } catch (e) {
      console.warn("Offline/local mode - settle locally", e);
    }
  };

  const updateProfileApi = async (updated: Partial<Profile & { theme: Theme; currency: string; notifications: boolean }>) => {
    if (updated.name || updated.email) {
      setProfile((prev) => ({
        name: updated.name ?? prev.name,
        email: updated.email ?? prev.email,
      }));
    }
    if (updated.theme) setTheme(updated.theme);
    if (updated.currency) setCurrency(updated.currency);
    if (typeof updated.notifications === "boolean") setNotifications(updated.notifications);

    try {
      const res = await fetch("/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) setBackendConnected(true);
    } catch (e) {
      console.warn("Offline/local mode - updated locally", e);
    }
  };

  const addFriendApi = async (name: string) => {
    const trimmed = name.trim();
    if (!friends.includes(trimmed)) {
      setFriends((prev) => [...prev, trimmed]);
    }

    try {
      await fetch("/api/v1/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch (e) {
      console.warn("Offline/local mode", e);
    }
  };

  const addGroupApi = async (group: Group) => {
    if (!groups.some((g) => g.name === group.name)) {
      setGroups((prev) => [...prev, group]);
    }

    try {
      await fetch("/api/v1/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(group),
      });
    } catch (e) {
      console.warn("Offline/local mode", e);
    }
  };

  return {
    theme,
    setTheme,
    expenses,
    setExpenses,
    friends,
    setFriends,
    groups,
    setGroups,
    profile,
    setProfile,
    currency,
    setCurrency,
    notifications,
    setNotifications,
    debts,
    balance,
    totalOwed,
    totalOwing,
    importBalances,
    setImportBalances,
    backendConnected,
    serverTicker,
    stats,
    addExpenseApi,
    toggleDeleteApi,
    updateProfileApi,
    addFriendApi,
    addGroupApi,
    settleWithPersonApi,
  };
}

const Store = createContext<ReturnType<typeof useStoreValue> | null>(null);

export function SettlProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useSettl() {
  const state = useContext(Store);
  if (!state) throw new Error("Hisab provider required");
  return state;
}
