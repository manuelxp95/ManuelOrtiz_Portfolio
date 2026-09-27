import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon; same monogram as `icon.svg`. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          width: 148,
          height: 148,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "8px solid #5eead4",
          borderRadius: 24,
          color: "#5eead4",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        MO
      </div>
    </div>,
    size,
  );
}
