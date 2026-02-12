/**
 * WALLET SERVICE
 * 
 * Handles vendor wallet operations: balance checks, debits, credits.
 * All operations are atomic using Prisma transactions.
 */

import { prisma } from '../lib/prisma.js';

export interface WalletBalance {
    balance: number;
    creditLimit: number;
    availableBalance: number; // balance + creditLimit
}

export interface WalletTransactionResult {
    success: boolean;
    transactionId?: string;
    balanceBefore: number;
    balanceAfter: number;
    error?: string;
}

/**
 * Get current wallet balance for a merchant.
 */
export async function getBalance(merchantId: string): Promise<WalletBalance> {
    const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true, creditLimit: true },
    });

    if (!merchant) {
        return { balance: 0, creditLimit: 0, availableBalance: 0 };
    }

    const balance = Number(merchant.walletBalance);
    const creditLimit = Number(merchant.creditLimit);

    return {
        balance,
        creditLimit,
        availableBalance: balance + creditLimit,
    };
}

/**
 * Check if merchant has sufficient balance for a charge.
 */
export async function hasSufficientBalance(merchantId: string, amount: number): Promise<boolean> {
    const { availableBalance } = await getBalance(merchantId);
    return availableBalance >= amount;
}

/**
 * Debit vendor wallet (used when shipment is created).
 * Atomic operation: checks balance + deducts + creates transaction record.
 */
export async function debit(
    merchantId: string,
    amount: number,
    orderId?: string,
    description?: string
): Promise<WalletTransactionResult> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Get current balance with lock
            const merchant = await tx.merchant.findUnique({
                where: { id: merchantId },
                select: { walletBalance: true, creditLimit: true },
            });

            if (!merchant) {
                throw new Error('Merchant not found');
            }

            const currentBalance = Number(merchant.walletBalance);
            const creditLimit = Number(merchant.creditLimit);
            const availableBalance = currentBalance + creditLimit;

            if (availableBalance < amount) {
                throw new Error(`Insufficient balance. Available: ₹${availableBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`);
            }

            const newBalance = currentBalance - amount;

            // Update merchant balance
            await tx.merchant.update({
                where: { id: merchantId },
                data: { walletBalance: newBalance },
            });

            // Create transaction record
            const transaction = await tx.walletTransaction.create({
                data: {
                    merchantId,
                    orderId: orderId || null,
                    amount,
                    type: 'DEBIT',
                    status: 'COMPLETED',
                    reference: orderId ? `ORDER-${orderId}` : undefined,
                    description: description || 'Shipment charge',
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                },
            });

            return {
                success: true,
                transactionId: transaction.id,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
            };
        });

        return result;
    } catch (error: any) {
        return {
            success: false,
            balanceBefore: 0,
            balanceAfter: 0,
            error: error.message || 'Failed to debit wallet',
        };
    }
}

/**
 * Credit vendor wallet (used by admin to add funds).
 */
export async function credit(
    merchantId: string,
    amount: number,
    description?: string,
    reference?: string
): Promise<WalletTransactionResult> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const merchant = await tx.merchant.findUnique({
                where: { id: merchantId },
                select: { walletBalance: true },
            });

            if (!merchant) {
                throw new Error('Merchant not found');
            }

            const currentBalance = Number(merchant.walletBalance);
            const newBalance = currentBalance + amount;

            await tx.merchant.update({
                where: { id: merchantId },
                data: { walletBalance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: {
                    merchantId,
                    amount,
                    type: 'RECHARGE',
                    status: 'COMPLETED',
                    reference: reference || `CREDIT-${Date.now()}`,
                    description: description || 'Wallet recharge',
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                },
            });

            return {
                success: true,
                transactionId: transaction.id,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
            };
        });

        return result;
    } catch (error: any) {
        return {
            success: false,
            balanceBefore: 0,
            balanceAfter: 0,
            error: error.message || 'Failed to credit wallet',
        };
    }
}

/**
 * Refund wallet (used when shipment is cancelled).
 */
export async function refund(
    merchantId: string,
    amount: number,
    orderId?: string,
    description?: string
): Promise<WalletTransactionResult> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const merchant = await tx.merchant.findUnique({
                where: { id: merchantId },
                select: { walletBalance: true },
            });

            if (!merchant) {
                throw new Error('Merchant not found');
            }

            const currentBalance = Number(merchant.walletBalance);
            const newBalance = currentBalance + amount;

            await tx.merchant.update({
                where: { id: merchantId },
                data: { walletBalance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: {
                    merchantId,
                    orderId: orderId || null,
                    amount,
                    type: 'REFUND',
                    status: 'COMPLETED',
                    reference: orderId ? `REFUND-${orderId}` : undefined,
                    description: description || 'Shipment cancellation refund',
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                },
            });

            return {
                success: true,
                transactionId: transaction.id,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
            };
        });

        return result;
    } catch (error: any) {
        return {
            success: false,
            balanceBefore: 0,
            balanceAfter: 0,
            error: error.message || 'Failed to refund wallet',
        };
    }
}

/**
 * Get wallet transaction history for a merchant.
 */
export async function getTransactions(
    merchantId: string,
    options?: { page?: number; limit?: number; type?: string }
) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { merchantId };
    if (options?.type) {
        where.type = options.type;
    }

    const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                order: {
                    select: { orderNumber: true, courierName: true },
                },
            },
        }),
        prisma.walletTransaction.count({ where }),
    ]);

    return {
        transactions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
