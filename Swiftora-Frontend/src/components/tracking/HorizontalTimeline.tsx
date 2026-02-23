import { Clock, MapPin } from "lucide-react";

export interface TimelineEvent {
  status: string;
  location?: string;
  detail?: string;
  timestamp: string;
}

interface HorizontalTimelineProps {
  events: TimelineEvent[];
  title?: string;
}

function formatDateTime(ts: string | undefined) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default function HorizontalTimeline({ events, title }: HorizontalTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> {title || "Shipment Timeline"}
      </h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-0 min-w-max">
          {events.map((event, idx) => {
            const isLast = idx === events.length - 1;
            const isFirst = idx === 0;
            return (
              <div key={idx} className="flex items-start">
                <div className="flex flex-col items-center min-w-[120px] max-w-[160px]">
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                      isFirst
                        ? "bg-blue-500 border-blue-300 ring-4 ring-blue-100"
                        : "bg-gray-300 border-gray-200"
                    }`}
                  />
                  <div className="mt-2 text-center px-1">
                    <div
                      className={`text-xs font-medium leading-tight ${
                        isFirst ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {event.status}
                    </div>
                    {event.location && (
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{event.location}</span>
                      </div>
                    )}
                    {event.detail && (
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">{event.detail}</div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {formatDateTime(event.timestamp)}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className="w-8 h-0.5 bg-gray-200 mt-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
