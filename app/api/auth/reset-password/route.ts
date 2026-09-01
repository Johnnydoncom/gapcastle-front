import { NextRequest, NextResponse } from "next/server";

// Force HTTPS for the live server. Using http:// causes a 301/302 redirect which
// Node.js follows but downgrades POST → GET, triggering a 405 on Laravel.
const rawApiUrl = process.env.API_INTERNAL_URL
  || process.env.NEXT_PUBLIC_API_URL
  || "http://gapcastle.test/api/v1";
const API_URL = rawApiUrl.replace(/^http:\/\/bills\.gapcastle\.com/, "https://bills.gapcastle.com");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to reach the server. Please try again." },
      { status: 502 }
    );
  }
}
