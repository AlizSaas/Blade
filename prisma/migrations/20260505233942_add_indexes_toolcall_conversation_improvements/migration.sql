-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "tokenCount" INTEGER;

-- CreateTable
CREATE TABLE "tool_call" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bike_request_sellerId_status_idx" ON "bike_request"("sellerId", "status");

-- CreateIndex
CREATE INDEX "bike_request_sellerId_createdAt_idx" ON "bike_request"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "message_conversationId_createdAt_idx" ON "message"("conversationId", "createdAt");
