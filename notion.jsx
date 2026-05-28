import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
    bg: "#0f0f0f",
    surface: "#161616",
    border: "#242424",
    text: "#e8e6e0",
    muted: "#5a5850",
    accent: "#c8f06a",
    accentDim: "#8ab844",
    heat0: "#1a1a1a",
    heat1: "#2a3a1a",
    heat2: "#3d5a20",
    heat3: "#6a9a30",
    heat4: "#c8f06a",
    red: "#f06a6a",
    yellow: "#f0c86a",
    blue: "#6ab4f0",
};

// ── Fixed Data ────────────────────────────────────────────────────────────────
const MANDATORY_HABITS = [
    { id: "m1", name: "Drink 2L Water" },
    { id: "m2", name: "Sleep 8 Hours" },
    { id: "m3", name: "Exercise 30 mins" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "M", "", "W", "", "F", ""];
const HEAT_COLORS = [C.heat0, C.heat1, C.heat2, C.heat3, C.heat4];
const HEAT_LABELS = ["0%", "1–25%", "26–50%", "51–75%", "76–100%"];

function getWeeks(endDate, numWeeks = 22) {
    const end = new Date(endDate);
    const dayOfWeek = end.getDay();
    const diff = end.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const lastMonday = new Date(end.setDate(diff));

    const start = new Date(lastMonday);
    start.setDate(start.getDate() - (numWeeks - 1) * 7);

    const weeks = [];
    for (let w = 0; w < numWeeks; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const day = new Date(start);
            day.setDate(day.getDate() + (w * 7) + d);
            week.push(day.toISOString().slice(0, 10));
        }
        weeks.push(week);
    }
    return weeks;
}

function getMonthLabels(weeks) {
    const labels = []; let lastMonth = -1;
    weeks.forEach((week, i) => {
        const month = new Date(week[0]).getMonth();
        if (month !== lastMonth) { labels.push({ col: i, label: MONTHS[month] }); lastMonth = month; }
    });
    return labels;
}

// ── Components ────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.text }}>
            <div style={{ color: C.muted, marginBottom: 6 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
                    <span style={{ color: C.muted }}>{p.name}:</span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{p.value}%</span>
                </div>
            ))}
        </div>
    );
};

function Checkbox({ checked, onChange, label, onRemove }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, border: `1px solid ${checked ? C.accent : C.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s" }} onClick={onChange}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${checked ? C.accent : C.muted}`, background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    {checked && <span style={{ color: C.bg, fontSize: 11, fontWeight: "bold" }}>✓</span>}
                </div>
                <span style={{ color: checked ? C.text : C.muted, textDecoration: checked ? "line-through" : "none", fontFamily: "'DM Mono', monospace", fontSize: 12, transition: "color 0.2s" }}>{label}</span>
            </div>
            {onRemove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = "#2a1a1a"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "transparent"; }}
                    title="Delete habit"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

