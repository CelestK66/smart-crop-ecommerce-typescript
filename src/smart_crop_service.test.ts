import assert from "node:assert/strict";
import { fulfillOrder } from "./smart_crop_service.js";

async function main() {
  await assert.rejects(() => fulfillOrder({ orderId: "x", image: "data", filename: "x.jpg", aspects: ["square"], customerEmail: "buyer@example.com" }));
  console.log("invalid aspect is rejected before fulfillment");
}
main();
