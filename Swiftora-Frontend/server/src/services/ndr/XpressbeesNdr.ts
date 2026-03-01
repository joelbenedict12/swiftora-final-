/**
 * XPRESSBEES NDR SERVICE
 * 
 * API: POST https://shipment.xpressbees.com/api/ndr/create
 * Actions: re-attempt, change_address, change_phone
 * Auth: Bearer token
 */
import axios from 'axios';

const XPRESSBEES_NDR_URL = 'https://shipment.xpressbees.com/api/ndr/create';

function getToken(): string {
    const raw = process.env.XPRESSBEES_TOKEN || '';
    return raw.replace(/^Bearer\s+/i, '').trim();
}

export interface XpressbeesNdrRequest {
    awbNumber: string;
    action: string;
    payload?: {
        date?: string;        // YYYY-MM-DD for re-attempt
        name?: string;
        address1?: string;
        address2?: string;
        phone?: string;
    };
}

export interface NdrResponse {
    success: boolean;
    message: string;
    raw?: any;
}

function mapAction(action: string): string | null {
    switch (action.toLowerCase()) {
        case 'reattempt': return 're-attempt';
        case 'update_address': return 'change_address';
        case 'update_phone': return 'change_phone';
        default: return null;
    }
}

export async function xpressbeesNdr(req: XpressbeesNdrRequest): Promise<NdrResponse> {
    const act = mapAction(req.action);
    if (!act) {
        return { success: false, message: `Xpressbees does not support action: ${req.action}. Supported: reattempt, update_address, update_phone` };
    }

    try {
        const token = getToken();
        const ndrItem: any = { awb: req.awbNumber, action: act };

        if (act === 're-attempt' && req.payload?.date) {
            ndrItem.action_data = { re_attempt_date: req.payload.date };
        } else if (act === 'change_address') {
            ndrItem.action_data = {
                name: req.payload?.name || '',
                address_1: req.payload?.address1 || '',
                address_2: req.payload?.address2 || '',
            };
        } else if (act === 'change_phone') {
            ndrItem.action_data = { phone: req.payload?.phone || '' };
        }

        const response = await axios.post(
            XPRESSBEES_NDR_URL,
            [ndrItem],
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data;
        const result = Array.isArray(data) ? data[0] : data;

        return {
            success: result?.status === true,
            message: result?.message || `Xpressbees NDR action ${act} submitted for AWB ${req.awbNumber}`,
            raw: data,
        };
    } catch (error: any) {
        console.error('[XpressbeesNdr] Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Xpressbees NDR API call failed',
            raw: error.response?.data,
        };
    }
}