function Heatmap({ dailyActivity, onDayClick, selectedDate, weeks }) {
    const [hovered, setHovered] = useState(null);
    const monthLabels = getMonthLabels(weeks);
    const CELL = 11, GAP = 3;
    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <div style={{ fontFamily: "'DM Mono', monospace", width: "max-content", paddingRight: 24 }}>
            <div style={{ display: "flex", marginLeft: 24, marginBottom: 4, position: "relative", height: 16 }}>
                {monthLabels.map(({ col, label }, idx) => (
                    <span key={`${label}-${idx}`} style={{ position: "absolute", left: col * (CELL + GAP), fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>{label}</span>
                ))}
            </div>
            <div style={{ display: "flex", gap: GAP }}>
                <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 2 }}>
                    {DAYS.map((d, i) => (
                        <div key={i} style={{ height: CELL, width: 12, fontSize: 9, color: C.muted, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{d}</div>
                    ))}
                </div>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                        {week.map((day, di) => {
                            const level = dailyActivity[day] ?? 0;
                            const isFuture = new Date(day) > new Date(todayStr);
                            const isSelected = selectedDate === day;

                            return (
                                <div
                                    key={di}
                                    onClick={() => !isFuture && onDayClick(day)}
                                    onMouseEnter={() => setHovered(day)}
                                    onMouseLeave={() => setHovered(null)}
                                    title={`${day}: ${isFuture ? "Future" : HEAT_LABELS[level]}`}
                                    style={{
                                        width: CELL, height: CELL, borderRadius: 3,
                                        background: isFuture ? "transparent" : HEAT_COLORS[level],
                                        border: isSelected ? `2px solid ${C.text}` : isFuture ? "none" : hovered === day ? `1px solid ${C.accent}` : `1px solid transparent`,
                                        cursor: isFuture ? "default" : "pointer",
                                        transition: "transform 0.1s, border-color 0.1s",
                                        opacity: isFuture ? 0 : 1,
                                        transform: (hovered === day || isSelected) && !isFuture ? "scale(1.15)" : "scale(1)",
                                        boxSizing: "border-box"
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: C.muted }}>Click days to view & log habits</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>Less</span>
                    {HEAT_COLORS.map((c, i) => <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, background: c }} />)}
                    <span style={{ fontSize: 10, color: C.muted }}>More</span>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, sub, color }) {
    return (
        <div className="stat-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: color || C.text, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{sub}</div>}
        </div>
    );
}

function Section({ title, tag, children, rightAction }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: "0.04em" }}>{title}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {tag && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", background: C.border, padding: "3px 8px", borderRadius: 4 }}>{tag}</span>}
                    {rightAction}
                </div>
            </div>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "habit_tracker_v3"; 

export default function App() {
    const [mounted, setMounted] = useState(false);
    const todayStr = new Date().toISOString().slice(0, 10);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [newHabit, setNewHabit] = useState("");

    const [habits, setHabits] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).habits || [];
        return [];
    });

    const [logs, setLogs] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved).logs || {};
        return {};
    });

    const [plans, setPlans] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let parsed = saved ? (JSON.parse(saved).plans || {}) : {};
        if (typeof parsed.monthly === "string") parsed = { monthly: {}, yearly: {} }; 
        if (!parsed.monthly) parsed.monthly = {};
        if (!parsed.yearly) parsed.yearly = {};
        return parsed;
    });

    const selectedYYYYMM = selectedDate.slice(0, 7);
    const selectedYYYY = selectedDate.slice(0, 4);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, logs, plans }));
    }, [habits, logs, plans]);

    // ── Actions
    const toggleHabit = (habitId) => {
        setLogs(prev => {
            const dayLogs = prev[selectedDate] || {};
            const isCompleted = !!dayLogs[habitId];
            return {
                ...prev,
                [selectedDate]: {
                    ...dayLogs,
                    [habitId]: !isCompleted
                }
            };
        });
    };

    const addHabit = () => {
        if (!newHabit.trim()) return;
        const id = Date.now().toString();
        setHabits([...habits, { id, name: newHabit.trim() }]);
        setNewHabit("");
    };

    const removeHabit = (id) => {
        if (!window.confirm("Delete this habit permanently?")) return;
        setHabits(habits.filter(h => h.id !== id));
    };

    const handleClearData = () => {
        if (window.confirm("Are you sure you want to completely reset all data?")) {
            setHabits([]);
            setLogs({});
            setPlans({ monthly: {}, yearly: {} });
            setSelectedDate(todayStr);
        }
    };

    // ── Derived State (Analytics)
    // 52 weeks (1 year) now fits neatly with smaller cells
    const weeks = getWeeks(todayStr, 52);
    const dailyActivity = {};
    const totalHabitsCount = MANDATORY_HABITS.length + habits.length;

    Object.keys(logs).forEach(date => {
        const completedCount = Object.keys(logs[date]).filter(h => logs[date][h]).length;
        const pct = totalHabitsCount === 0 ? 0 : completedCount / totalHabitsCount;
        
        let level = 0;
        if (pct > 0) level = 1;
        if (pct >= 0.26) level = 2;
        if (pct >= 0.51) level = 3;
        if (pct >= 0.76) level = 4;
        if (completedCount === 0) level = 0;
        dailyActivity[date] = level;
    });

    // Compute Streaks and Stats
    const sortedActiveDays = Object.keys(logs).filter(d => {
        return Object.keys(logs[d]).some(h => logs[d][h]);
    }).sort();

    let activeDays = sortedActiveDays.length;
    let bestStreak = 0;
    let currentStreak = 0;
    let prev = null;

    for (const d of sortedActiveDays) {
        if (prev) {
            const diff = (new Date(d) - new Date(prev)) / 86400000;
            if (diff === 1) currentStreak++;
            else currentStreak = 1;
        } else {
            currentStreak = 1;
        }
        bestStreak = Math.max(bestStreak, currentStreak);
        prev = d;
    }

    // Active streak
    let activeStreak = 0;
    const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().slice(0, 10);

    if (sortedActiveDays.includes(todayStr) || sortedActiveDays.includes(yestStr)) {
        activeStreak = 1;
        let curr = new Date(sortedActiveDays.includes(todayStr) ? todayStr : yestStr);
        while (true) {
            curr.setDate(curr.getDate() - 1);
            if (sortedActiveDays.includes(curr.toISOString().slice(0, 10))) activeStreak++;
            else break;
        }
    }

    // Today's Score
    const todaysCompleted = Object.keys(logs[selectedDate] || {}).filter(h => logs[selectedDate][h]).length;
    const todaysPct = totalHabitsCount === 0 ? 0 : Math.round((todaysCompleted / totalHabitsCount) * 100);

    // Weekly Chart Data (Last 5 weeks)
    const last5Weeks = weeks.slice(-5);
    const weeklyChartData = last5Weeks.map((weekDays, i) => {
        let sumPct = 0;
        weekDays.forEach(day => {
            const completed = logs[day] ? Object.keys(logs[day]).filter(h => logs[day][h]).length : 0;
            sumPct += totalHabitsCount > 0 ? (completed / totalHabitsCount) : 0;
        });
        const overallPct = Math.round((sumPct / 7) * 100);
        return {
            week: `W${i + 1}`,
            dateRange: `${new Date(weekDays[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekDays[6]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            Completion: overallPct
        };
    });

    return (
        <div className="app-container" style={{ minHeight: "100vh", background: C.bg, padding: "32px 24px", fontFamily: "'DM Mono', monospace", opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        input::placeholder, textarea::placeholder { color: ${C.muted}; }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .app-container { padding: 16px 12px !important; }
            .header-flex { flex-direction: column !important; align-items: flex-start !important; gap: 16px; }
            .responsive-stats { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
            .stat-card { padding: 12px !important; }
            .responsive-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
            .heatmap-container { overflow-x: auto !important; padding-bottom: 12px !important; }
        }
      `}</style>

            <div style={{ maxWidth: 860, margin: "0 auto" }}>
                
                {/* Header */}
                <div className="header-flex" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>🌿 tracker</h1>
                            <span style={{ fontSize: 11, color: C.muted }}>v5.0 mobile layout</span>
                        </div>
                        <p style={{ fontSize: 11, color: C.muted, letterSpacing: "0.04em" }}>
                            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={handleClearData}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "transparent", border: `1px solid ${C.border}`,
                                borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                                color: C.text, fontFamily: "'DM Mono', monospace",
                                fontSize: 11, transition: "0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
                        >
                            Reset Data
                        </button>
                    </div>
                </div>

                {/* Stat row */}
                <div className="responsive-stats" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <Stat label="Total Active" value={`${activeDays}d`} color={C.accentDim} />
                    <Stat label="Current Streak" value={`${activeStreak}d`} color={C.accent} />
                    <Stat label="Best Streak" value={`${bestStreak}d`} color={C.text} />
                    <Stat label="Daily Score" value={`${todaysPct}%`} sub={selectedDate === todayStr ? "Today" : selectedDate} color={C.yellow} />
                </div>

                {/* Daily Checklists Grid */}
                <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <Section
                        title="Mandatory Habits"
                        tag={selectedDate === todayStr ? "Today" : selectedDate}
                        rightAction={
                            selectedDate !== todayStr && (
                                <button
                                    onClick={() => setSelectedDate(todayStr)}
                                    style={{ background: C.border, border: "none", color: C.text, fontSize: 10, padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}
                                >
                                    Jump to Today
                                </button>
                            )
                        }
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                            {MANDATORY_HABITS.map(h => (
                                <Checkbox
                                    key={h.id}
                                    label={h.name}
                                    checked={logs[selectedDate]?.[h.id] || false}
                                    onChange={() => toggleHabit(h.id)}
                                />
                            ))}
                        </div>
                    </Section>

                    <Section title="Custom Habits">
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                            {habits.length === 0 ? (
                                <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "10px 0" }}>No custom habits yet.</div>
                            ) : (
                                habits.map(h => (
                                    <Checkbox
                                        key={h.id}
                                        label={h.name}
                                        checked={logs[selectedDate]?.[h.id] || false}
                                        onChange={() => toggleHabit(h.id)}
                                        onRemove={() => removeHabit(h.id)}
                                    />
                                ))
                            )}
                        </div>
                        
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}`, display: "flex", gap: 8 }}>
                            <input
                                value={newHabit}
                                onChange={e => setNewHabit(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addHabit()}
                                placeholder="Add custom habit..."
                                style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontFamily: "'DM Mono', monospace", fontSize: 12, outline: "none", transition: "border-color 0.2s" }}
                                onFocus={e => e.currentTarget.style.borderColor = C.accent}
                                onBlur={e => e.currentTarget.style.borderColor = C.border}
                            />
                            <button
                                onClick={addHabit}
                                style={{ background: C.accent, border: "none", borderRadius: 8, padding: "0 14px", color: C.bg, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12, transition: "opacity 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                                onMouseLeave={e => e.currentTarget.style.opacity = 1}
                            >
                                +
                            </button>
                        </div>
                    </Section>
                </div>

                {/* Heatmap */}
                <div style={{ marginBottom: 16 }}>
                    <Section title="Activity History">
                        <div className="heatmap-container" style={{ overflowX: "auto" }}>
                            <Heatmap dailyActivity={dailyActivity} onDayClick={setSelectedDate} selectedDate={selectedDate} weeks={weeks} />
                        </div>
                    </Section>
                </div>

                {/* Bottom grid */}
                <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Section title="Weekly Analysis">
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={weeklyChartData} barCategoryGap="30%" margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={{ stroke: C.border }} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Bar dataKey="Completion" name="Completion" radius={[4, 4, 0, 0]} fill={C.accentDim} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Section>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Section title={`Plan: ${new Date(selectedDate).toLocaleString("default", { month: "long", year: "numeric" })}`}>
                            <textarea
                                value={plans.monthly[selectedYYYYMM] || ""}
                                onChange={e => setPlans({ ...plans, monthly: { ...plans.monthly, [selectedYYYYMM]: e.target.value } })}
                                placeholder="Write your goals for this month..."
                                style={{
                                    width: "100%", height: "70px", background: "transparent", 
                                    border: "none", color: C.text, fontFamily: "'DM Mono', monospace", 
                                    fontSize: 12, resize: "none", outline: "none"
                                }}
                            />
                        </Section>
                        <Section title={`Plan: ${selectedYYYY}`}>
                            <textarea
                                value={plans.yearly[selectedYYYY] || ""}
                                onChange={e => setPlans({ ...plans, yearly: { ...plans.yearly, [selectedYYYY]: e.target.value } })}
                                placeholder="Write your long-term goals for this year..."
                                style={{
                                    width: "100%", height: "70px", background: "transparent", 
                                    border: "none", color: C.text, fontFamily: "'DM Mono', monospace", 
                                    fontSize: 12, resize: "none", outline: "none"
                                }}
                            />
                        </Section>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.06em" }}>
                        All data is securely stored locally in your browser.
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                        {[C.heat0, C.heat1, C.heat2, C.heat3, C.heat4].map((c, i) => (
                            <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}