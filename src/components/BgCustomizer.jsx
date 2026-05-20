// ─── 背景图自定义组件 ───
// 用于首页和我的房间。
// 小画笔按钮 → 底部面板：选图 / 透明度 / 移除。
// 图片存 localStorage（base64），key 由父组件传入。

import { useRef, useState } from "react";

export default function BgCustomizer({ storageKey, bgConfig, onUpdate }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  const update = (patch) => {
    const next = { ...bgConfig, ...patch };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    onUpdate(next);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ dataUrl: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* 触发按钮：极小，不破坏氛围 */}
      <button
        onClick={() => setOpen(true)}
        title="自定义背景"
        style={{
          width: 26, height: 26,
          borderRadius: "50%",
          background: "rgba(0,0,0,.18)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,.2)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, lineHeight: 1,
          color: "rgba(255,255,255,.55)",
          transition: "all .2s",
          flexShrink: 0,
        }}
      >
        🎨
      </button>

      {/* 面板 */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,.3)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "rgba(255,255,255,.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "20px 20px 0 0",
              padding: "22px 20px",
              paddingBottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
              fontFamily: "var(--font-main)",
            }}
          >
            <div style={{
              fontSize: 14, fontWeight: 500, letterSpacing: 2,
              color: "#5a4a6a", textAlign: "center", marginBottom: 20,
            }}>
              自定义背景
            </div>

            {/* 图片预览 */}
            {bgConfig.dataUrl && (
              <div style={{
                width: "100%", height: 100, borderRadius: 12,
                backgroundImage: `url(${bgConfig.dataUrl})`,
                backgroundSize: "cover", backgroundPosition: "center",
                marginBottom: 16, opacity: bgConfig.opacity,
                border: "1px solid rgba(200,180,220,.3)",
              }} />
            )}

            {/* 上传按钮 */}
            <label style={{ display: "block", marginBottom: 12 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: "none" }}
              />
              <div style={{
                padding: "11px 0", borderRadius: 12, textAlign: "center",
                background: "rgba(120,100,160,.1)",
                border: "1px solid rgba(120,100,160,.2)",
                color: "#6a5a8a", fontSize: 13, letterSpacing: 1,
                cursor: "pointer",
              }}>
                {bgConfig.dataUrl ? "更换图片" : "＋ 选择图片"}
              </div>
            </label>

            {/* 透明度 */}
            {bgConfig.dataUrl && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 12, color: "#8a7898", marginBottom: 8, letterSpacing: 0.5,
                }}>
                  <span>背景透明度</span>
                  <span>{Math.round(bgConfig.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10} max={100}
                  value={Math.round(bgConfig.opacity * 100)}
                  onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
                  style={{ width: "100%", accentColor: "#9b95b5" }}
                />
              </div>
            )}

            {/* 移除 */}
            {bgConfig.dataUrl && (
              <button
                onClick={() => { update({ dataUrl: null, opacity: 0.8 }); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 12,
                  background: "rgba(200,140,140,.08)",
                  border: "1px solid rgba(200,140,140,.2)",
                  color: "#b07070", fontSize: 13, letterSpacing: 1,
                  cursor: "pointer", marginBottom: 10, fontFamily: "var(--font-main)",
                }}
              >
                移除图片
              </button>
            )}

            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 12,
                background: "rgba(120,100,160,.08)",
                border: "1px solid rgba(120,100,160,.15)",
                color: "#8a7898", fontSize: 13, letterSpacing: 1,
                cursor: "pointer", fontFamily: "var(--font-main)",
              }}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </>
  );
}
