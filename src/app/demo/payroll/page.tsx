"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRecur, type ProgressState } from "@/lib/recur/useRecur";
import { TopBar } from "@/components/recur-ds/Nav";
import { ChainChip, ChainLogo } from "@/components/recur-ds/primitives";
import type { SupportedChainKey } from "@/lib/lifi/constants";

const DEST_OPTIONS: { key: SupportedChainKey; label: string }[] = [
  { key: "baseSepolia", label: "Base Sepolia" },
  { key: "arbitrumSepolia", label: "Arbitrum Sepolia" },
  { key: "optimismSepolia", label: "Optimism Sepolia" },
  { key: "sepolia", label: "Sepolia" },
];

const STORAGE_KEY = "recur.payroll.team.v2";

function loadTeam(fallback: Employee[]): Employee[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Employee[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* swallow */
  }
  return fallback;
}

function saveTeam(team: Employee[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  } catch {
    /* swallow */
  }
}

function newEmployeeId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function randomHue(): number {
  return Math.floor(Math.random() * 360);
}

type Employee = {
  id: string;
  name: string;
  role: string;
  address: string;
  chain: SupportedChainKey;
  amount: string;
  hue: number;
};

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Anika Rao",  role: "Founding Eng", address: "0xDf25e3a251F588933194996799B6cd9B563DB3A1", chain: "baseSepolia",     amount: "10", hue: 18  },
  { id: "e2", name: "Bo Carter",  role: "Design Lead",  address: "0x1F8EF9dAC1176788c18d6719db3e60EE5e417D5E", chain: "arbitrumSepolia", amount: "10", hue: 80  },
  { id: "e3", name: "Chiara Lim", role: "PM",           address: "0x9239e34c7022d4156Ba1cC2D62DCE27912F977d3", chain: "arbitrumSepolia", amount: "10", hue: 150 },
];

function polarPositions(i: number, n: number) {
  if (n === 0) return { card: { x: 50, y: 50 } };
  const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return {
    card: { x: 50 + 38 * cos, y: 50 + 38 * sin },
  };
}

