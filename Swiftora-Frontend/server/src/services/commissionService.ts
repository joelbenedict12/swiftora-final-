import { prisma } from '../lib/prisma.js';

const COMMISSION_KEY = 'platform_commission_percent';
const MIN_RECHARGE_KEY = 'min_recharge_amount';
const QR_URL_KEY = 'platform_qr_url';
const QC_CHARGE_KEY = 'qc_charge';

export async function getSetting(key: string): Promise<string | null> {
    const setting = await prisma.platformSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
    await prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}

export async function getAllSettings(): Promise<Record<string, string>> {
    const settings = await prisma.platformSetting.findMany();
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

export async function getCommissionPercent(): Promise<number> {
    const val = await getSetting(COMMISSION_KEY);
    const parsed = val ? parseFloat(val) : NaN;
    return isNaN(parsed) ? 15 : parsed;
}

export async function updateCommissionPercent(percent: number): Promise<void> {
    if (percent < 0 || percent > 100) {
        throw new Error('Commission must be between 0 and 100');
    }
    await setSetting(COMMISSION_KEY, String(percent));
}

export async function getMinRechargeAmount(): Promise<number> {
    const val = await getSetting(MIN_RECHARGE_KEY);
    const parsed = val ? parseFloat(val) : NaN;
    return isNaN(parsed) ? 500 : parsed;
}

export async function updateMinRechargeAmount(amount: number): Promise<void> {
    if (amount < 0) throw new Error('Minimum recharge amount cannot be negative');
    await setSetting(MIN_RECHARGE_KEY, String(amount));
}

export async function getQrUrl(): Promise<string | null> {
    return getSetting(QR_URL_KEY);
}

export async function updateQrUrl(url: string): Promise<void> {
    await setSetting(QR_URL_KEY, url);
}

export async function getQcCharge(): Promise<number> {
    const val = await getSetting(QC_CHARGE_KEY);
    const parsed = val ? parseFloat(val) : NaN;
    return isNaN(parsed) ? 15 : parsed;
}

export async function updateQcCharge(amount: number): Promise<void> {
    if (amount < 0 || amount > 100) throw new Error('QC charge must be between 0 and 100');
    await setSetting(QC_CHARGE_KEY, String(amount));
}
