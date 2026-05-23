-- CreateTable
CREATE TABLE "PaymentCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "funding" TEXT,
    "country" TEXT,
    "cardholderName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCustomer_userId_key" ON "PaymentCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCustomer_stripeCustomerId_key" ON "PaymentCustomer"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaymentMethod_stripePaymentMethodId_key" ON "UserPaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "UserPaymentMethod_userId_idx" ON "UserPaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "UserPaymentMethod_customerId_idx" ON "UserPaymentMethod"("customerId");

-- AddForeignKey
ALTER TABLE "UserPaymentMethod" ADD CONSTRAINT "UserPaymentMethod_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "PaymentCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
