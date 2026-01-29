import { z } from "zod";

const BASE_URL = (import.meta.env.VITE_DELHIVERY_BASE_URL || "/delhivery").replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_DELHIVERY_API_KEY;

const trackingSchema = z.object({
  ShipmentData: z
    .array(
      z.object({
        Shipment: z.record(z.any()).optional(),
      })
    )
    .optional(),
  Error: z.string().optional(),
  error: z.string().optional(),
});

export type TrackingStep = {
  status: string;
  location?: string;
  timestamp?: string;
  completed?: boolean;
  remarks?: string;
};

export type TrackingResult = {
  id: string;
  status: string;
  origin?: string;
  destination?: string;
  eta?: string;
  lastUpdated?: string;
  steps: TrackingStep[];
};

type TrackInput = {
  awb?: string;
  orderId?: string;
  phone?: string;
};

const getAuthHeaders = () => {
  if (!API_KEY) {
    throw new Error("Delhivery API key is missing. Please set VITE_DELHIVERY_API_KEY.");
  }
  return {
    Authorization: `Token ${API_KEY}`,
  };
};

const normalizeShipment = (waybill: string, payload: any): TrackingResult => {
  const shipment = payload?.ShipmentData?.[0]?.Shipment ?? {};
  const summaryStatus = shipment?.Status?.Status ?? shipment?.Status ?? "Unknown";
  const origin = shipment?.Origin ?? shipment?.PickupLocation ?? shipment?.SellerAddress;
  const destination = shipment?.Destination ?? shipment?.ConsigneeAddress;
  const eta = shipment?.ExpectedDeliveryDate ?? shipment?.EDD;

  const scansRoot = shipment?.Scans ?? [];
  const scanDetails = Array.isArray(scansRoot)
    ? scansRoot.flatMap((scan: any) => scan?.ScanDetail ?? scan ?? [])
    : [];

  const steps: TrackingStep[] = scanDetails.map((scan: any) => {
    const status = scan?.ScanType ?? scan?.Scan ?? scan?.Status ?? "Update";
    const location = scan?.ScanLocation ?? scan?.ScannedLocation ?? scan?.City;
    const timestamp = scan?.ScanDateTime ?? scan?.StatusDateTime ?? scan?.Date ?? undefined;
    return {
      status,
      location,
      timestamp,
      remarks: scan?.Remarks ?? scan?.Instructions,
    };
  });

  const completedUntil = steps.length - 2; // mark all but the last as completed by default
  const normalizedSteps = steps.map((step, idx) => ({
    ...step,
    completed: step.completed ?? idx <= completedUntil,
  }));

  return {
    id: waybill,
    status: summaryStatus,
    origin: typeof origin === "string" ? origin : undefined,
    destination: typeof destination === "string" ? destination : undefined,
    eta: typeof eta === "string" ? eta : undefined,
    lastUpdated: normalizedSteps[normalizedSteps.length - 1]?.timestamp,
    steps: normalizedSteps,
  };
};

export const trackShipment = async (input: TrackInput): Promise<TrackingResult> => {
  const waybill = input.awb?.trim();
  const orderId = input.orderId?.trim();
  const phone = input.phone?.trim();
  const id = waybill || orderId || phone;

  if (!id) {
    throw new Error("Please provide an AWB, Order ID, or phone number to track.");
  }

  const params = new URLSearchParams();
  if (waybill) {
    params.set("waybill", waybill);
  } else if (orderId) {
    params.set("ref_ids", orderId);
  } else if (phone) {
    params.set("phone", phone);
  }
  params.set("verbose", "1");

  const url = `${BASE_URL}/api/v1/packages/json/?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Delhivery tracking failed (${response.status}).`);
  }

  const json = await response.json();
  const parsed = trackingSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Unexpected Delhivery response shape.");
  }

  const payload = parsed.data;

  if (payload.error || payload.Error) {
    throw new Error(payload.error || payload.Error || "Delhivery reported an error");
  }

  const shipments = payload.ShipmentData ?? [];
  const firstWithShipment = shipments.find((s) => !!s.Shipment);
  if (!firstWithShipment || !firstWithShipment.Shipment) {
    throw new Error("No shipment found for the provided ID.");
  }

  return normalizeShipment(waybill, { ShipmentData: [firstWithShipment] });
};
