-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('OPEN', 'EVALUATION', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'AWARDED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'GOV_BUYER';

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "quantityKg" DECIMAL(12,2) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveryProvince" "Province" NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "budgetPerKg" DECIMAL(10,2),
    "status" "TenderStatus" NOT NULL DEFAULT 'OPEN',
    "closingDate" TIMESTAMP(3) NOT NULL,
    "requiresBbbee" BOOLEAN NOT NULL DEFAULT true,
    "requiresHaccp" BOOLEAN NOT NULL DEFAULT false,
    "requiresTaxClear" BOOLEAN NOT NULL DEFAULT true,
    "awardedBidId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderBid" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "pricePerKg" DECIMAL(10,2) NOT NULL,
    "quantityKg" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "complianceDocs" JSONB NOT NULL DEFAULT '[]',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "TenderBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tender_referenceNumber_key" ON "Tender"("referenceNumber");

-- CreateIndex
CREATE INDEX "Tender_status_idx" ON "Tender"("status");

-- CreateIndex
CREATE INDEX "Tender_buyerId_idx" ON "Tender"("buyerId");

-- CreateIndex
CREATE INDEX "TenderBid_tenderId_idx" ON "TenderBid"("tenderId");

-- CreateIndex
CREATE INDEX "TenderBid_farmerId_idx" ON "TenderBid"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "TenderBid_tenderId_farmerId_key" ON "TenderBid"("tenderId", "farmerId");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
