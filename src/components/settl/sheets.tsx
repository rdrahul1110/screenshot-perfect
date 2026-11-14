import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Camera,
  Check,
  ChevronRight,
  FileDown,
  Import,
  Link,
  Mail,
  Plus,
  Pencil,
  QrCode,
  ScanLine,
  Search,
  Smartphone,
  Square,
  Upload,
  UserRound,
  Users,
  X,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Copy,
  Send,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { money, parseCsv } from "@/lib/settl/math";
import { ExpenseForm } from "./expense";
import { Mascot, themes } from "./mascot";
import { useSettl, type Expense } from "./store";
import { ActivityRow, type Sheet } from "./app";

const titles: Record<string, ReactNode> = {
  quick: <>Quick <em>Action</em></>,
  expense: <>Split an <em>Expense</em></>,
  people: <>Who is it <em>with?</em></>,
  friend: <>Add a <em>Friend</em></>,
  name: <>Enter friend's <em>name</em></>,
  email: <>Add via <em>Email</em></>,
  invite: <>Invite your <em>Circle</em></>,
  qr: <>Your <em>Hisab QR</em></>,
  group: <>Create a new <em>Circle</em></>,
  import: <>Import from <em>Splitwise</em></>,
  voice: <>AI Voice <em>Split</em></>,
  scan: <>Receipt & Bill <em>Scanner</em></>,
  breakdown: <>Ledger <em>Breakdown</em></>,
  notifications: <>Alerts & <em>Reminders</em></>,
  edit: <>Profile & <em>Account</em></>,
  currency: <>Everyday <em>Currency</em></>,
  appearance: <>Theme & <em>Identity</em></>,
  detail: <>Transaction <em>Details</em></>,
  search: <>Search <em>Hisab</em></>,
  groupDetail: <>Circle <em>Ledger</em></>,
};

