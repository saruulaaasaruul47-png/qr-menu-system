export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "QR Menu System API",
    version: "1.0.0",
    description: "Restaurant QR menu, order, payment, table, notification, analytics API.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Restaurants" },
    { name: "Tables" },
    { name: "Menu" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Notifications" },
    { name: "Analytics" },
    { name: "QR" },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged in" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register owner and restaurant",
        responses: { 201: { description: "Registered" } },
      },
    },
    "/restaurants/public/{id}": {
      get: {
        tags: ["Restaurants"],
        summary: "Get public restaurant profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Restaurant profile" } },
      },
    },
    "/tables": {
      get: {
        tags: ["Tables"],
        summary: "List restaurant tables",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Tables" } },
      },
      post: {
        tags: ["Tables"],
        summary: "Create one or many auto-numbered tables",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Table(s) created" } },
      },
    },
    "/categories/public": {
      get: {
        tags: ["Menu"],
        summary: "List public categories",
        parameters: [{ name: "restaurantId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Categories" } },
      },
    },
    "/foods/public": {
      get: {
        tags: ["Menu"],
        summary: "List public foods with search/category filters",
        parameters: [
          { name: "restaurantId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "availableOnly", in: "query", schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "Foods" } },
      },
    },
    "/foods": {
      post: {
        tags: ["Menu"],
        summary: "Create food, optionally with inventory tracking",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FoodInput" },
            },
          },
        },
        responses: { 201: { description: "Food created" } },
      },
    },
    "/orders/guest": {
      post: {
        tags: ["Orders"],
        summary: "Create QR/customer order after payment confirmation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" },
            },
          },
        },
        responses: {
          201: { description: "Order created" },
          409: { description: "Inventory unavailable" },
        },
      },
    },
    "/orders/guest/status/{guestSessionId}": {
      get: {
        tags: ["Orders"],
        summary: "Customer realtime/status polling endpoint",
        parameters: [{ name: "guestSessionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Guest orders" } },
      },
    },
    "/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Kitchen/waiter/cashier status update",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Order updated" } },
      },
    },
    "/payments/demo/create": {
      post: {
        tags: ["Payments"],
        summary: "Create demo payment for an order with PENDING status",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DemoPaymentCreateRequest" },
            },
          },
        },
        responses: { 201: { description: "Demo payment created" } },
      },
    },
    "/payments/demo/confirm": {
      post: {
        tags: ["Payments"],
        summary: "Manually mark demo payment as SUCCESS",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPaymentActionRequest" } } },
        },
        responses: { 200: { description: "Payment marked successful" } },
      },
    },
    "/payments/demo/fail": {
      post: {
        tags: ["Payments"],
        summary: "Manually mark demo payment as FAILED",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPaymentActionRequest" } } },
        },
        responses: { 200: { description: "Payment marked failed" } },
      },
    },
    "/payments/demo/refund": {
      post: {
        tags: ["Payments"],
        summary: "Refund a successful demo payment",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPaymentActionRequest" } } },
        },
        responses: { 200: { description: "Payment refunded" } },
      },
    },
    "/payments/{paymentId}/status": {
      get: {
        tags: ["Payments"],
        summary: "Get public payment status for checkout polling",
        parameters: [{ name: "paymentId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Payment status" } },
      },
    },
    "/waiter-calls": {
      post: {
        tags: ["Notifications"],
        summary: "Customer calls waiter or requests bill",
        responses: { 201: { description: "Waiter call created" } },
      },
    },
    "/qr/table/{tableId}": {
      get: {
        tags: ["QR"],
        summary: "Generate QR data URL for table menu",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "tableId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "QR data URL" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      FoodInput: {
        type: "object",
        required: ["name", "price"],
        properties: {
          restaurantId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          imageUrl: { type: "string" },
          trackInventory: { type: "boolean" },
          stockQuantity: { type: "integer", minimum: 0, nullable: true },
          isAvailable: { type: "boolean" },
        },
      },
      CreateOrderRequest: {
        type: "object",
        required: ["restaurantId", "guestSessionId", "items"],
        properties: {
          restaurantId: { type: "string", format: "uuid" },
          tableId: { type: "string", format: "uuid" },
          guestSessionId: { type: "string" },
          source: { type: "string", enum: ["QR", "CASHIER", "WAITER"] },
          payment: { type: "object" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["foodId", "quantity"],
              properties: {
                foodId: { type: "string", format: "uuid" },
                quantity: { type: "integer", minimum: 1 },
                modifierOptionIds: { type: "array", items: { type: "string", format: "uuid" } },
              },
            },
          },
        },
      },
      DemoPaymentCreateRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", format: "uuid" },
          provider: { type: "string", enum: ["DEMO", "Demo Payment"], default: "DEMO" },
          autoResolve: { type: "boolean", default: true },
        },
      },
      DemoPaymentActionRequest: {
        type: "object",
        required: ["paymentId"],
        properties: {
          paymentId: { type: "string", format: "uuid" },
        },
      },
    },
  },
};

export const openApiHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QR Menu API Docs</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: #fffaf4; color: #27272a; }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 20px; }
    h1 { margin: 0 0 8px; font-size: 36px; }
    p { color: #71717a; }
    section { margin-top: 18px; border: 1px solid #fed7aa; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 42px rgba(251,146,60,.10); }
    h2 { margin: 0; padding: 14px 18px; background: #fff7ed; font-size: 18px; }
    details { border-top: 1px solid #ffedd5; padding: 12px 18px; }
    summary { cursor: pointer; font-weight: 800; }
    code { color: #ea580c; font-weight: 800; }
    .method { display: inline-block; min-width: 58px; color: #fff; background: #fb923c; border-radius: 999px; padding: 3px 9px; margin-right: 10px; font-size: 12px; text-align: center; }
    a { color: #ea580c; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <h1>QR Menu API Docs</h1>
    <p>OpenAPI JSON: <a href="/openapi.json">/openapi.json</a></p>
    ${openApiSpec.tags
      .map((tag) => {
        const entries = Object.entries(openApiSpec.paths)
          .flatMap(([path, methods]) =>
            Object.entries(methods)
              .filter(([, operation]) => operation.tags?.includes(tag.name))
              .map(([method, operation]) => ({ path, method: method.toUpperCase(), operation })),
          );
        if (!entries.length) return "";
        return `<section><h2>${tag.name}</h2>${entries
          .map(
            ({ path, method, operation }) =>
              `<details><summary><span class="method">${method}</span><code>/api/v1${path}</code></summary><p>${operation.summary || ""}</p></details>`,
          )
          .join("")}</section>`;
      })
      .join("")}
  </main>
</body>
</html>`;
