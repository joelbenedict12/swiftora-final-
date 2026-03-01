/**
 * DELHIVERY NDR SERVICE
 * 
 * API: POST https://track.delhivery.com/api/p/update
 * Actions: RE-ATTEMPT, PICKUP_RESCHEDULE
 * Auth: Token-based header
 */
import axios from 'axios';

const DELHIVERY_NDR_URL = process.env.DELHIVERY_NDR_URL || 'https://track.delhivery.com/api/p/update';
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN || '';

export interface DelhiveryNdrRequest {
    awbNumber: string;
    action: string;
}

export interface NdrResponse {
    success: boolean;
    message: string;
    raw?: any;
}

/**
 * Map Swiftora action to Delhivery action enum
 */
function mapAction(action: string): string | null {
    switch (action.toLowerCase()) {
        case 'reattempt': return 'RE-ATTEMPT';
        case 'reschedule': return 'PICKUP_RESCHEDULE';
        default: return null;
    }
}

export async function delhiveryNdr(req: DelhiveryNdrRequest): Promise<NdrResponse> {
    const act = mapAction(req.action);
    if (!act) {
        return { success: false, message: `Delhivery does not support action: ${req.action}. Supported: reattempt, reschedule` };
    }

    try {
        const response = await axios.post(
            DELHIVERY_NDR_URL,
            { data: [{ waybill: req.awbNumber, act }] },
            {
                headers: {
                    'Authorization': `Token ${DELHIVERY_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        return {
            success: true,
            message: `Delhivery NDR action ${act} submitted for AWB ${req.awbNumber}`,
            raw: response.data,
        };
    } catch (error: any) {
        console.error('[DelhiveryNdr] Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Delhivery NDR API call failed',
            raw: error.response?.data,
        };
    }
}
