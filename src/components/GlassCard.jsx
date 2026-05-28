// ─── GlassCard · 通用玻璃卡片 ───
// 复用最常见的 glass-morphism 卡片样式

export default function GlassCard({ children, style, padding, ...props }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.55)",
        boxShadow: "0 4px 18px rgba(0,0,0,.06)",
        padding: padding ?? "18px 20px",
        marginBottom: 12,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
