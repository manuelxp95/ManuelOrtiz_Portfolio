import { ImageResponse } from "next/og";
import { profile } from "@/content";

export const alt = `${profile.name} — ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0a0a0a",
        color: "#ededed",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700 }}>{profile.name}</div>
      <div style={{ marginTop: 24, fontSize: 40, color: "#5eead4" }}>
        {profile.headline}
      </div>
      <div style={{ marginTop: 16, fontSize: 28, color: "#a3a3a3" }}>
        {profile.location}
      </div>
    </div>,
    size,
  );
}
