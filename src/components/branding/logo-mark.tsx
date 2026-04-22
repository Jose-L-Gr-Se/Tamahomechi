/**
 * LogoMark — vector mark used for app icons (favicon, apple-icon, manifest)
 * and as a brand element in the UI.
 *
 * Rendered as a flat layout of div primitives so it works with Satori
 * (next/og ImageResponse) without needing SVG path support.
 */

interface LogoMarkProps {
  size?: number;
  /** Render without the rounded background tile (for inline use over content). */
  bare?: boolean;
}

const COLORS = {
  bg: "#F7F2EB",
  glow: "#EFE3D2",
  house: "#C06A3E",
  houseShadow: "#A8552D",
  heart: "#E04A4A",
  cream: "#F7F2EB",
};

export function LogoMark({ size = 512, bare = false }: LogoMarkProps) {
  // Everything is positioned in 512-unit space and scaled down for smaller sizes
  const scale = size / 512;
  const px = (n: number) => `${n * scale}px`;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: bare ? "transparent" : COLORS.bg,
        borderRadius: bare ? 0 : px(112),
      }}
    >
      {/* Soft glow circle behind the house */}
      <div
        style={{
          position: "absolute",
          width: px(320),
          height: px(320),
          borderRadius: "50%",
          background: COLORS.glow,
          top: px(120),
          left: px(96),
        }}
      />

      {/* House body (terracotta) — rotated square + rectangle stacked */}
      {/* Roof (rotated square) */}
      <div
        style={{
          position: "absolute",
          width: px(184),
          height: px(184),
          background: COLORS.house,
          top: px(126),
          left: px(164),
          transform: "rotate(45deg)",
          borderRadius: px(18),
        }}
      />
      {/* Body */}
      <div
        style={{
          position: "absolute",
          width: px(276),
          height: px(160),
          background: COLORS.house,
          bottom: px(110),
          left: px(118),
          borderBottomLeftRadius: px(20),
          borderBottomRightRadius: px(20),
        }}
      />

      {/* Chimney */}
      <div
        style={{
          position: "absolute",
          width: px(28),
          height: px(56),
          background: COLORS.houseShadow,
          top: px(150),
          left: px(316),
          borderTopLeftRadius: px(4),
          borderTopRightRadius: px(4),
        }}
      />

      {/* Door */}
      <div
        style={{
          position: "absolute",
          width: px(64),
          height: px(96),
          background: COLORS.cream,
          bottom: px(110),
          left: px(224),
          borderTopLeftRadius: px(28),
          borderTopRightRadius: px(28),
        }}
      />

      {/* Heart "window" above the door — cream lobes over the terracotta wall */}
      {/* Square base of heart (rotated 45deg) */}
      <div
        style={{
          position: "absolute",
          width: px(56),
          height: px(56),
          background: COLORS.cream,
          top: px(216),
          left: px(228),
          transform: "rotate(45deg)",
        }}
      />
      {/* Left lobe */}
      <div
        style={{
          position: "absolute",
          width: px(44),
          height: px(44),
          borderRadius: "50%",
          background: COLORS.cream,
          top: px(198),
          left: px(214),
        }}
      />
      {/* Right lobe */}
      <div
        style={{
          position: "absolute",
          width: px(44),
          height: px(44),
          borderRadius: "50%",
          background: COLORS.cream,
          top: px(198),
          left: px(254),
        }}
      />
      {/* Inner heart accent — small red heart centered inside the cream window */}
      <div
        style={{
          position: "absolute",
          width: px(20),
          height: px(20),
          background: COLORS.heart,
          top: px(232),
          left: px(246),
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: px(16),
          height: px(16),
          borderRadius: "50%",
          background: COLORS.heart,
          top: px(226),
          left: px(238),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: px(16),
          height: px(16),
          borderRadius: "50%",
          background: COLORS.heart,
          top: px(226),
          left: px(252),
        }}
      />
    </div>
  );
}