export function Sheets({
  sheet,
  setSheet,
  notify,
  selected,
  selectedGroup,
  onDetail,
}: {
  sheet: Sheet;
  setSheet: (s: Sheet) => void;
  notify: (s: string) => void;
  selected: Expense | null;
  selectedGroup: string;
  onDetail: (e: Expense) => void;
}) {
  const state = useSettl();
  const [review, setReview] = useState<"voice" | "scan" | null>(null);
  const close = () => setSheet(null);

  useEffect(() => {
    setReview(null);
  }, [sheet]);

  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheet) return;
    const previous = document.activeElement;
    const timer = setTimeout(() => panel.current?.focus(), 50);

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const nodes = Array.from(
          panel.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input,select,a[href]",
          ),
        );
        const first = nodes[0];
        const last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [sheet]);

  return (
    <AnimatePresence>
      {sheet && (
        <motion.div
          className="sheet-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="sheet-scrim" onClick={close} />
          <motion.section
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="sheet-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
          >
            <div className="sheet-handle" />
            <Button
              variant="ghost"
              size="icon"
              className="sheet-close"
              aria-label="Close sheet"
              onClick={close}
            >
              <X />
            </Button>
            <h2 id="sheet-title" className="sheet-heading">
              {review ? <>Review <em>Extracted Bill</em></> : titles[sheet]}
            </h2>
            <div className="sheet-content">
              {sheet === "expense" && <ExpenseForm close={close} notify={notify} />}

              {sheet === "quick" && (
                <>
                  <Action
                    icon={AudioLines}
                    title="Voice AI Split"
                    subtitle="Speak naturally. Hisab calculates and allocates."
                    onClick={() => setSheet("voice")}
                  />
                  <Action
                    icon={Camera}
                    title="Scan Receipt / Bill"
                    subtitle="Instant itemized breakdown from camera."
                    onClick={() => setSheet("scan")}
                  />
                  <Action
                    icon={Pencil}
                    title="Manual Split"
                    subtitle="Equally, exact amounts, percentages, or parts."
                    onClick={() => setSheet("expense")}
                  />
                </>
              )}

              {sheet === "friend" && (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add contacts to start tracking shared balances effortlessly.
                  </p>
                  <Action
                    icon={UserRound}
                    title="Add by name"
                    subtitle="Instant. No email required."
                    onClick={() => setSheet("name")}
                  />
                  <Action
                    icon={Link}
                    title="Share invite link"
                    onClick={() => setSheet("invite")}
                  />
                  <Action
                    icon={QrCode}
                    title="Show my Hisab QR"
                    onClick={() => setSheet("qr")}
                  />
                  <Action
                    icon={ScanLine}
                    title="Scan friend's QR"
                    onClick={() => setSheet("scan")}
                  />
                  <Action
                    icon={Mail}
                    title="Add via email"
                    onClick={() => setSheet("email")}
                  />
                </>
              )}

              {(sheet === "name" || sheet === "email") && (
                <FriendForm email={sheet === "email"} close={close} notify={notify} />
              )}

              {sheet === "group" && <GroupForm close={close} notify={notify} />}
              {sheet === "import" && <ImportForm close={close} notify={notify} />}

              {sheet === "voice" &&
                (review ? (
                  <ExpenseForm source="voice" close={close} notify={notify} />
                ) : (
                  <>
                    <div className="voice-sphere">
                      <AudioLines />
                    </div>
                    <p className="flex items-center justify-center gap-2 text-xs text-destructive font-semibold">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                      Listening to voice input...
                    </p>
                    <p className="text-lg font-bold text-center mt-5 text-foreground">
                      “Dinner was 680, I paid,<br />
                      <span className="text-primary">split equally with Sam and Amit.</span>”
                    </p>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Gemini 2.5 Flash audio pipeline ready
                    </p>
                    <Button className="primary-cta" onClick={() => setReview("voice")}>
                      <Square size={13} />
                      Transcribe & Review
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Hisab Voice AI · Automated ledger parsing
                    </p>
                  </>
                ))}

              {sheet === "scan" &&
                (review ? (
                  <ExpenseForm source="scan" close={close} notify={notify} />
                ) : (
                  <Scanner review={() => setReview("scan")} notify={notify} setSheet={setSheet} />
                ))}

              {sheet === "breakdown" && (
                <>
                  <p className="text-xs text-muted-foreground mb-4">
                    Real-time net balance aggregated from all your active splits.
                  </p>
                  <span className="eyebrow">Net Ledger Position</span>
                  <p
                    className={`text-4xl font-extrabold mt-1 mb-5 ${
                      state.balance >= 0 ? "text-positive" : "text-destructive"
                    }`}
                  >
                    {state.balance >= 0 ? "+" : "-"} {money(Math.abs(state.balance))}
                  </p>

                  <div className="space-y-1 mb-6">
                    {Object.entries(state.debts).map(([person, net]) => (
                      <div className="person-row" key={person}>
                        <span className="flex items-center gap-3">
                          <span className="avatar-badge">{person.charAt(0).toUpperCase()}</span>
                          <span>
                            <span className="text-sm font-bold block text-foreground">{person}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {net >= 0 ? "owes you" : "you owe"}
                            </span>
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              net >= 0
                                ? "text-positive text-sm font-bold"
                                : "text-destructive text-sm font-bold"
                            }
                          >
                            {money(Math.abs(net))}
                          </span>
                          {net !== 0 && (
                            <Button
                              variant="soft"
                              size="sm"
                              className="h-7 px-2.5 text-[10px] font-bold"
                              onClick={async () => {
                                await state.settleWithPersonApi(person);
                                notify(`Settled up with ${person}!`);
                              }}
                            >
                              Settle
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="soft"
                    className="primary-cta"
                    onClick={() => {
                      notify(`WhatsApp payment reminder generated for ${selectedGroup || "friends"}.`);
                      close();
                    }}
                  >
                    <Send size={15} />
                    Send UPI Reminder Link
                  </Button>
                </>
              )}

              {sheet === "detail" && selected && (
                <>
                  <h3 className="text-2xl font-bold text-foreground">{selected.title}</h3>
                  <p className="text-3xl font-extrabold text-foreground mt-2">
                    {selected.currency === "INR" ? money(selected.amount) : `${selected.currency} ${selected.amount.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Circle: {selected.group} · Source: {selected.source} · {selected.date}
                  </p>

                  <div className="form-row mt-4">
                    <span className="font-semibold text-muted-foreground">Paid by</span>
                    <span className="font-bold text-foreground">{selected.paidBy}</span>
                  </div>

                  <div className="mt-2 mb-4">
                    <span className="eyebrow block mb-2">Shares Breakdown</span>
                    {Object.entries(selected.shares).map(([p, n]) => (
                      <div className="form-row" key={p}>
                        <span>{p}</span>
                        <span className="font-semibold">{money(n)}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={selected.deleted ? "soft" : "destructive"}
                    className="primary-cta"
                    onClick={async () => {
                      await state.toggleDeleteApi(selected.id);
                      notify(selected.deleted ? "Expense restored to ledger" : "Expense moved to archive");
                      close();
                    }}
                  >
                    {selected.deleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                    {selected.deleted ? "Restore Expense" : "Archive / Delete Expense"}
                  </Button>
                </>
              )}

              {sheet === "groupDetail" && (
                <>
                  <h3 className="text-2xl font-bold text-foreground">{selectedGroup}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Members: {state.groups.find((g) => g.name === selectedGroup)?.members.join(", ")}
                  </p>
                  <div className="mt-5">
                    {state.expenses
                      .filter((e) => !e.deleted && e.group === selectedGroup)
                      .map((e) => (
                        <ActivityRow key={e.id} expense={e} onClick={() => onDetail(e)} />
                      ))}
                    {!state.expenses.some((e) => !e.deleted && e.group === selectedGroup) && (
                      <p className="empty-state">No shared expenses in this circle yet.</p>
                    )}
                  </div>
                  <Button className="primary-cta" onClick={() => setSheet("expense")}>
                    <Plus />
                    Add Expense to Circle
                  </Button>
                  <Button
                    variant="soft"
                    className="primary-cta mt-2"
                    onClick={() => setSheet("invite")}
                  >
                    <Link />
                    Invite Members
                  </Button>
                </>
              )}

              {sheet === "search" && <SearchForm onDetail={onDetail} setSheet={setSheet} />}

              {sheet === "notifications" && (
                <>
                  <div className="form-row">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Smart Reminders</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gentle nudges for pending settlements and group activity.
                      </p>
                    </div>
                    <Switch
                      checked={state.notifications}
                      onCheckedChange={(val) => state.updateProfileApi({ notifications: val })}
                      aria-label="Enable notifications"
                    />
                  </div>
                  <div className="flex gap-3 items-center mt-6 p-4 bg-muted rounded-xl">
                    <span className="category-badge">
                      <Bell size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">All caught up</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No overdue settlements pending.</p>
                    </div>
                  </div>
                </>
              )}

              {sheet === "edit" && <ProfileForm close={close} notify={notify} />}

              {sheet === "currency" && (
                <>
                  {["INR", "USD", "EUR", "GBP"].map((c) => (
                    <Button
                      variant="ghost"
                      className="person-row h-auto cursor-pointer"
                      key={c}
                      onClick={() => {
                        state.updateProfileApi({ currency: c });
                        notify(`Default currency set to ${c}`);
                        close();
                      }}
                    >
                      <span>
                        {c} ·{" "}
                        {{
                          INR: "Indian Rupee (₹)",
                          USD: "US Dollar ($)",
                          EUR: "Euro (€)",
                          GBP: "British Pound (£)",
                        }[c]}
                      </span>
                      {state.currency === c && <Check className="text-primary" />}
                    </Button>
                  ))}
                </>
              )}

              {sheet === "appearance" && (
                <>
                  <p className="text-xs text-muted-foreground mb-4">
                    Choose your personalized companion theme and UI accent colors.
                  </p>
                  <div className="theme-grid">
                    {themes.map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        className="theme-choice"
                        data-active={state.theme === t}
                        onClick={() => state.updateProfileApi({ theme: t })}
                      >
                        <Mascot kind={t} />
                        <span className="capitalize font-semibold">{t}</span>
                      </Button>
                    ))}
                  </div>
                </>
              )}

              {(sheet === "qr" || sheet === "invite") && <Invite qr={sheet === "qr"} notify={notify} />}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Action({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Plus;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" className="list-action" onClick={onClick}>
      <Icon />
      <span className="flex-1">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        {subtitle && <span className="block text-[11px] text-muted-foreground mt-0.5">{subtitle}</span>}
      </span>
      <ChevronRight className="chevron" />
    </Button>
  );
}

function FriendForm({
  email,
  close,
  notify,
}: {
  email: boolean;
  close: () => void;
  notify: (s: string) => void;
}) {
  const state = useSettl();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError("Please enter friend's name.");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
          return setError("Enter a valid email address.");
        }
        if (state.friends.includes(name.trim())) {
          return setError("This friend is already in your circle.");
        }
        await state.addFriendApi(name.trim());
        notify(`${name.trim()} added to your Hisab circle.`);
        close();
      }}
    >
      <label className="field-label">Friend's Name</label>
      <input
        className="field"
        aria-label="Friend name"
        placeholder="e.g. Sam, Devanshu"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {email && (
        <>
          <label className="field-label mt-5">Email Address</label>
          <input
            className="field"
            type="email"
            aria-label="Friend email"
            placeholder="sam@example.com"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </>
      )}
      {error && <p className="text-destructive text-xs mt-3">{error}</p>}
      <Button className="primary-cta" type="submit">
        <Plus />
        Add to Hisab
      </Button>
    </form>
  );
}

function GroupForm({
  close,
  notify,
}: {
  close: () => void;
  notify: (s: string) => void;
}) {
  const state = useSettl();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Trip");
  const [currency, setCurrency] = useState(state.currency);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError("Please provide a name for this circle.");
        if (state.groups.some((g) => g.name === name.trim())) {
          return setError("A circle with this name already exists.");
        }
        await state.addGroupApi({
          name: name.trim(),
          emoji: ({ Trip: "🚗", Home: "🏡", Event: "🎉", Other: "✨" })[category] || "✨",
          members: ["You"],
          currency,
        });
        notify(`Circle “${name.trim()}” created.`);
        close();
      }}
    >
      <label className="field-label">Circle Name</label>
      <input
        className="field"
        aria-label="Circle name"
        placeholder="e.g. Goa Trip, Flat 402"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="field-label mt-5">Category</label>
      <div className="flex gap-2">
        {["Trip", "Home", "Event", "Other"].map((c) => (
          <Button
            key={c}
            type="button"
            className="pill"
            variant={category === c ? "default" : "soft"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="form-row mt-5">
        <span>Default Currency</span>
        <select
          className="bg-transparent text-foreground"
          aria-label="Circle currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {["INR", "USD", "EUR", "GBP"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-destructive text-xs mt-3">{error}</p>}
      <Button className="primary-cta" type="submit">
        Create Circle <Plus />
      </Button>
    </form>
  );
}

function ProfileForm({
  close,
  notify,
}: {
  close: () => void;
  notify: (s: string) => void;
}) {
  const state = useSettl();
  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await state.updateProfileApi({ name: name.trim(), email: email.trim() });
        notify("Profile updated successfully");
        close();
      }}
    >
      <label className="field-label">Your Name</label>
      <input
        required
        className="field"
        aria-label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="field-label mt-5">Email Address</label>
      <input
        required
        type="email"
        className="field"
        aria-label="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button className="primary-cta" type="submit">
        Save Changes <Check />
      </Button>
    </form>
  );
}

function ImportForm({
  close,
  notify,
}: {
  close: () => void;
  notify: (s: string) => void;
}) {
  const state = useSettl();
  const [rows, setRows] = useState<ReturnType<typeof parseCsv>>([]);
  const [error, setError] = useState("");
  const sample = "group,name,balance\nGoa trip,Sam,250\nGoa trip,amit,120";

  const load = (text: string) => {
    try {
      setRows(parseCsv(text));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't parse this CSV file.");
    }
  };

  return (
    <>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Export your groups from Splitwise and seamlessly migrate your balances into Hisab.
      </p>
      {[
        { icon: Smartphone, title: "Export Splitwise CSV", sub: "Group Settings → Export expenses as CSV." },
        { icon: Upload, title: "Drop CSV here", sub: "Hisab automatically parses participants and net tabs." },
      ].map((s, i) => (
        <div className="import-step" key={s.title}>
          <span className="import-step-icon">
            <s.icon size={22} />
          </span>
          <div>
            <p className="text-[12px] font-bold text-foreground">
              {i + 1}. {s.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
          </div>
        </div>
      ))}

      <label className="drop-zone cursor-pointer">
        <Upload size={22} className="text-primary" />
        <span className="text-xs font-semibold">
          {rows.length ? `${rows[0]?.group} · ${rows.length} balances ready` : "Choose or drag a Splitwise CSV"}
        </span>
        <input
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          aria-label="Upload CSV"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) load(await file.text());
          }}
        />
      </label>

      <Button
        variant="ghost"
        className="w-full text-xs mt-3 text-muted-foreground"
        onClick={() => load(sample)}
      >
        Try with a sample group <ArrowUpRight size={13} />
      </Button>

      {error && <p className="text-destructive text-xs mt-3">{error}</p>}

      {rows.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-2">Parsed Balances</p>
          {rows.map((r, i) => (
            <div key={i} className="form-row">
              <span className="font-semibold">{r.name}</span>
              <span className="text-positive font-bold">{money(r.balance)}</span>
            </div>
          ))}
          <Button
            className="primary-cta"
            onClick={() => {
              const names = [...new Set(rows.map((r) => r.group))];
              state.setGroups((g) => [
                ...g,
                ...names
                  .filter((n) => !g.some((x) => x.name === n))
                  .map((name) => ({
                    name,
                    emoji: "🏖️",
                    members: ["You", ...rows.filter((r) => r.group === name).map((r) => r.name)],
                    currency: "INR",
                    imported: true,
                  })),
              ]);
              state.setFriends((f) => [...new Set([...f, ...rows.map((r) => r.name)])]);
              state.setImportBalances((b) => {
                const next = { ...b };
                for (const r of rows) next[r.name] = (next[r.name] || 0) + r.balance;
                return next;
              });
              notify(`${rows[0]?.group} migrated into Hisab successfully.`);
              close();
            }}
          >
            Import Circle to Hisab <Import />
          </Button>
        </div>
      )}
    </>
  );
}

function Scanner({
  review,
  notify,
  setSheet,
}: {
  review: () => void;
  notify: (s: string) => void;
  setSheet: (s: Sheet) => void;
}) {
  const [mode, setMode] = useState("Receipt");

  return (
    <>
      <div className="segments">
        {["Receipt", "Payment QR", "Hisab QR"].map((t) => (
          <Button
            key={t}
            variant="ghost"
            data-active={mode === t}
            onClick={() => setMode(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="viewfinder">
        {mode === "Hisab QR" ? (
          <QrCode className="text-white" size={110} />
        ) : (
          <div className="receipt">
            <p className="font-extrabold text-xs">BLUE TOKAI COFFEE ROASTERS</p>
            <p className="text-[8px] mt-1 text-muted-foreground">November 14, 2026</p>
            <div className="receipt-line">
              <span>Paneer bowl</span>
              <span>₹280</span>
            </div>
            <div className="receipt-line">
              <span>Two flat whites</span>
              <span>₹240</span>
            </div>
            <div className="receipt-line">
              <span>Garlic bread</span>
              <span>₹160</span>
            </div>
            <div className="receipt-line border-t pt-2 font-bold">
              <span>Total Bill</span>
              <span>₹680</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        {mode === "Hisab QR"
          ? "Scan another user's personal QR to add them instantly."
          : "Hisab OCR identifies items, tax, and totals automatically."}
      </p>

      <Button
        className="primary-cta"
        onClick={() => {
          if (mode === "Hisab QR") {
            notify("QR scanned! Adding Sam to your circle.");
            setSheet("name");
          } else {
            review();
          }
        }}
      >
        <ScanLine size={16} />
        {mode === "Hisab QR" ? "Scan Friend's QR" : "Process Sample Bill"}
      </Button>
    </>
  );
}

function SearchForm({
  onDetail,
  setSheet,
}: {
  onDetail: (e: Expense) => void;
  setSheet: (s: Sheet) => void;
}) {
  const state = useSettl();
  const [q, setQ] = useState("");

  return (
    <>
      <div className="relative">
        <Search size={17} className="absolute top-3.5 left-3 text-muted-foreground" />
        <input
          autoFocus
          className="field pl-10"
          placeholder="Search expenses, friends, circles..."
          aria-label="Search Hisab"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {q && (
        <>
          <p className="eyebrow mt-5">Expenses</p>
          {state.expenses
            .filter((e) => !e.deleted && `${e.title} ${e.group}`.toLowerCase().includes(q.toLowerCase()))
            .map((e) => (
              <ActivityRow key={e.id} expense={e} onClick={() => onDetail(e)} />
            ))}

          <p className="eyebrow mt-5">Friends</p>
          {state.friends
            .filter((f) => f.toLowerCase().includes(q.toLowerCase()))
            .map((f) => (
              <div className="person-row" key={f}>
                <span className="font-semibold">{f}</span>
                <span className="text-positive text-xs font-bold">{money(state.debts[f] || 0)}</span>
              </div>
            ))}

          <Button
            variant="ghost"
            className="list-action text-primary"
            onClick={() => setSheet("friend")}
          >
            <Plus />
            Add “{q}” to your people
          </Button>
        </>
      )}
    </>
  );
}

function Invite({ qr, notify }: { qr: boolean; notify: (s: string) => void }) {
  const { profile } = useSettl();
  const invite = `https://hisab.app/join/${profile.name.toLowerCase()}`;

  return (
    <div className="text-center">
      <Mascot className="w-16 h-16 mx-auto" />
      <h3 className="text-xl font-bold mt-3 text-foreground">{profile.name}'s Circle</h3>
      {qr && (
        <div className="my-6 flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl">
            <QrCode size={160} className="text-black" strokeWidth={1.5} />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        {qr ? "Your personal Hisab QR code" : "Invite link to join your circle"}
      </p>
      <p className="text-xs mt-3 p-3 bg-muted rounded-xl break-all font-mono text-primary border border-border">
        {invite}
      </p>
      <Button
        className="primary-cta"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(invite);
            notify("Hisab invite link copied to clipboard!");
          } catch {
            notify("Invite link is ready above.");
          }
        }}
      >
        <Copy size={15} />
        Copy Invite Link
      </Button>
    </div>
  );
}
