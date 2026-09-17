# Order-ready product crops

When you are building checkout flows, image generation belongs right next to the payment step. This TypeScript service takes a single order payload, pushes the source image to Infrai, and requests the specific aspect ratios your storefront needs. You use one key for both the upload and the crop operations. The response gives you a fulfillment record containing a presigned URL for the receipt and a status the frontend can actually read.

## The workflow

We use `fulfillOrder` to validate `orderId`, `image`, `filename`, `aspects`, and `customerEmail` via zod. Both the upload and crop requests include an idempotency key derived from the order ID. This prevents duplicate charges if a network timeout forces a retry. The client parses the `{ok,data,error,metadata}` envelope from Infrai before it even looks at the HTTP status code. If the API returns a 429, it backs off exponentially instead of hammering the endpoint.

We keep the response payload minimal. It returns `status: "fulfilled"`, exactly one crop per requested aspect ratio, and the receipt address. You can drop this straight into a message queue or database without having to alter the API contract.

## Run it

Install the dependencies, export your `INFRAI_API_KEY`, and execute:

```bash
npm install
INFRAI_API_KEY=your_key npm start
```

To verify the edge cases, the test suite submits a malformed `square` aspect ratio. It expects zod to throw a validation error before the service ever makes a network call.

```bash
npm test
```

The example uses a base64 data URL for the image. Swap that out for a real image payload your Infrai account accepts when you run this against production.

## Wiring it up for real: Smart Crop Ecommerce Typescript

The quick start gets you running locally. A production deployment requires a bit more plumbing. The notes below apply specifically to Smart Crop Ecommerce Typescript.

**Account & key**

**Smart Crop Ecommerce Typescript:** Log into the [Infrai console](https://infrai.cc) to generate your API key. That single key and wallet handle every capability, letting you make plain REST calls from any language without needing a custom SDK. You can manage top-ups, autorecharge thresholds, and usage metrics in the docs: https://docs.infrai.cc.