import assert from "node:assert/strict";
import test from "node:test";
import { CreateOrderBody } from "@workspace/api-zod";

test("a binding order can request payment manually after checkout", () => {
  const parsed = CreateOrderBody.safeParse({
    email: "customer@example.com",
    phone: "+49123456789",
    firstName: "Test",
    lastName: "Customer",
    address: "Example Street 1",
    postalCode: "10115",
    city: "Berlin",
    country: "Germany",
    paymentMethod: "manual",
    items: [
      {
        productId: "barrique",
        name: "Barrique",
        scent: "Thé",
        quantity: 1,
        unitPrice: 68,
      },
    ],
  });

  assert.equal(parsed.success, true);
});
