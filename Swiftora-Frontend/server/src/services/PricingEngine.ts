/**
 * PRICING ENGINE
 * 
 * Calculates vendor prices based on rate cards stored in DB.
 * Swiftora charges vendors slightly higher than actual courier cost.
 * Margin depends on accountType (B2B/B2C) and courier.
 * No hardcoded rates — all config comes from RateCard table.
 */

import { prisma } from '../lib/prisma.js';
import { getCommissionPercent } from './commissionService.js';

export interface PricingInput {
    courierCost: number;
    userAccountType: string; // B2B or B2C
    courierName: string;
    weight: number; // in kg
    merchantId?: string;
}

export interface PricingResult {
    vendorCharge: number;
    margin: number;
    marginType: string;
    marginValue: number;
    courierCost: number;
    additionalChargeTotal: number;
    finalPrice: number;
}

/**
 * Calculate vendor price. Uses per-customer margin if configured (marginValue > 0),
 * otherwise falls back to global platform commission from admin settings.
 */
export async function calculateVendorPrice(input: PricingInput): Promise<PricingResult> {
    const { courierCost, merchantId } = input;

    let marginType = 'percentage';
    let marginValue = 0;
    let marginAmount = 0;

    let usedCustomerMargin = false;
    if (merchantId) {
        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { marginType: true, marginValue: true },
        });
        if (merchant && Number(merchant.marginValue) > 0) {
            marginType = merchant.marginType;
            marginValue = Number(merchant.marginValue);
            usedCustomerMargin = true;
        }
    }

    if (!usedCustomerMargin) {
        marginValue = await getCommissionPercent();
        marginType = 'percentage';
    }

    if (marginType === 'percentage') {
        marginAmount = courierCost * marginValue / 100;
    } else {
        marginAmount = marginValue;
    }

    const vendorCharge = Math.round((courierCost + marginAmount) * 100) / 100;

    return {
        vendorCharge,
        margin: Math.round(marginAmount * 100) / 100,
        marginType,
        marginValue,
        courierCost,
        additionalChargeTotal: 0,
        finalPrice: vendorCharge,
    };
}

/**
 * Calculate the sum of additional charges for an order.
 * Percentage charges are calculated against the courier cost.
 */
export async function calculateAdditionalChargeTotal(orderId?: string, courierCost: number = 0): Promise<number> {
    if (!orderId) return 0;
    const charges = await prisma.shipmentAdditionalCharge.findMany({ where: { orderId } });
    let total = 0;
    for (const c of charges) {
        if (c.chargeType === 'percentage') {
            total += courierCost * Number(c.chargeValue) / 100;
        } else {
            total += Number(c.chargeValue);
        }
    }
    return Math.round(total * 100) / 100;
}

/**
 * Calculate full pricing for a shipped order including additional charges.
 */
export async function calculateFullOrderPrice(input: PricingInput & { orderId?: string }): Promise<PricingResult> {
    const base = await calculateVendorPrice(input);
    if (!input.orderId) return base;

    const additionalChargeTotal = await calculateAdditionalChargeTotal(input.orderId, input.courierCost);
    const finalPrice = Math.round((base.courierCost + base.margin + additionalChargeTotal) * 100) / 100;

    return {
        ...base,
        additionalChargeTotal,
        finalPrice,
        vendorCharge: finalPrice,
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
    courierCostEstimate?: number;
    merchantId?: string;
}): Promise<PricingResult> {
    if (input.courierCostEstimate && input.courierCostEstimate > 0) {
        return calculateVendorPrice({
            courierCost: input.courierCostEstimate,
            userAccountType: input.userAccountType,
            courierName: input.courierName,
            weight: input.weight,
            merchantId: input.merchantId,
        });
    }

    return calculateVendorPrice({
        courierCost: 0,
        userAccountType: input.userAccountType,
        courierName: input.courierName,
        weight: input.weight,
        merchantId: input.merchantId,
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
