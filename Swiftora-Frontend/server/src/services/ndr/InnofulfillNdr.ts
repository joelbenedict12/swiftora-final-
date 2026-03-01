/**
 * INNOFULFILL NDR SERVICE
 * 
 * NOTE: Innofulfill NDR API is not documented.
 * This is a placeholder that logs the action and returns a manual resolution message.
 * When the API is available, only this file needs to be updated.
 */

export interface InnofulfillNdrRequest {
    awbNumber: string;
    action: string;
    payload?: Record<string, any>;
}

export interface NdrResponse {
    success: boolean;
    message: string;
    raw?: any;
}

export async function innofulfillNdr(req: InnofulfillNdrRequest): Promise<NdrResponse> {
    console.log(`[InnofulfillNdr] NDR action requested for AWB ${req.awbNumber}: ${req.action} (no API available — manual resolution required)`);
    return {
        success: false,
        message: `Innofulfill NDR API is not available. Please contact Innofulfill support to ${req.action} AWB ${req.awbNumber} manually.`,
        raw: { awb: req.awbNumber, action: req.action, note: 'API not supported — logged for manual resolution' },
    };
}
