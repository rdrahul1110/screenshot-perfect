import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  AudioLines,
  Bell,
  BatteryFull,
  Camera,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  CircleHelp,
  Home,
  Pencil,
  Plus,
  Search,
  Signal,
  Sparkles,
  Users,
  Utensils,
  Wifi,
  UserRound,
  Car,
  QrCode,
  ScanLine,
  Globe,
  Palette,
  Import,
  Settings2,
  TrendingUp,
  Receipt,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/settl/math";
import { Mascot, themes } from "./mascot";
import { useSettl, type Expense } from "./store";
import { Sheets } from "./sheets";

export type Sheet =
  | "quick"
  | "expense"
  | "people"
  | "friend"
  | "name"
  | "email"
  | "invite"
  | "qr"
  | "group"
  | "import"
  | "voice"
  | "scan"
  | "breakdown"
  | "notifications"
  | "edit"
  | "currency"
  | "appearance"
  | "detail"
  | "search"
  | "groupDetail"
  | null;

export function SettlApp() {
  const state = useSettl();
  const [tab, setTab] = useState("Home");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Expense | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [compact, setCompact] = useState(false);
  const [peopleTab, setPeopleTab] = useState("Groups");
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tick, setTick] = useState(0);
  const [typed, setTyped] = useState("");
  const scroll = useRef<HTMLDivElement>(null);

  const notify = (message: string) => setToast(message);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => (t + 1) % 4), 6000);
    return () => clearInterval(timer);
  }, []);

  // Ticker source: prioritize server ticker if available
  const topDebtor = Object.entries(state.debts).find(([, n]) => n > 0);
  const tickerItems = state.serverTicker.length > 0
    ? state.serverTicker
    : [
        topDebtor ? `${topDebtor[0]} owes you ${money(topDebtor[1])}` : "All accounts are square!",
        "Sync or import Splitwise groups instantly >",
        `${money(state.expenses.filter((e) => !e.deleted).reduce((a, e) => a + e.amount, 0))} tracked across all circles this month`,
        `${state.expenses.filter((e) => !e.deleted).length} active expenses in your ledger`,
      ];

  const currentTicker = tickerItems[tick % tickerItems.length] || "";

  useEffect(() => {
    setTyped("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTyped(currentTicker.slice(0, i));
      if (i >= currentTicker.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [currentTicker]);

  const changeTab = (name: string) => {
    setTab(name);
    setCompact(false);
    scroll.current?.scrollTo({ top: 0 });
  };

  const detail = (expense: Expense) => {
    setSelected(expense);
    setSheet("detail");
  };

  const balanceParts = Math.abs(state.balance).toFixed(2).split(".");
  const isPositive = state.balance >= 0;

  // Filtered expenses for feed
  const activeEntries = state.expenses.filter((e) => !e.deleted);
  const filteredEntries = categoryFilter === "All"
    ? activeEntries
    : categoryFilter === "Settled"
      ? activeEntries.filter((e) => e.settled)
      : activeEntries.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase());

  return (
    <main className="phone-stage">
      <div className="phone" data-theme={state.theme}>
        {/* iOS / Device Status Bar */}
        <div className="status-bar">
          <span>9:41</span>
          <div className="island" />
          <div className="flex items-center gap-1.5">
            <Signal size={13} />
            <Wifi size={13} />
            <BatteryFull size={18} />
          </div>
        </div>

        {/* Hisab Brand Header */}
        <header className="app-header">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Your profile"
            onClick={() => changeTab("You")}
            className="relative p-0 hover:bg-transparent"
          >
            <Mascot kind={state.theme} className="h-9 w-9" />
            <span className="status-dot" />
          </Button>

          <div className="flex items-center">
            <span className="wordmark">
              hisab<span className="dot">.</span>
            </span>
            <span className="live-badge" title={state.backendConnected ? "Connected to Backend Ledger" : "Local Mock Engine"}>
              <span className="live-dot" />
              {state.backendConnected ? "Live" : "Synced"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              title="Search expenses, friends and groups"
              onClick={() => setSheet("search")}
            >
              <Search size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setSheet("notifications")}
            >
              <Bell size={18} />
            </Button>
          </div>
        </header>

        {/* Scrollable Main Stage */}
        <div
          className="app-scroll"
          ref={scroll}
          onScroll={(e) => {
            if (tab === "Home") setCompact(e.currentTarget.scrollTop > 180);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {tab === "Home" && (
                <>
                  {/* Sticky Compact Balance Header */}
                  {compact && (
                    <div className="compact-balance">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Net</span>
                        <span className={`text-sm font-bold ${isPositive ? "text-positive" : "text-destructive"}`}>
                          {isPositive ? "+" : "-"} {money(Math.abs(state.balance))}
                        </span>
                      </div>
                      <Button variant="soft" className="pill h-7 text-[11px]" onClick={() => setSheet("breakdown")}>
                        Breakdown <ChevronRight size={13} />
                      </Button>
                    </div>
                  )}

                  {/* Hisab Cyber-Hero Ledger Card */}
                  <section className="hero-card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="hero-heading">
                        <TrendingUp size={14} className={isPositive ? "text-positive" : "text-destructive"} />
                        NET BALANCE
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => setSheet("breakdown")}
                      >
                        Ledger <ChevronRight size={11} />
                      </Button>
                    </div>

                    <div className={`hero-amount ${isPositive ? "positive" : "negative"}`}>
                      {isPositive ? "+" : "-"} ₹{balanceParts[0]}
                      <span className="decimals">.{balanceParts[1]}</span>
                    </div>

                    {/* Dual Sub-stats: To Receive vs To Settle */}
                    <div className="hero-substats">
                      <div className="stat-chip">
                        <span className="stat-chip-label">↓ To Receive</span>
                        <span className="stat-chip-value positive">{money(state.totalOwed)}</span>
                      </div>
                      <div className="stat-chip">
                        <span className="stat-chip-label">↑ To Settle</span>
                        <span className="stat-chip-value negative">{money(state.totalOwing)}</span>
                      </div>
                    </div>

                    {/* Dynamic High-tech Ticker */}
                    <div className="ticker">
                      <span className="ticker-icon">
                        <ArrowUpRight size={13} />
                      </span>
                      {tick === 1 ? (
                        <button
                          type="button"
                          onClick={() => setSheet("import")}
                          className="p-0 h-auto text-[11px] font-medium text-left flex items-center gap-1 text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                        >
                          {typed} <ChevronRight size={12} />
                        </button>
                      ) : (
                        <span className="truncate">
                          {typed}
                          <span className="cursor">_</span>
                        </span>
                      )}
                    </div>

                    {/* Fast Quick-Action Buttons */}
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="hero-action-btn"
                        onClick={() => setSheet("scan")}
                        aria-label="Scan bill or receipt"
                      >
                        <Camera size={18} />
                        <span>Scan Bill</span>
                      </button>
                      <button
                        type="button"
                        className="hero-action-btn primary"
                        onClick={() => setSheet("expense")}
                        aria-label="Split an expense"
                      >
                        <Plus size={18} />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        className="hero-action-btn"
                        onClick={() => setSheet("voice")}
                        aria-label="Voice expense"
                      >
                        <AudioLines size={18} />
                        <span>Voice AI</span>
                      </button>
                    </div>
                  </section>

                  {/* "Waiting On" Debtor Cards */}
                  <div className="section-heading">
                    <h2>Waiting on</h2>
                    <Button
                      variant="ghost"
                      className="h-7 px-0 text-[11.5px] text-muted-foreground hover:text-primary"
                      onClick={() => setSheet("breakdown")}
                    >
                      View all <ArrowUpRight size={13} />
                    </Button>
                  </div>

                  <div className="debtors">
                    {Object.entries(state.debts)
                      .filter(([, n]) => n > 0)
                      .map(([person, n]) => (
                        <div
                          key={person}
                          className="debtor-card"
                          onClick={() => {
                            setSelectedGroup(person);
                            setSheet("breakdown");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="avatar-badge">{person.charAt(0).toUpperCase()}</span>
                            <ArrowUpRight size={13} className="text-muted-foreground" />
                          </div>
                          <p className="text-[13px] font-bold mt-3 text-foreground">{person}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Direct peer ledger</p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                            <span className="text-[12.5px] font-bold text-positive">{money(n)}</span>
                            <span className="text-[9px] font-semibold uppercase text-muted-foreground">owes you</span>
                          </div>
                        </div>
                      ))}

                    {!Object.values(state.debts).some((n) => n > 0) && (
                      <p className="empty-state w-full">All accounts are settled. Zero pending debts.</p>
                    )}
                  </div>

                  {/* Activity Feed ("Lately") */}
                  <div className="section-heading">
                    <h2>Recent Activity</h2>
                    <span className="eyebrow">{filteredEntries.length} LOGGED</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="activity-filter-bar">
                    {["All", "Food", "Trip", "Settled"].map((cat) => (
                      <Button
                        key={cat}
                        variant={categoryFilter === cat ? "default" : "soft"}
                        className="pill h-7 text-[11px]"
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>

                  {/* List of Transactions */}
                  <div>
                    {filteredEntries.map((expense) => (
                      <ActivityRow key={expense.id} expense={expense} onClick={() => detail(expense)} />
                    ))}
                    {filteredEntries.length === 0 && (
                      <p className="empty-state">No transactions in this category.</p>
                    )}
                  </div>

                  {/* Soft-Deleted Records Toggle */}
                  {state.expenses.some((e) => e.deleted) && (
                    <div className="mt-4">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <div className="h-px bg-border flex-1" />
                        <span>{state.expenses.filter((e) => e.deleted).length} archived / deleted</span>
                        <Button
                          variant="ghost"
                          className="h-6 p-0 text-[10px] text-primary"
                          onClick={() => setShowDeleted(!showDeleted)}
                        >
                          {showDeleted ? "Hide" : "Show"}
                        </Button>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      {showDeleted &&
                        state.expenses
                          .filter((e) => e.deleted)
                          .map((e) => (
                            <div key={e.id} className="opacity-50 mt-2">
                              <ActivityRow expense={e} onClick={() => detail(e)} />
                            </div>
                          ))}
                    </div>
                  )}

                  <div className="flex justify-center gap-2 items-center mt-8 text-[10.5px] text-muted-foreground">
                    <Sparkles size={12} className="text-primary" />
                    <span>Clear accounts. Effortless friendships. · Hisab</span>
                  </div>
                </>
              )}

              {/* Circles / People Tab */}
              {tab === "Circles" && (
                <>
                  <div className="flex justify-between items-center mt-3 mb-5">
                    <h1 className="text-[26px] font-bold text-foreground">Circles & People</h1>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Add people or group"
                      onClick={() => setSheet("friend")}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>

                  <div className="segments mb-4">
                    {["Groups", "Friends"].map((t) => (
                      <Button
                        key={t}
                        variant="ghost"
                        data-active={peopleTab === t}
                        onClick={() => setPeopleTab(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2 mb-4">
                    {["All", "Open", "Settled"].map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? "default" : "ghost"}
                        className="pill h-7 text-[11px]"
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>

                  {peopleTab === "Groups" ? (
                    <>
                      {state.groups
                        .filter((g) => filter !== "Open" || g.imported)
                        .filter((g) => filter !== "Settled" || !g.imported)
                        .map((g) => (
                          <div
                            className="group-card"
                            key={g.name}
                            onClick={() => {
                              setSelectedGroup(g.name);
                              setSheet("groupDetail");
                            }}
                          >
                            <span className="group-emoji">{g.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className="block font-bold text-sm text-foreground">{g.name}</span>
                              <span className="block text-xs text-muted-foreground mt-1">
                                {g.members.length === 1 ? "Personal Ledger" : `${g.members.length} members`} ·{" "}
                                {g.imported ? "Imported Circle" : "Active Ledger"}
                              </span>
                            </div>
                            <ChevronRight size={17} className="text-muted-foreground" />
                          </div>
                        ))}
                      <Button
                        variant="ghost"
                        className="list-action text-primary font-semibold"
                        onClick={() => setSheet("group")}
                      >
                        <Plus />
                        Create a new circle
                        <ChevronRight className="chevron" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="list-action"
                        onClick={() => setSheet("import")}
                      >
                        <Import />
                        Import Splitwise CSV
                        <ChevronRight className="chevron" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {state.friends
                        .filter((f) => filter === "All" || (filter === "Open" ? state.debts[f] : !state.debts[f]))
                        .map((f) => (
                          <div
                            key={f}
                            className="person-row cursor-pointer"
                            onClick={() => {
                              setSelectedGroup(f);
                              setSheet("breakdown");
                            }}
                          >
                            <span className="flex gap-3 items-center">
                              <span className="avatar-badge">{f.charAt(0).toUpperCase()}</span>
                              <span className="text-sm font-semibold text-foreground">{f}</span>
                            </span>
                            <span
                              className={
                                (state.debts[f] || 0) > 0
                                  ? "text-positive text-xs font-bold"
                                  : (state.debts[f] || 0) < 0
                                    ? "text-destructive text-xs font-bold"
                                    : "text-muted-foreground text-xs"
                              }
                            >
                              {state.debts[f] ? money(state.debts[f]) : "Settled"}
                            </span>
                          </div>
                        ))}
                      <Button
                        variant="ghost"
                        className="list-action text-primary font-semibold"
                        onClick={() => setSheet("friend")}
                      >
                        <Plus />
                        Add a new friend
                        <ChevronRight className="chevron" />
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Insights Tab */}
              {tab === "Insights" && <Insights />}

              {/* Profile / You Tab */}
              {tab === "You" && (
                <>
                  <div className="flex items-center gap-4 mt-4 mb-7 p-4 bg-card rounded-2xl border border-border">
                    <Mascot kind={state.theme} className="w-14 h-14" />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-bold text-foreground">{state.profile.name}</h1>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{state.profile.email}</p>
                    </div>
                    <Button variant="soft" className="pill h-8 text-xs" onClick={() => setSheet("edit")}>
                      Edit <Pencil size={11} />
                    </Button>
                  </div>

                  <div className="section-heading">
                    <h2>Color & Identity</h2>
                    <span className="text-[10px] text-muted-foreground capitalize">Theme: {state.theme}</span>
                  </div>

                  <div className="theme-grid mb-6">
                    {themes.map((theme) => (
                      <Button
                        variant="ghost"
                        key={theme}
                        className="theme-choice"
                        data-active={theme === state.theme}
                        onClick={() => state.updateProfileApi({ theme })}
                        aria-label={`Choose ${theme}`}
                      >
                        <Mascot kind={theme} />
                        <span className="capitalize font-semibold">{theme}</span>
                        {theme === state.theme && <Check size={11} className="theme-check" />}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-4">
                    {(
                      [
                        { label: "Your Hisab QR Code", icon: QrCode, sheet: "qr" },
                        { label: "Scan Friend's QR", icon: ScanLine, sheet: "scan" },
                        { label: `Default Currency (${state.currency})`, icon: Globe, sheet: "currency" },
                        { label: "Notifications & Reminders", icon: Bell, sheet: "notifications" },
                        { label: "Import Splitwise History", icon: Import, sheet: "import" },
                        { label: "Appearance & Themes", icon: Palette, sheet: "appearance" },
                      ] as const
                    ).map((item) => (
                      <Button
                        variant="ghost"
                        className="list-action text-[12.5px]"
                        key={item.label}
                        onClick={() => setSheet(item.sheet)}
                      >
                        <item.icon />
                        {item.label}
                        <ChevronRight className="chevron" />
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10.5px] text-muted-foreground mt-8 pb-4">
                    <span>Engineered for shared living.</span>
                    <span>hisab · v1.0.0</span>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Cyber-Dock */}
        <nav className="dock" aria-label="Main navigation">
          <div className="dock-nav">
            {[
              { name: "Home", icon: Home },
              { name: "Circles", icon: Users },
              { name: "Insights", icon: ChartNoAxesColumnIncreasing },
              { name: "You", icon: UserRound },
            ].map((item) => (
              <Button
                variant="ghost"
                data-active={tab === item.name}
                aria-current={tab === item.name ? "page" : undefined}
                key={item.name}
                onClick={() => changeTab(item.name)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Button>
            ))}
          </div>

          <div className="dock-actions">
            <Button
              variant="ghost"
              aria-label="Quick add"
              title="Add expense"
              onClick={() => setSheet("expense")}
            >
              <Plus size={22} />
            </Button>
            <div className="dock-divider" />
            <Button
              variant="ghost"
              aria-label="Start voice expense"
              title="Voice AI"
              onClick={() => setSheet("voice")}
            >
              <AudioLines size={20} />
            </Button>
          </div>
        </nav>

        <div className="home-indicator" />

        {/* Dynamic Sheets & Drawers */}
        <Sheets
          sheet={sheet}
          setSheet={setSheet}
          notify={notify}
          selected={selected}
          selectedGroup={selectedGroup}
          onDetail={detail}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="toast-message"
              role="status"
            >
              <CheckCheck size={16} />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export function ActivityRow({ expense: e, onClick }: { expense: Expense; onClick: () => void }) {
  const owed =
    e.paidBy === "You"
      ? Object.entries(e.shares)
          .filter(([p]) => p !== "You")
          .reduce((a, [, n]) => a + n, 0)
      : -(e.shares["You"] || 0);

  const isFood = e.category === "Food";
  const isTrip = e.category === "Trip";
  const Icon = isFood ? Utensils : isTrip ? Car : Receipt;
  const badgeClass = isFood ? "food" : isTrip ? "trip" : "other";

  return (
    <div className="activity-card" onClick={onClick}>
      <span className={`category-badge ${badgeClass}`}>
        <Icon size={18} strokeWidth={1.8} />
        <span className="source-pill">
          {e.source === "voice" ? (
            <AudioLines size={9} className="text-primary" />
          ) : e.source === "scan" ? (
            <Camera size={9} className="text-cyan" />
          ) : (
            <Pencil size={8} className="text-muted-foreground" />
          )}
        </span>
      </span>

      <div className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold text-foreground truncate">{e.title}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="tag-pill">
            <Users size={9} /> {e.group}
          </span>
          <span className="text-[10px] text-muted-foreground">{e.date}</span>
        </div>
        <span className="block text-[10.5px] text-muted-foreground mt-1">
          {e.paidBy} paid {e.currency === "INR" ? money(e.amount) : `${e.currency} ${e.amount.toFixed(2)}`}
        </span>
      </div>

      <div className="text-right shrink-0">
        <span
          className={`block text-[13px] font-bold ${
            e.settled || owed === 0
              ? "text-muted-foreground"
              : owed > 0
                ? "text-positive"
                : "text-destructive"
          }`}
        >
          {money(e.settled || owed === 0 ? e.amount : Math.abs(owed))}
        </span>
        <span
          className={`block text-[9.5px] font-semibold mt-0.5 ${
            e.settled || owed === 0
              ? "text-muted-foreground"
              : owed > 0
                ? "text-positive"
                : "text-destructive"
          }`}
        >
          {e.deleted ? "archived" : e.settled || owed === 0 ? "settled" : owed > 0 ? "you lent" : "you owe"}
        </span>
      </div>
    </div>
  );
}

function Insights() {
  const { expenses } = useSettl();
  const active = expenses.filter((e) => !e.deleted);
  const total = active.reduce((a, e) => a + e.amount, 0);

  return (
    <>
      <div className="flex justify-between mt-3 mb-6">
        <h1 className="text-[26px] font-bold text-foreground">Spending & Trends</h1>
      </div>

      <div className="flex justify-between items-center">
        <span className="eyebrow">November 2026</span>
        <span className="pill bg-muted text-foreground text-xs flex items-center">This month</span>
      </div>

      <div className="p-4 bg-card rounded-2xl border border-border mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Tracked</h2>
        <p className="text-3xl font-extrabold text-foreground mt-2">{money(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">Across {active.length} active transactions</p>
      </div>

      <div className="insight-chart mt-4">
        {[45, 75, 40, 100, 60, 125].map((h, i) => (
          <div key={i} className="chart-column">
            <svg width="100%" height={h} className={i === 5 ? "text-primary" : "text-muted"}>
              <rect width="100%" height="100%" rx="5" fill="currentColor" />
            </svg>
            <span className="text-[9.5px] font-semibold text-muted-foreground">
              {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][i]}
            </span>
          </div>
        ))}
      </div>

      <div className="section-heading">
        <h2>Breakdown by Category</h2>
        <Settings2 size={16} className="text-muted-foreground" />
      </div>

      {["Food", "Trip", "Other"].map((category) => {
        const catTotal = active
          .filter((e) => e.category.toLowerCase() === category.toLowerCase())
          .reduce((a, e) => a + e.amount, 0);
        if (catTotal === 0 && category === "Other") return null;
        return (
          <div className="person-row" key={category}>
            <span className="flex items-center gap-3">
              <span className="avatar-badge">{category === "Food" ? "🍽️" : category === "Trip" ? "🚗" : "✨"}</span>
              <span className="text-sm font-semibold text-foreground">{category}</span>
            </span>
            <span className="font-bold text-sm text-foreground">{money(catTotal)}</span>
          </div>
        );
      })}

      <div className="flex gap-2.5 items-center mt-6 p-3 bg-muted rounded-xl text-xs text-muted-foreground">
        <Sparkles size={16} className="text-primary shrink-0" />
        <span>Balanced splits mean more relaxed get-togethers.</span>
      </div>
    </>
  );
}