export default function PayrollPage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { subscribe, busy, progress } = useRecur();
  const [employees, setEmployees] = useState<Employee[]>(() =>
    typeof window === "undefined" ? DEFAULT_EMPLOYEES : loadTeam(DEFAULT_EMPLOYEES),
  );
  const [running, setRunning] = useState<{ index: number; total: number } | null>(null);
  const [done, setDone] = useState(false);
  const [modal, setModal] = useState<{
    mode: "add" | "edit";
    employee: Employee;
  } | null>(null);
  const [frequency, setFrequency] = useState<"minute"|"hour"|"day"|"week">("day");
  const [periods, setPeriods] = useState(1);

  useEffect(() => {
    saveTeam(employees);
  }, [employees]);

  const total = employees.reduce((acc, e) => acc + Number(e.amount || "0"), 0);
  const gasSaved = Math.round(employees.length * periods * 3.6);

  function openAdd() {
    setModal({
      mode: "add",
      employee: {
        id: newEmployeeId(),
        name: "",
        role: "",
        address: "",
        chain: "arbitrumSepolia",
        amount: "",
        hue: randomHue(),
      },
    });
  }

  function openEdit(id: string) {
    const e = employees.find((emp) => emp.id === id);
    if (e) setModal({ mode: "edit", employee: { ...e } });
  }

  function handleSave(updated: Employee) {
    setEmployees((list) =>
      modal?.mode === "add"
        ? [...list, updated]
        : list.map((e) => (e.id === updated.id ? updated : e)),
    );
    setModal(null);
  }

  function handleDelete(id: string) {
    setEmployees((list) => list.filter((e) => e.id !== id));
    setModal(null);
  }

  function resetTeam() {
    setEmployees([]);
  }

  async function runPayroll() {
    if (!authenticated) {
      login();
      return;
    }
    setDone(false);
    try {
      for (let i = 0; i < employees.length; i++) {
        setRunning({ index: i, total: employees.length });
        const e = employees[i];
        await subscribe({
          merchantName: `${e.name} · ${e.role}`,
          merchantAddress: e.address as `0x${string}`,
          sourceChainKey: "baseSepolia",
          destChainKey: e.chain,
          amountPerPeriod: e.amount,
          frequency,
          periods,
          firstFireDelaySec: 60 + i * 20,
          theme: "payroll",
        });
      }
      setRunning(null);
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setRunning(null);
    }
  }

  return (
    <div className="paper-grain" style={{ minHeight: "100vh", color: "var(--ink)" }}>
      <TopBar />

      <div
        style={{
          padding: "40px 56px 24px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <div>
          <h1
            className="t-display"
            style={{ fontSize: 64, margin: 0, letterSpacing: "-.025em", lineHeight: 1 }}
          >
            Pay your team. <span className="t-display-it">Anywhere.</span>
          </h1>
        </div>
        <button
          onClick={runPayroll}
          disabled={!ready || busy || (authenticated && wallets.length === 0)}
          className="btn btn-lg"
          style={{ background: "#4A6644", color: "#F6EFE5", fontWeight: 600 }}
        >
          {authenticated ? "Run payroll →" : "Sign in to run payroll"}
        </button>
      </div>

      <div
        style={{
          padding: "0 56px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <PayrollStat label="Committed" value={`${total.toFixed(0)}.00`} unit={`USDC / ${frequency}`} bg="var(--surface-1)" />
        <PayrollStat label="Next payday" value={frequency === "week" ? "Fri" : frequency === "day" ? "Tomorrow" : "—"} unit={frequency === "week" ? "in 7d" : frequency === "day" ? "in ~1 day" : frequency === "hour" ? "in ~1 hr" : "in ~1 min"} bg="var(--sage)"
     />
        <PayrollStat
          label="Pre-signed"
          value={done ? String(employees.length * periods) : "0"}
          unit={done ? `intents · ${periods} wk` : "not yet run"}
          bg="var(--surface-1)"
        />
        <PayrollStat label="Saved on gas" value={`$${gasSaved}`} unit="vs. manual" bg="#1A1410" fg="#F4ECDA" />
      </div>

      <div
        style={{
          padding: "10px 56px 12px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          maxWidth: 1440,
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".12em", textTransform: "uppercase" }}>
          Frequency:
        </span>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as "minute"|"hour"|"day"|"week")}
          style={{
            background: "var(--surface-1)",
            border: 0,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--ink)",
            fontFamily: "var(--f-ui)",
            outline: "none",
          }}
        >
          <option value="minute">Minute</option>
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
        </select>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".12em", textTransform: "uppercase" }}>
          Periods:
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setPeriods(Math.max(1, periods - 1))}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 14, padding: "2px 8px" }}
          >
            –
          </button>
          <span className="t-mono t-num" style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
            {periods}
          </span>
          <button
            onClick={() => setPeriods(Math.min(12, periods + 1))}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 14, padding: "2px 8px" }}
          >
            +
          </button>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-2)", marginLeft: "auto" }}>
          Next fire: {frequency === "minute" ? "in ~1 min" : frequency === "hour" ? "in ~1 hr" : frequency === "day" ? "Tomorrow" : "Fri · in 7d"}
        </span>
      </div>

      <div
        style={{
          padding: "28px 56px 56px",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 24,
          alignItems: "stretch",
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        {/* Map */}
        <div
          className="card card-xl"
          style={{
            padding: 0,
            background: "#F2EDE4",
            overflow: "hidden",
            position: "relative",
            minHeight: 560,
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, padding: "24px 28px 0", zIndex: 2 }}>
            <div
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              Live map · {new Set(employees.map((e) => e.chain)).size} chain{new Set(employees.map((e) => e.chain)).size !== 1 ? "s" : ""} · {employees.length} recipient{employees.length !== 1 ? "s" : ""}
            </div>
          </div>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <AnimatePresence>
              {employees.map((e, i) => {
                const { card } = polarPositions(i, employees.length);
                return (
                  <motion.path
                    key={e.id}
                    d={`M50 50 L${card.x.toFixed(2)} ${card.y.toFixed(2)}`}
                    stroke="rgba(31,26,20,.28)"
                    strokeWidth="0.8"
                    fill="none"
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 42, opacity: 0 }}
                    animate={{ strokeDashoffset: 0, opacity: 1 }}
                    exit={{ strokeDashoffset: 42, opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                );
              })}
            </AnimatePresence>
          </svg>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#231B27",
              color: "#F4ECDA",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 24px 56px rgba(31,26,20,.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                className="t-mono"
                style={{ fontSize: 10, opacity: 0.6, letterSpacing: ".14em" }}
              >
                DEPOSIT
              </div>
              <motion.span
                key={total}
                className="t-display t-num"
                style={{ fontSize: 30, lineHeight: 1, marginTop: 4, display: "inline-block" }}
                initial={{ scale: 1.18 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
              >
                {total}
              </motion.span>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>USDC / week</div>
            </div>
          </div>
          <AnimatePresence>
            {employees.map((e, i) => {
              const { card } = polarPositions(i, employees.length);
              return (
                <motion.div
                  key={e.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    scale: [1, 1.18, 0],
                    opacity: [1, 1, 0],
                    transition: { duration: 0.28, times: [0, 0.3, 1], ease: "easeIn" },
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 20, mass: 0.7 }}
                  style={{
                    position: "absolute",
                    left: `${card.x}%`,
                    top: `${card.y}%`,
                    x: "-50%",
                    y: "-50%",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      background: "#FEFCF8",
                      borderRadius: 16,
                      padding: "9px 13px 9px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      boxShadow: "0 4px 16px rgba(31,26,20,.1), 0 1px 3px rgba(31,26,20,.06)",
                      border: "1px solid rgba(31,26,20,.06)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        flexShrink: 0,
                        background: `linear-gradient(135deg, hsl(${e.hue} 60% 72%), hsl(${(e.hue + 25) % 360} 55% 62%))`,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 650, lineHeight: 1.2 }}>{e.name.split(" ")[0]}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <ChainLogo name={e.chain} size={11} />
                        <span className="t-mono" style={{ fontSize: 10, color: "var(--text-2)", fontWeight: 600 }}>
                          {e.amount}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Team list */}
        <div className="card card-xl" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h3 className="t-display" style={{ fontSize: 24, margin: 0 }}>
              This week&apos;s payroll
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={resetTeam} className="btn btn-ghost btn-sm">
                Reset
              </button>
              <button
                onClick={openAdd}
                className="btn btn-sm"
                style={{ background: "var(--sage)", color: "#1f2c1c", fontWeight: 600 }}
              >
                + Add teammate
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <AnimatePresence initial={false}>
              {employees.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    color: "var(--text-2)",
                    fontSize: 13,
                    background: "var(--surface-1)",
                    borderRadius: 14,
                  }}
                >
                  No teammates yet
                  <br />
                  <button
                    onClick={openAdd}
                    className="btn btn-sm"
                    style={{
                      marginTop: 10,
                      background: "var(--sage)",
                      color: "#1f2c1c",
                      fontWeight: 600,
                    }}
                  >
                    + Add teammate
                  </button>
                </motion.div>
              ) : (
                employees.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: -24, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 32, height: 0, transition: { duration: 0.22, ease: "easeIn" } }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 16px",
                        background: "var(--surface-1)",
                        borderRadius: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 999,
                          flexShrink: 0,
                          background: `linear-gradient(135deg, hsl(${t.hue} 55% 75%), hsl(${t.hue + 30} 55% 65%))`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 3,
                          }}
                        >
                          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {t.role}
                          </span>
                          <span
                            style={{
                              width: 3,
                              height: 3,
                              borderRadius: 999,
                              background: "var(--text-3)",
                              flexShrink: 0,
                            }}
                          />
                          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {t.address.slice(0, 6)}&hellip;{t.address.slice(-4)}
                          </span>
                        </div>
                      </div>
                      <ChainChip name={t.chain} size={11} />
                      <div style={{ textAlign: "right", minWidth: 80 }}>
                        <div className="t-mono t-num" style={{ fontSize: 14, fontWeight: 600 }}>
                          {Number(t.amount || "0").toFixed(2)}
                        </div>
                        <div style={{ display: "flex", gap: 3, marginTop: 4, justifyContent: "flex-end" }}>
                          {[0, 1, 2, 3].map((k) => (
                            <span
                              key={k}
                              style={{
                                width: 14,
                                height: 6,
                                borderRadius: 3,
                                background: k === 0 ? "#7FA582" : "var(--surface-2)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => openEdit(t.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, padding: "4px 10px", flexShrink: 0 }}
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          {done ? (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--sage)",
                color: "#1f2c1c",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "#1f2c1c",
                  color: "var(--sage)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              <div style={{ flex: 1, fontSize: 13 }}>
                All {employees.length * periods} intents pre-signed &middot; keeper fires {frequency === "minute" ? "in ~1 min" : frequency === "hour" ? "in ~1 hr" : frequency === "day" ? "Tomorrow" : "Fri · in 7d"}.
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--surface-1)",
                color: "var(--text-2)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--surface-2)",
                  color: "var(--text-3)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                ·
              </span>
              <div style={{ flex: 1, fontSize: 13 }}>
                Ready &middot; click "Run payroll" to pre-sign {employees.length * periods} intents.
              </div>
            </div>
          )}
        </div>
      </div>

      {running ? (
        <RunningOverlay current={running.index} total={running.total} employees={employees} progress={progress} periods={periods} />
      ) : null}

      {done ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,9,8,.82)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="card card-xl"
            style={{ background: "var(--bg)", padding: 40, maxWidth: 480, textAlign: "center" }}
          >
            <div className="t-display" style={{ fontSize: 32 }}>
              Payroll scheduled ✓
            </div>
            <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 8 }}>
              All {employees.length} teammates will receive their first payment within ~60–120s.
            </p>
            <button
              onClick={() => router.push("/app")}
              className="btn btn-lg"
              style={{
                background: "#4A6644",
                color: "#F6EFE5",
                width: "100%",
                justifyContent: "center",
                marginTop: 22,
                fontWeight: 600,
              }}
            >
              Open dashboard
            </button>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {modal ? (
          <TeammateEditModal
            key={modal.mode === "add" ? "add" : modal.employee.id}
            mode={modal.mode}
            initial={modal.employee}
            onSave={handleSave}
            onDelete={modal.mode === "edit" ? () => handleDelete(modal.employee.id) : undefined}
            onCancel={() => setModal(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TeammateEditModal({
  mode,
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  mode: "add" | "edit";
  initial: Employee;
  onSave: (employee: Employee) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [address, setAddress] = useState(initial.address);
  const [chain, setChain] = useState(initial.chain);
  const [amount, setAmount] = useState(initial.amount);

  function validate(): string | null {
    if (!name.trim()) return "Name is required";
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return "Address must be a valid 42-char 0x address";
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return "Amount must be greater than 0";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onSave({ ...initial, name, role, address, chain, amount });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,9,8,.62)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="card card-xl"
        style={{ background: "#FAF7F2", padding: 32, maxWidth: 460, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="t-display" style={{ fontSize: 24, marginBottom: 22 }}>
          {mode === "add" ? "Add teammate" : "Edit teammate"}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anika Rao"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: 0,
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--f-ui)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Founding eng"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: 0,
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--f-ui)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Beneficiary address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x&hellip;"
              className="t-mono"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: 0,
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                fontFamily: "var(--f-mono)",
              }}
            />
          </div>
          <div>
            <label
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Destination chain
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as SupportedChainKey)}
              style={{
                width: "100%",
                background: "var(--bg)",
                border: 0,
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--f-ui)",
                outline: "none",
              }}
            >
              {DEST_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="t-mono"
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Amount per week
            </label>
            <div style={{ position: "relative" }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: 0,
                  padding: "12px 48px 12px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                  color: "var(--ink)",
                  fontFamily: "var(--f-mono)",
                  outline: "none",
                  fontWeight: 600,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontFamily: "var(--f-mono)",
                  pointerEvents: "none",
                }}
              >
                USDC
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            {mode === "edit" ? (
              <button
                onClick={onDelete}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#C44A3F",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "6px 4px",
                  fontWeight: 500,
                  opacity: 0.8,
                }}
              >
                Delete teammate
              </button>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={onCancel}
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn"
              style={{ background: "var(--sage)", color: "#1f2c1c", fontWeight: 600, fontSize: 14 }}
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PayrollStat({
  label,
  value,
  unit,
  bg,
  fg = "#1A1410",
}: {
  label: string;
  value: string;
  unit: string;
  bg: string;
  fg?: string;
}) {
  return (
    <div style={{ background: bg, color: fg, padding: "18px 20px", borderRadius: 20 }}>
      <div
        className="t-mono"
        style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.65 }}
      >
        {label}
      </div>
      <div className="t-display t-num" style={{ fontSize: 36, lineHeight: 1, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{unit}</div>
    </div>
  );
}

function RunningOverlay({
  current,
  total,
  employees,
  progress,
  periods,
}: {
  current: number;
  total: number;
  employees: Employee[];
  progress: ProgressState;
  periods: number;
}) {
  const e = employees[current];
  const pct = Math.round(((current) / Math.max(total, 1)) * 100);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,9,8,.82)",
        backdropFilter: "blur(12px)",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-xl"
        style={{ background: "var(--bg)", padding: 32, maxWidth: 520, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div
            className="t-mono"
            style={{
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#3a5a35",
            }}
          >
            Scheduling {current + 1} of {total}
          </div>
          <div
            className="t-mono"
            style={{ fontSize: 11, letterSpacing: ".08em", color: "var(--text-3)" }}
          >
            {pct}%
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            height: 4,
            borderRadius: 999,
            background: "var(--surface-2)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 24 }}
            style={{ height: "100%", background: "#4A6644", borderRadius: 999 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
          {e ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                flexShrink: 0,
                background: `linear-gradient(135deg, hsl(${e.hue} 60% 72%), hsl(${(e.hue + 25) % 360} 55% 62%))`,
                boxShadow: "0 4px 12px rgba(31,26,20,.12)",
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1 }}>{e?.name}</div>
            {e?.role ? (
              <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>{e.role}</div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 13,
            color: "var(--text-2)",
          }}
        >
          <span className="t-mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
            {e?.amount} USDC
          </span>
          <span style={{ color: "var(--text-3)" }}>×</span>
          <span className="t-mono">{periods}</span>
          <span style={{ color: "var(--text-3)" }}>→</span>
          {e?.chain ? <ChainChip name={e.chain} /> : null}
        </div>

        <ul style={{ marginTop: 24, listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          <ProgressRow label="Approve / deposit" status={progress.deposit} />
          <ProgressRow
            label={`Sign ${progress.sign.signed}/${progress.sign.total} intents`}
            status={progress.sign.status}
          />
          <ProgressRow label="Save subscription" status={progress.save} />
        </ul>
      </motion.div>
    </motion.div>
  );
}

function ProgressRow({
  label,
  status,
}: {
  label: string;
  status: "idle" | "running" | "done" | "error";
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: status === "running" ? "rgba(74,102,68,.08)" : "var(--surface-1)",
        padding: 14,
        borderRadius: 14,
        transition: "background 200ms ease",
      }}
    >
      <ProgressDot status={status} />
      <span
        style={{
          fontSize: 14,
          color:
            status === "done"
              ? "var(--text-2)"
              : status === "running"
              ? "var(--ink)"
              : "var(--text-3)",
          fontWeight: status === "running" ? 600 : 400,
        }}
      >
        {label}
      </span>
    </li>
  );
}

function ProgressDot({ status }: { status: "idle" | "running" | "done" | "error" }) {
  if (status === "done") {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "#4A6644",
          color: "#F4ECDA",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor">
          <path d="M6.7 11.5 3.2 8l1.4-1.4L6.7 8.7l4.7-4.7 1.4 1.4z" />
        </svg>
      </span>
    );
  }
  if (status === "running") {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          border: "2px solid var(--surface-2)",
          borderTopColor: "#4A6644",
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === "error") {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "var(--err, #C44A3F)",
          color: "#F4ECDA",
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        !
      </span>
    );
  }
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        border: "1px solid var(--surface-2)",
        flexShrink: 0,
      }}
    />
  );
}
