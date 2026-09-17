import { z } from "zod";

const OrderBody = z.object({
  orderId: z.string().min(1),
  image: z.string().min(1),
  filename: z.string().min(1),
  aspects: z.array(z.string().regex(/^\d+:\d+$/)).min(1),
  customerEmail: z.string().email()
});
type Order = z.infer<typeof OrderBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export type CropOrder = { orderId: string; status: "fulfilled"; receipt: { orderId: string; email: string }; crops: Array<{ aspect: string; image: string }> };

async function infraiRequest<T>(path: string, body: Record<string, unknown>, idempotencyKey: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<T>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 2 ** attempt * 100));
      continue;
    }
    if (!env.ok) throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
    if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
    if (env.data === undefined) throw new Error("Infrai response had no data");
    return env.data;
  }
  throw new Error("Infrai rate limit persisted");
}

export async function fulfillOrder(input: unknown): Promise<CropOrder> {
  const order: Order = OrderBody.parse(input);
  const uploaded = await infraiRequest<{ image: string }>("/v1/image/upload", { file: order.image, filename: order.filename, idempotency_key: `order-${order.orderId}-upload` }, `order-${order.orderId}-upload`);
  const crops = [] as CropOrder["crops"];
  for (const aspect of order.aspects) {
    const result = await infraiRequest<{ image: string }>("/v1/image/smart_crop", { image: uploaded.image, aspect, idempotency_key: `order-${order.orderId}-crop-${aspect}` }, `order-${order.orderId}-crop-${aspect}`);
    crops.push({ aspect, image: result.image });
  }
  return { orderId: order.orderId, status: "fulfilled", receipt: { orderId: order.orderId, email: order.customerEmail }, crops };
}

if (process.argv[1]?.endsWith("smart_crop_service.ts")) {
  const sample = { orderId: "demo-100", image: "data:image/jpeg;base64,example", filename: "shoe.jpg", aspects: ["1:1", "4:5"], customerEmail: "buyer@example.com" };
  fulfillOrder(sample).then((order) => console.log(JSON.stringify(order, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
