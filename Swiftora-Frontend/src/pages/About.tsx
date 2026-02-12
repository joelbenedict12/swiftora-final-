import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { url } from "inspector";

const problems = [
  "-- Managing multiple courier partners across dashboards --",
  "-- Fragmented shipment tracking and delayed visibility --",
  "-- Manual COD reconciliation and cash flow delays --",
  "-- Inefficient shipping decisions increasing operational costs --",
];

const About = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % problems.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden bg-slate-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(210_100%_60%)]/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(25_95%_55%)]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden relative bg-[#f9faf4]">
          <div className="container mx-auto px-4 relative z-10 ">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-center">
                {/* <span className="text-foreground">Building the future of</span>
                <br /> */}
                <span className="bg-gradient-to-r from-[hsl(273,77%,49%)] to-[hsl(283,79%,48%)] bg-clip-text text-transparent">
                  About Swiftora
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Swiftora is a unified logistics aggregator built <b>B2B, B2C</b>{" "}
                for Indian e-commerce businesses. We simplify multi-carrier
                shipping, automate logistics workflows, and deliver real-time
                visibility — all from a single, scalable platform.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-[#067ADF]/10 text-[#067ADF] mb-4">
                  {/* icon */}
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Unified Courier Network
                </h3>

                <p className="mt-2 text-slate-600">
                  Connect to multiple courier partners through a single
                  integration and intelligently select the best option for every
                  shipment.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-[#067ADF]/10 text-[#067ADF] mb-4">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Intelligent Automation
                </h3>

                <p className="mt-2 text-slate-600">
                  Automate courier allocation, label generation, pickup
                  scheduling, and shipping workflows to reduce manual effort and
                  errors.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-[#067ADF]/10 text-[#067ADF] mb-4">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20l9-16H3l9 16z" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Complete Visibility & Control
                </h3>

                <p className="mt-2 text-slate-600">
                  Track shipments in real time, monitor performance, manage COD
                  reconciliation, and gain insights from one unified dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 md:py-32 relative ">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
                Logistics{" "}
                <span className="bg-gradient-to-r from-[hsl(36,100%,60%)] to-[hsl(36,86%,44%)] bg-clip-text text-transparent">
                  Shouldn't Be Complicated
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                Managing multiple courier partners, tracking shipments,
                reconciling COD, and optimizing costs creates operational
                friction for growing businesses.
              </p>
            </div>

            {/* Carousel */}
            <div className="mt-12 h-10 flex items-center justify-center overflow-hidden">
              <p
                key={index}
                className="text-xl font-medium text-[#0F172A] transition-opacity duration-500"
              >
                {problems[index]}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          className="py-20 md:py-32 relative   overflow-hidden"
          //add img background
          style={{
            backgroundImage:
              "url('/oneplatform-img.webp') ",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
                One Platform. One Integration. Total Control
              </h2>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                Swiftora aggregates couriers, channels, and workflows into one
                intelligent system so businesses can focus on growth, not
                logistics complexity.
              </p>
            </div>
          </div>
          {/* <img
            src="/platform-img.png"
            alt="Swiftora logistics platform illustration"
            className="absolute bottom-0 left-0 w-full max-h-[200px]  object-contain hidden md:block"
          /> */}
        </section>

        {/* Technology Section */}

        <section className="py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-[#0F172A]">
              Built as a Unified Logistics Platform
            </h2>

            <p className="mt-4 max-w-3xl mx-auto text-slate-600">
              Swiftora combines courier aggregation, automation, tracking, and
              financial workflows into a single logistics infrastructure.
            </p>

            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              {/* Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-[#067ADF]">
                  Multi-Carrier Aggregation
                </h3>
                <p className="mt-2 text-slate-600">
                  Access multiple courier partners through a single integration
                  and ship smarter with data-driven decisions.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-[#067ADF]">
                  Intelligent Shipping Automation
                </h3>
                <p className="mt-2 text-slate-600">
                  Automate courier allocation, label generation, pickup
                  scheduling, and rule-based shipping workflows to reduce manual
                  effort and errors.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-[#067ADF]">
                  Unified Tracking & Insights
                </h3>
                <p className="mt-2 text-slate-600">
                  Track shipments across all carriers in real time, provide
                  branded tracking experiences, and gain visibility into
                  delivery performance.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-[#067ADF]">
                  COD & Settlement Management
                </h3>
                <p className="mt-2 text-slate-600">
                  Manage COD remittances, wallet balances, reconciliations, and
                  reports with transparency and control across courier partners.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative border-t border-[hsl(210_100%_60%)]/20 bg-gradient-to-r from-[#cdf7dd] to-[#b4f7dd]
        " //add img background
          style={{
            backgroundImage:
              "url('/start-bg.webp') ",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-foreground">
                Ready to transform {/* </span>{" "} */}
                your business?
              </h2>

              <p className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of companies that trust our platform for their
                operations. Experience the future of enterprise technology
                today.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Button
                  asChild
                  size="lg"
                  className="group bg-gradient-to-r from-[hsl(210,56%,67%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(25_95%_55%)]/90 text-white shadow-lg text-lg font-bold h-16 px-12 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <Link to="/contact" className="flex items-center gap-3">
                    Get Started Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-8 text-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(210_100%_60%)]" />
                  <span className="font-semibold">Free Setup</span>
                </div>
                <div className="w-px h-4 bg-foreground/30"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(25_95%_55%)]" />
                  <span className="font-semibold">No Contracts</span>
                </div>
                <div className="w-px h-4 bg-foreground/30"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(210_100%_60%)]" />
                  <span className="font-semibold">24/7 Human Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default About;

