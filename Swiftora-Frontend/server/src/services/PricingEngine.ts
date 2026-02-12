/**
 * PRICING ENGINE
 * 
 * Calculates vendor prices based on rate cards stored in DB.
 * Swiftora charges vendors slightly higher than actual courier cost.
 * Margin depends on accountType (B2B/B2C) and courier.
 * No hardcoded rates — all config comes from RateCard table.
 */

import { prisma } from '../lib/prisma.js';

export interface PricingInput {
    courierCost: number;
    userAccountType: string; // B2B or B2C
    courierName: string;
    weight: number; // in kg
}

export interface PricingResult {
    vendorCharge: number;
    margin: number;
    marginType: string;
    marginValue: number;
    courierCost: number;
}

/**
 * Calculate vendor price based on rate card.
 * vendorCharge = courierCost + margin
 */
export async function calculateVendorPrice(input: PricingInput): Promise<PricingResult> {
    const { courierCost, userAccountType, courierName, weight } = input;

    // Find matching rate card (with optional weight slab)
    const rateCard = await prisma.rateCard.findFirst({
        where: {
            accountType: userAccountType,
            courierName: courierName,
            isActive: true,
            OR: [
                // Exact weight slab match
                {
                    minWeight: { lte: weight },
                    maxWeight: { gte: weight },
                },
                // No weight slab (applies to all weights)
                {
                    minWeight: null,
                    maxWeight: null,
                },
            ],
        },
        orderBy: [
            // Prefer specific weight slab over general
            { minWeight: 'asc' },
        ],
    });

    if (!rateCard) {
        // No rate card found — use default margins from DB seed
        // If DB is empty, apply 15% B2C / 10% B2B as safe defaults
        const defaultPercentage = userAccountType === 'B2B' ? 10 : 15;
        const marginAmount = courierCost * defaultPercentage / 100;
        return {
            vendorCharge: Math.round((courierCost + marginAmount) * 100) / 100,
            margin: Math.round(marginAmount * 100) / 100,
            marginType: 'percentage',
            marginValue: defaultPercentage,
            courierCost,
        };
    }

    const marginValue = Number(rateCard.marginValue);
    let marginAmount: number;

    if (rateCard.marginType === 'percentage') {
        marginAmount = courierCost * marginValue / 100;
    } else {
        // flat
        marginAmount = marginValue;
    }

    return {
        vendorCharge: Math.round((courierCost + marginAmount) * 100) / 100,
        margin: Math.round(marginAmount * 100) / 100,
        marginType: rateCard.marginType,
        marginValue,
        courierCost,
    };
}

/**
 * Estimate vendor charge before booking.
 * courierCostEstimate should come from the courier's rate API when available.
 * If no estimate provided, returns zero (actual cost set after courier confirms booking).
 */
export async function estimateVendorCharge(input: {
    courierName: string;
    userAccountType: string;
    weight: number;
    paymentMode: string;
    courierCostEstimate?: number; // from courier rate API if available
}): Promise<PricingResult> {
    // Use actual courier cost from rate API if available
    if (input.courierCostEstimate && input.courierCostEstimate > 0) {
        return calculateVendorPrice({
            courierCost: input.courierCostEstimate,
            userAccountType: input.userAccountType,
            courierName: input.courierName,
            weight: input.weight,
        });
    }

    // Fallback: zero-cost (actual cost set after courier booking confirms)
    return calculateVendorPrice({
        courierCost: 0,
        userAccountType: input.userAccountType,
        courierName: input.courierName,
        weight: input.weight,
    });
}

/**
 * Seed default rate cards if none exist.
 * Called on server startup to ensure rate cards are available.
 */
export async function seedDefaultRateCards(): Promise<void> {
    const existingCount = await prisma.rateCard.count();
    if (existingCount > 0) return;

    const couriers = ['DELHIVERY', 'XPRESSBEES', 'EKART', 'BLITZ', 'INNOFULFILL'];
    const data = couriers.flatMap(courier => [
        {
            accountType: 'B2C',
            courierName: courier,
            marginType: 'percentage',
            marginValue: 15,
            isActive: true,
        },
        {
            accountType: 'B2B',
            courierName: courier,
            marginType: 'percentage',
            marginValue: 10,
            isActive: true,
        },
    ]);

    await prisma.rateCard.createMany({ data });
    console.log(`Seeded ${data.length} default rate cards`);
}
