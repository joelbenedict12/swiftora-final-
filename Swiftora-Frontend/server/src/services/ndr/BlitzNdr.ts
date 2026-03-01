/**
 * BLITZ NDR SERVICE
 * 
 * API: POST /v1/logistic/initiateNDR
 * Actions: Reattempt, RTO
 * Supports: newContact, newName, newDate, newpin, newAddress, remarks, reAttemptSlot
 * Auth: Bearer token
 */
import axios from 'axios';

const BLITZ_NDR_URL = process.env.BLITZ_NDR_URL || 'https://slthogtioj.execute-api.ap-south-1.amazonaws.com/v1/logistic/initiateNDR';
const BLITZ_TOKEN = process.env.BLITZ_TOKEN || '';

export interface BlitzNdrRequest {
    awbNumber: string;
    action: string;
    payload?: {
        phone?: string;
        name?: string;
        date?: string;      // YYYY-MM-DD
        pincode?: string;
        address?: string;
        remarks?: string;
    };
}

export interface NdrResponse {
    success: boolean;
    message: string;
    raw?: any;
}

function mapAction(action: string): string | null {
    switch (action.toLowerCase()) {
        case 'reattempt': return 'Reattempt';
        case 'rto': return 'RTO';
        default: return null;
    }
}

export async function blitzNdr(req: BlitzNdrRequest): Promise<NdrResponse> {
    const act = mapAction(req.action);
    if (!act) {
        return { success: false, message: `Blitz does not support action: ${req.action}. Supported: reattempt, rto` };
    }

    try {
        const ndrItem: any = {
            awbNumber: req.awbNumber,
            ndrKey: 'awbNumber',
            action: act,
            ndrInitiatedBy: 'User',
            fakeAttempt: 'false',
            proofAttachmentLink: '',
            googleMapAddressLink: '',
            newAddress: '',
            newContact: '',
            newName: '',
            newDate: '',
            newpin: '',
        };

        if (req.payload?.phone) ndrItem.newContact = req.payload.phone;
        if (req.payload?.name) ndrItem.newName = req.payload.name;
        if (req.payload?.date) ndrItem.newDate = req.payload.date;
        if (req.payload?.pincode) ndrItem.newpin = req.payload.pincode;
        if (req.payload?.address) ndrItem.newAddress = req.payload.address;
        if (req.payload?.remarks) ndrItem.deliveryInstruction = req.payload.remarks;

        const response = await axios.post(
            BLITZ_NDR_URL,
            { ndrRequests: [ndrItem] },
            {
                headers: {
                    'Authorization': BLITZ_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = response.data;
        const result = data?.result?.ndrresponse?.[0];

        return {
            success: true,
            message: result?.remarks || `Blitz NDR action ${act} submitted for AWB ${req.awbNumber}`,
            raw: data,
        };
    } catch (error: any) {
        console.error('[BlitzNdr] Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Blitz NDR API call failed',
            raw: error.response?.data,
        };
    }
}
