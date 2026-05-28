// ─── PillTabs · 胶囊样式横向 Tab 栏 ───
// tabs: [{ key, label }]
// activeKey: string
// onChange: (key) => void

export default function PillTabs({ tabs, activeKey, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "8px 16px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        ...style,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: activeKey === tab.key ? 500 : 400,
            color: activeKey === tab.key ? "#2e2a3d" : "#5a5470",
            background: activeKey === tab.key
              ? "rgba(255,255,255,.75)"
              : "rgba(255,255,255,.4)",
            border: activeKey === tab.key
              ? "1px solid rgba(196,166,184,.35)"
              : "1px solid transparent",
            whiteSpace: "nowrap",
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            transition: "all .25s",
            letterSpacing: 0.5,
            outline: "none",
            flexShrink: 0,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
