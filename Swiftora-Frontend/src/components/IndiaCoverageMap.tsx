import React, { useEffect, useMemo, useRef, useState } from "react";
import indiaStatesUrl from "@/assets/maps/india-states.svg";

type CoverageDatum = {
  stateCode: string; // e.g. "MH", "DL"
  name: string;
  shipments: number;
  couriers?: string[];
};

interface IndiaCoverageMapProps {
  data: CoverageDatum[];
}

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  shipments: number;
};

const IndiaCoverageMap: React.FC<IndiaCoverageMapProps> = ({ data }) => {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const shipmentsByCode = useMemo(() => {
    const map: Record<string, CoverageDatum> = {};
    data.forEach((d) => {
      map[d.stateCode.toUpperCase()] = d;
    });
    return map;
  }, [data]);

  const hasData = data.some((d) => d.shipments > 0);

  const maxShipments = useMemo(
    () => data.reduce((max, d) => Math.max(max, d.shipments), 0) || 0,
    [data]
  );

  // Load the raw SVG markup once
  useEffect(() => {
    let cancelled = false;
    fetch(indiaStatesUrl)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setSvgMarkup(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getFillForState = (code: string) => {
    const datum = shipmentsByCode[code];
    if (!datum || datum.shipments === 0 || !maxShipments) {
      return "#E5E7EB"; // grey for no coverage
    }
    const ratio = datum.shipments / maxShipments; // 0–1
    const lightL = 92;
    const darkL = 42;
    const lightS = 80;
    const darkS = 100;
    const l = lightL - (lightL - darkL) * ratio;
    const s = lightS + (darkS - lightS) * ratio;
    return `hsl(210, ${s}%, ${l}%)`;
  };

  // Bind colours + hover interactions to each state path in the embedded SVG
  useEffect(() => {
    if (!svgMarkup || !containerRef.current) return;
    const rootSvg = containerRef.current.querySelector("svg");
    if (!rootSvg) return;

    const paths = Array.from(
      rootSvg.querySelectorAll<SVGPathElement>('path[id^="IN"]')
    );

    const listeners: {
      el: SVGPathElement;
      type: keyof GlobalEventHandlersEventMap;
      fn: (evt: Event) => void;
    }[] = [];

    const handleHover = (evt: Event, path: SVGPathElement) => {
      const id = path.getAttribute("id") || "";
      const code = id.replace(/^IN/, "").toUpperCase();
      const datum = shipmentsByCode[code];
      const shipments = datum?.shipments ?? 0;
      const nameAttr = path.getAttribute("name") || datum?.name || code;
      const bounds = path.getBoundingClientRect();
      const containerBounds = containerRef.current?.getBoundingClientRect();

      const x = containerBounds
        ? bounds.left + bounds.width / 2 - containerBounds.left
        : bounds.left + bounds.width / 2;
      const y = containerBounds ? bounds.top - containerBounds.top : bounds.top;

      setTooltip({
        visible: true,
        x,
        y,
        name: nameAttr,
        shipments,
      });
    };

    const handleLeave = () => setTooltip(null);

    paths.forEach((path) => {
      const id = path.getAttribute("id") || "";
      const code = id.replace(/^IN/, "").toUpperCase();

      // Colour based on shipment volume
      path.setAttribute("fill", getFillForState(code));
      path.style.transition = "fill 150ms ease-out";

      const enter = (evt: Event) => handleHover(evt, path);
      const move = (evt: Event) => handleHover(evt, path);
      const leave = () => handleLeave();

      path.addEventListener("mouseenter", enter);
      path.addEventListener("mousemove", move);
      path.addEventListener("mouseleave", leave);

      listeners.push(
        { el: path, type: "mouseenter", fn: enter },
        { el: path, type: "mousemove", fn: move },
        { el: path, type: "mouseleave", fn: leave }
      );
    });

    return () => {
      listeners.forEach(({ el, type, fn }) =>
        el.removeEventListener(type, fn as any)
      );
    };
  }, [svgMarkup, shipmentsByCode, maxShipments]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className="w-full h-full max-h-72 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-72 [&>svg]:block"
        // SVG markup from india-states.svg – accurate India outline with state paths
        dangerouslySetInnerHTML={svgMarkup ? { __html: svgMarkup } : undefined}
        role="img"
        aria-label="India shipping coverage by state"
      />

      {/* Fallback when no shipments */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            No shipment data available
          </span>
        </div>
      )}

      {/* Tooltip */}
      {tooltip?.visible && (
        <div
          className="pointer-events-none absolute z-50 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: tooltip.x + 8,
            top: tooltip.y - 8,
          }}
        >
          <div className="font-semibold">{tooltip.name}</div>
          <div className="mt-1 text-slate-200">
            Shipments:{" "}
            <span className="font-semibold">{tooltip.shipments}</span>
          </div>
          <div className="mt-1 text-slate-300">
            Coverage:{" "}
            <span className="font-semibold">
              {tooltip.shipments > 0 ? "Active" : "Not Active"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaCoverageMap;


