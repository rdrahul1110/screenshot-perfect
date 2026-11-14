import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Delete, Minus, Plus, CalendarDays, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, splitAmount, validSplit, type SplitMode } from "@/lib/settl/math";
import { useSettl } from "./store";

export function ExpenseForm({
  close,
  notify,
  source = "manual",
}: {
  close: () => void;
  notify: (s: string) => void;
  source?: "manual" | "voice" | "scan";
}) {
  const state = useSettl();
  const [title, setTitle] = useState(source === "scan" ? "Dinner & Mocktails" : source === "voice" ? "Dinner" : "");
  const [amount, setAmount] = useState(source === "voice" ? "680.00" : source === "scan" ? "680.00" : "280.00");
  const [currency, setCurrency] = useState(state.currency);
  const [paidBy, setPaidBy] = useState("You");
  const [people, setPeople] = useState<string[]>([]);
  const [group, setGroup] = useState("");
  const [screen, setScreen] = useState("form");
  const [mode, setMode] = useState<SplitMode>("Equally");
  const [values, setValues] = useState<number[]>([1, 1]);
  const [one, setOne] = useState(1);
  const [more, setMore] = useState(false);
  const [date, setDate] = useState("2026-11-14");
  const [category, setCategory] = useState(source === "scan" ? "Food" : "Other");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [fresh, setFresh] = useState(true);

  const participants = ["You", ...people];
  const total = Number(amount) || 0;
  const shares = splitAmount(total, participants, mode, values, Math.min(one, participants.length - 1));
  const valid = validSplit(total, shares);

  function reset(m: SplitMode = mode) {
    setValues(participants.map(() => (m === "Exact" ? total / participants.length : m === "Percent" ? 100 / participants.length : 1)));
  }

  async function save() {
    if (!title.trim()) {
      setError("What was it for? Add a description.");
      return;
    }
    if (total <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!people.length && !group) {
      setError("Select a person or group to share with.");
      return;
    }
    if (!valid) {
      setError("Your split must add up to the full amount.");
      return;
    }

    await state.addExpenseApi({
      title: title.trim(),
      amount: total,
      group: group || people.join(", "),
      paidBy,
      shares: Object.fromEntries(participants.map((p, i) => [p, shares[i] || 0])),
      source,
      category,
      date: date === "2026-11-14" ? "Today" : date,
      currency,
    });
    notify("Expense added to Hisab ledger.");
    close();
  }

  if (screen === "people")
    return (
      <>
        <Button variant="ghost" className="p-0 mb-3 text-muted-foreground" onClick={() => setScreen("form")}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h2 className="text-2xl font-bold split-heading text-foreground">Who is it with?</h2>
        <input
          className="field mt-4"
          placeholder="Search people or circles"
          aria-label="Search participants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="eyebrow mt-5">Frequent Friends</p>
        {state.friends
          .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
          .map((p) => (
            <Button
              variant="ghost"
              className="person-row h-auto cursor-pointer"
              key={p}
              onClick={() => {
                setGroup("");
                setPeople((prev) => (prev.includes(p) ? prev.filter((n) => n !== p) : [...prev, p]));
                setMode("Equally");
              }}
            >
              <span className="flex gap-3 items-center">
                <span className="avatar-badge">{p.charAt(0).toUpperCase()}</span>
                <span className="font-semibold text-foreground">{p}</span>
              </span>
              {people.includes(p) ? <Check className="text-primary" /> : <Plus className="text-muted-foreground" />}
            </Button>
          ))}
        <p className="eyebrow mt-5">Circles</p>
        {state.groups
          .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
          .map((g) => (
            <Button
              variant="ghost"
              className="person-row h-auto cursor-pointer"
              key={g.name}
              onClick={() => {
                setGroup(g.name);
                setPeople(g.members.filter((p) => p !== "You"));
                setMode("Equally");
              }}
            >
              <span className="font-semibold text-foreground">
                {g.emoji} {g.name}
              </span>
              {group === g.name && <Check className="text-primary" />}
            </Button>
          ))}
        {query.trim() && !state.friends.includes(query.trim()) && (
          <Button
            variant="ghost"
            className="list-action text-primary"
            onClick={async () => {
              await state.addFriendApi(query.trim());
              setPeople((p) => [...p, query.trim()]);
              setQuery("");
            }}
          >
            <Plus /> Add “{query.trim()}” by name
          </Button>
        )}
        <Button className="primary-cta" onClick={() => setScreen("form")}>
          Confirm · {people.length} added <Check />
        </Button>
      </>
    );

  if (screen === "split")
    return (
      <>
        <Button variant="ghost" className="p-0 mb-3 text-muted-foreground" onClick={() => setScreen("form")}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h2 className="text-2xl font-bold split-heading text-foreground">How should we split it?</h2>
        <p className="text-muted-foreground text-xs mt-2 mb-5">
          {money(total)} · {participants.length} people
        </p>
        <div className="segments">
          {(["Equally", "Exact", "Percent", "Parts", "One pays"] as SplitMode[]).map((m) => (
            <Button
              key={m}
              variant="ghost"
              data-active={mode === m}
              onClick={() => {
                setMode(m);
                reset(m);
              }}
            >
              {m}
            </Button>
          ))}
        </div>
        {mode === "Percent" && (
          <>
            <div className="text-center mt-6">
              <p className="eyebrow">Your Share</p>
              <p className="text-3xl font-extrabold mt-2 text-foreground">
                {Math.round(values[0] || 0)}
                <span className="text-lg text-muted-foreground">%</span>
              </p>
            </div>
            <div className="ruler">
              <input
                type="range"
                min="0"
                max="100"
                aria-label="Your percentage"
                value={values[0] || 0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setValues(participants.map((_, i) => (i === 0 ? n : (100 - n) / Math.max(1, participants.length - 1))));
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </>
        )}
        {participants.map((p, i) => (
          <div className="person-row" key={p}>
            <span className="flex gap-3 items-center">
              <span className="avatar-badge">{p.charAt(0).toUpperCase()}</span>
              <span>
                <span className="text-sm font-semibold block text-foreground">{p}</span>
                {mode === "Parts" && (
                  <span className="text-[10px] text-muted-foreground">
                    {values[i] || 0} of {values.reduce((a, b) => a + b, 0)} parts · {money(shares[i] || 0)}
                  </span>
                )}
                {mode === "One pays" && (
                  <span className="text-[10px] text-muted-foreground">{i === one ? "covers entire amount" : "covers nothing"}</span>
                )}
              </span>
            </span>
            {mode === "Exact" ? (
              <input
                className="field w-28 text-right font-mono"
                type="number"
                min="0"
                step="0.01"
                aria-label={`${p} exact amount`}
                value={values[i] ?? 0}
                onChange={(e) => setValues((prev) => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              />
            ) : mode === "Parts" ? (
              <span className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="soft"
                  aria-label={`Decrease ${p} parts`}
                  onClick={() => setValues((prev) => prev.map((v, j) => (j === i ? Math.max(0, v - 1) : v)))}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-5 text-center text-sm font-bold">{values[i] || 0}</span>
                <Button
                  size="icon"
                  variant="soft"
                  aria-label={`Increase ${p} parts`}
                  onClick={() => setValues((prev) => prev.map((v, j) => (j === i ? v + 1 : v)))}
                >
                  <Plus size={14} />
                </Button>
              </span>
            ) : mode === "One pays" ? (
              <input type="radio" name="one" aria-label={`${p} pays all`} checked={one === i} onChange={() => setOne(i)} />
            ) : (
              <span className="text-sm font-bold text-foreground">
                {mode === "Percent" && <span className="text-muted-foreground text-xs mr-2">{Math.round(values[i] || 0)}%</span>}
                {money(shares[i] || 0)}
              </span>
            )}
          </div>
        ))}
        <p className={`text-xs mt-4 flex gap-1.5 items-center font-semibold ${valid ? "text-positive" : "text-destructive"}`}>
          {valid ? <Check size={14} /> : null}
          {valid
            ? `Adds up perfectly to ${money(total)}`
            : `${money(Math.abs(total - shares.reduce((a, b) => a + b, 0)))} ${shares.reduce((a, b) => a + b, 0) > total ? "over" : "remaining"}`}
        </p>
        {mode !== "Equally" && (
          <Button
            variant="ghost"
            className="text-xs mt-2 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode("Equally");
              reset("Equally");
            }}
          >
            Reset to Equal Split
          </Button>
        )}
        <Button className="primary-cta" disabled={!valid} onClick={() => setScreen("form")}>
          Apply Split <Check />
        </Button>
      </>
    );

  return (
    <>
      <p className="text-xs text-muted-foreground mb-3">
        {source === "manual" ? "Log and split seamlessly across your circle." : "Review details before syncing to the ledger."}
      </p>
      {source === "voice" && (
        <p className="text-sm font-semibold italic mb-4 p-3 bg-muted rounded-xl text-primary border border-border">
          “Dinner was 680, I paid, split equally with Sam and Amit.”
        </p>
      )}
      <input
        className="field font-medium text-foreground"
        placeholder="What was this expense for?"
        aria-label="What was it for?"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError("");
        }}
      />
      <div className="flex items-center mt-4">
        <select
          aria-label="Expense currency"
          className="bg-transparent text-xs text-muted-foreground font-semibold"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {["INR", "USD", "EUR", "GBP"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground font-bold">{currency === "INR" ? "₹" : ""}</span>
      </div>
      <input
        aria-label="Expense amount"
        inputMode="decimal"
        className="amount-input font-mono"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value.replace(/[^\d.]/g, ""));
          setFresh(false);
        }}
      />
      <div className="form-row">
        <span className="font-semibold text-muted-foreground">Paid by</span>
        <select
          className="bg-muted text-foreground rounded-full px-3 py-1 text-xs font-semibold"
          aria-label="Paid by"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {["You", ...state.friends].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <span className="font-semibold text-muted-foreground">With</span>
        <Button
          variant="soft"
          className="pill text-xs font-semibold"
          onClick={() => setScreen("people")}
          title={`${people.length} added`}
        >
          {group || people.join(", ") || "Select people or circle"}
          {people.length > 0 ? <Check size={13} /> : <ChevronDown size={13} />}
        </Button>
      </div>
      <div className="form-row">
        <span className="font-semibold text-muted-foreground">Split Mode</span>
        <Button variant="ghost" className="pill px-0 text-xs font-bold text-primary" onClick={() => setScreen("split")}>
          {mode} · {money(shares[0] || 0)} {mode === "Equally" ? "each" : "you"}
          <ChevronRight size={14} />
        </Button>
      </div>
      <Button variant="ghost" className="px-0 text-xs text-muted-foreground mt-2" onClick={() => setMore(!more)}>
        Additional options <ChevronDown size={13} />
      </Button>
      {more && (
        <div className="mt-2 space-y-1">
          <div className="form-row">
            <span className="flex gap-2 items-center text-muted-foreground">
              <CalendarDays size={14} /> Date
            </span>
            <input
              type="date"
              aria-label="Expense date"
              className="bg-transparent text-xs text-foreground font-medium"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-row">
            <span className="flex gap-2 items-center text-muted-foreground">
              <Tag size={14} /> Category
            </span>
            <select
              className="bg-transparent text-xs text-foreground font-medium"
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Other", "Food", "Trip", "Home", "Event"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive text-xs mt-3 font-semibold">
          {error}
        </p>
      )}
      {source === "manual" && (
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => (
            <Button
              key={k}
              variant="ghost"
              aria-label={k === "⌫" ? "Backspace" : `Key ${k}`}
              onClick={() => {
                if (k === "⌫") setAmount((a) => a.slice(0, -1));
                else
                  setAmount((a) => {
                    const next = fresh ? k : a + k;
                    return (next.match(/\./g) || []).length > 1 ? a : next;
                  });
                setFresh(false);
              }}
            >
              {k === "⌫" ? <Delete size={18} /> : k}
            </Button>
          ))}
        </div>
      )}
      <Button className="primary-cta mt-3" onClick={save}>
        {source === "manual" ? "Add Expense to Hisab" : "Confirm & Save Split"}
        <Check />
      </Button>
    </>
  );
}
