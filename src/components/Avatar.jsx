// ─── 头像组件 ───
// 支持图片头像和 emoji 头像两种形式

export default function Avatar({ char, size = 48, radius = 16, fontSize = 24 }) {
  if (char?.avatarImg) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          overflow: "hidden",
          flexShrink: 0,
          background: "linear-gradient(135deg,rgba(205,193,217,.25),rgba(232,196,196,.2))",
        }}
      >
        <img
          src={char.avatarImg}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(135deg,rgba(205,193,217,.25),rgba(232,196,196,.2))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        flexShrink: 0,
      }}
    >
      {char?.emoji || "💜"}
    </div>
  );
}
