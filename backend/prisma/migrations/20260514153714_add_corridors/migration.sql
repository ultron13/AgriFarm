-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Corridor" ADD VALUE 'KZN_GAUTENG';
ALTER TYPE "Corridor" ADD VALUE 'WESTERN_CAPE_GAUTENG';
ALTER TYPE "Corridor" ADD VALUE 'EASTERN_CAPE_GAUTENG';
ALTER TYPE "Corridor" ADD VALUE 'NORTHERN_CAPE_GAUTENG';
ALTER TYPE "Corridor" ADD VALUE 'FREE_STATE_GAUTENG';
ALTER TYPE "Corridor" ADD VALUE 'NORTH_WEST_GAUTENG';
