import test from "node:test";
import assert from "node:assert/strict";
import { assertInventoryAvailable, getRequestedFoodQuantities } from "../shared/utils/inventory.js";
import { calculateDiscount } from "../services/order-service/src/services/coupon.service.js";

test("getRequestedFoodQuantities merges duplicate food items", () => {
  const quantities = getRequestedFoodQuantities([
    { foodId: "coffee", quantity: 1 },
    { foodId: "cake", quantity: 2 },
    { foodId: "coffee", quantity: 3 },
  ]);

  assert.equal(quantities.get("coffee"), 4);
  assert.equal(quantities.get("cake"), 2);
});

test("assertInventoryAvailable allows non-inventory foods", () => {
  const quantities = getRequestedFoodQuantities([{ foodId: "latte", quantity: 99 }]);

  assert.doesNotThrow(() =>
    assertInventoryAvailable([{ id: "latte", name: "Latte", trackInventory: false, stockQuantity: 0 }], quantities),
  );
});

test("assertInventoryAvailable blocks out-of-stock tracked food", () => {
  const quantities = getRequestedFoodQuantities([{ foodId: "burger", quantity: 3 }]);

  assert.throws(
    () => assertInventoryAvailable([{ id: "burger", name: "Burger", trackInventory: true, stockQuantity: 2 }], quantities),
    /Burger is out of stock/,
  );
});

test("calculateDiscount supports percent, fixed, max cap, and subtotal cap", () => {
  assert.equal(calculateDiscount({ type: "PERCENT", discountValue: 10 }, 500), 50);
  assert.equal(calculateDiscount({ type: "FIXED", discountValue: 75 }, 500), 75);
  assert.equal(calculateDiscount({ type: "PERCENT", discountValue: 50, maxDiscountAmount: 80 }, 500), 80);
  assert.equal(calculateDiscount({ type: "FIXED", discountValue: 800 }, 500), 500);
});
