-- CreateEnum
CREATE TYPE "ComplianceDocType" AS ENUM ('BBBEE_CERTIFICATE', 'TAX_CLEARANCE', 'HACCP_CERTIFICATE', 'FOOD_SAFETY_CERT', 'COMPANY_REGISTRATION', 'BANK_LETTER');

-- CreateEnum
CREATE TYPE "ComplianceDocStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ComplianceDoc" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "ComplianceDocType" NOT NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" "ComplianceDocStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionNote" TEXT,

    CONSTRAINT "ComplianceDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceDoc_farmerId_idx" ON "ComplianceDoc"("farmerId");

-- CreateIndex
CREATE INDEX "ComplianceDoc_status_idx" ON "ComplianceDoc"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceDoc_farmerId_type_key" ON "ComplianceDoc"("farmerId", "type");

-- AddForeignKey
ALTER TABLE "ComplianceDoc" ADD CONSTRAINT "ComplianceDoc_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
