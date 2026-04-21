import { NextResponse } from "next/server";

type DemoRequest = {
  count?: number;
  price_microusdc?: number;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DemoRequest;
  const count = body.count ?? 55;
  const priceMicrousdc = body.price_microusdc ?? 2500;

  const demoUrl = process.env.PATRI_DEMO_RUN_URL;
  const testMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1" || process.env.PATRI_E2E_TEST_MODE === "1";

  if (!demoUrl || testMode) {
    return NextResponse.json({
      interactions: Math.max(count, 55),
      total_spent_microusdc: Math.max(count, 55) * priceMicrousdc,
      avg_price_microusdc: priceMicrousdc,
      txHashes: [],
      simulated: true,
    });
  }

  try {
    const response = await fetch(demoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count, price_microusdc: priceMicrousdc }),
      cache: "no-store",
    });

    const payload = await response.text();
    if (!response.ok) {
      return new NextResponse(payload || "Demo backend returned an error", { status: response.status });
    }

    try {
      return NextResponse.json(JSON.parse(payload));
    } catch {
      return NextResponse.json({ raw: payload });
    }
  } catch {
    return new NextResponse("Unable to reach demo backend", { status: 502 });
  }
}
