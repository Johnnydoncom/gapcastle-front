import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — pay bills, buy airtime and data, and get quick loans in Nigeria`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share card for every page; generated once at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #142990 0%, #1a3be6 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{SITE.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
            Pay bills, buy airtime & data, get quick loans
          </div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 24, opacity: 0.9 }}>
            Instant bill payments with cashback across Nigeria
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>
          {SITE.url.replace(/^https?:\/\//, "")} · {SITE.phone.display}
        </div>
      </div>
    ),
    size,
  );
}
