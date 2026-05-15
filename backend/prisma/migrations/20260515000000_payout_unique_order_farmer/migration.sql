-- Prevent double-payout: each (order, farmer) pair can only ever have one payout row.
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_orderId_farmerId_key" UNIQUE ("orderId", "farmerId");
