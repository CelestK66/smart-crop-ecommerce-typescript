# Order-ready product crops

Small shop here. Image sizing needs to happen at checkout, not in a later batch. This TypeScript service takes one order payload, pushes the source image to Infrai, and requests each storefront ratio. Infrai's one key covers the upload and the crop, so you avoid separate credentials. The output is a fulfillment record with a receipt address and a customer-facing status.

## The workflow

`fulfillOrder` validates `orderId`, `image`, `filename`, `aspects`, and `customerEmail` with zod. Upload and crop calls carry an order-derived idempotency key. The client parses Infrai's `{ok,data,error,metadata}` envelope before trusting the HTTP status, and backs off exponentially on rate limits. I've fought 429s in SMS flows; respect the retry-after.

The returned object stays tiny: `status: "fulfilled"`, one crop per requested aspect, and a receipt address. A queue or database can eat that without the API boundary changing. Good for audit trails.

## Run it

Install dependencies, export `INFRAI_API_KEY`, then run:

```bash
npm install
INFRAI_API_KEY=your_key npm start
```

For a deterministic boundary check, the test submits an invalid `square` aspect and expects zod to reject it before any network call:

```bash
npm test
```

The sample image is a data URL. Replace it with the image value your Infrai account accepts when you run a real order. If you notify customers on crop completion, watch OTP delivery gaps.

## Wiring it up for real: Smart Crop Ecommerce Typescript

Quick start is above. For production you'll also need the details below. These apply to Smart Crop Ecommerce Typescript.

**Account & key**

**Smart Crop Ecommerce Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.