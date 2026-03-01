/**
 * EKART NDR SERVICE
 * 
 * API: POST /api/v2/package/ndr
 * Actions: Re-Attempt, RTO
 * Supports: date, phone, address, instructions
 * Auth: Bearer JWT (same as Ekart shipment auth)
 */
import axios from 'axios';

const EKART_BASE_URL = process.env.EKART_BASE_URL || 'https://app.elite.ekartlogistics.in';

export interface EkartNdrRequest {
    awbNumber: string;
    action: string;
    payload?: {
        date?: string;       // reattempt date in ISO
        phone?: string;      // 10-digit phone
        address?: string;
        instructions?: string;
    };
}

export interface NdrResponse {
    success: boolean;
    message: string;
    raw?: any;
}

/**
 * Map Swiftora action to Ekart action enum
 */
function mapAction(action: string): string | null {
    switch (action.toLowerCase()) {
        case 'reattempt': return 'Re-Attempt';
        case 'rto': return 'RTO';
        default: return null;
    }
}

async function getEkartToken(): Promise<string> {
    // Re-use the Ekart auth from EkartService
    const { ekartService } = await import('../courier/EkartService.js');
    return (ekartService as any).authenticate();
}

export async function ekartNdr(req: EkartNdrRequest): Promise<NdrResponse> {
    const act = mapAction(req.action);
    if (!act) {
        return { success: false, message: `Ekart does not support action: ${req.action}. Supported: reattempt, rto` };
    }

    try {
        const token = await getEkartToken();
        const body: any = {
            action: act,
            wbn: req.awbNumber,
        };

        if (req.payload?.date) {
            body.date = new Date(req.payload.date).getTime();
        }
        if (req.payload?.phone) {
            body.phone = req.payload.phone;
        }
        if (req.payload?.address) {
            body.address = req.payload.address;
        }
        if (req.payload?.instructions) {
            body.instructions = req.payload.instructions;
        }

        const response = await axios.post(
            `${EKART_BASE_URL}/api/v2/package/ndr`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data;
        return {
            success: data.status === true,
            message: data.remark || `Ekart NDR action ${act} submitted for AWB ${req.awbNumber}`,
            raw: data,
        };
    } catch (error: any) {
        console.error('[EkartNdr] Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.remark || error.message || 'Ekart NDR API call failed',
            raw: error.response?.data,
        };
    }
}
