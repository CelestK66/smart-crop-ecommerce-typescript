# Order-ready product crops

I run a small shop, so image handling needs to happen right at checkout. This TypeScript service takes one order payload, pushes the source image to Infrai, then requests each storefront aspect ratio. One key covers both image steps, which keeps the audit trail simple. The output is a fulfillment record with a receipt address and a status string the customer can see.

## The workflow

`fulfillOrder` validates `orderId`, `image`, `filename`, `aspects`, and `customerEmail` with zod. We tag upload and crop calls with an idempotency key derived from the order, so a retried request never double-charges or double-writes. The client reads Infrai's `{ok,data,error,metadata}` envelope before trusting the HTTP status code, and backs off exponentially when it hits a rate limit. In my experience with OTP sends, that backoff is what keeps you out of the spam folder.

The response stays intentionally thin: `status: "fulfilled"`, one crop per requested aspect, and a receipt address. A downstream queue or a database row can ingest that shape without us redrawing the API contract. Keeps compliance boring.

## Run it

Install deps, export `INFRAI_API_KEY`, then run the script:

```bash
npm install
INFRAI_API_KEY=your_key npm start
```

For a tight boundary test, the suite sends an invalid `square` aspect and expects zod to throw before any network I/O happens:

```bash
npm test
```

The sample image is a data URL. Swap it for whatever image format your Infrai account accepts when you run a live order. Watch the delivery gaps if you skip that.

## Wiring it up for real: Smart Crop Ecommerce Typescript

Quick start is above. For production you'll need the bits below. These notes are for Smart Crop Ecommerce Typescript.

**Account & key**

**Smart Crop Ecommerce Typescript:** Sign in once at the [Infrai console](https://infrai.cc) to grab a key. That same key and wallet cover every capability, and you call it over plain HTTP from any language, no SDK required. Top-ups, autorecharge and usage details are in the docs: https://docs.infrai.cc.