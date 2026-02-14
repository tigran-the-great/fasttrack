-- CreateEnum
CREATE TYPE "shipment_status" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "sync_type" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "sync_status" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "orderId" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "destination" VARCHAR(500) NOT NULL,
    "status" "shipment_status" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMPTZ,
    "carrierRef" VARCHAR(100),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "shipmentId" UUID,
    "syncType" "sync_type" NOT NULL DEFAULT 'SCHEDULED',
    "status" "sync_status" NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_lastSyncedAt_idx" ON "shipments"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "shipments_createdAt_idx" ON "shipments"("createdAt");

-- CreateIndex
CREATE INDEX "sync_logs_shipmentId_idx" ON "sync_logs"("shipmentId");

-- CreateIndex
CREATE INDEX "sync_logs_syncedAt_idx" ON "sync_logs"("syncedAt");
