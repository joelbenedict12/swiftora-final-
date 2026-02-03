import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Send } from "lucide-react";
import { Link } from "react-router-dom";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden bg-slate-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(210_100%_60%)]/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(25_95%_55%)]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <section className="pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-[hsl(25_95%_55%)]/10 text-[hsl(25_95%_55%)] rounded-full text-sm font-semibold flex items-center gap-2 border border-[hsl(25_95%_55%)]/30">
                  <RotateCcw className="w-4 h-4" />
                  Policy
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Refund & Cancellation Policy
              </h1>
              <p className="text-lg text-foreground/70 mb-12">
                Our refund and cancellation terms for Swiftora shipping and logistics services.
              </p>

              <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg">
                <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
                  <div className="space-y-6 text-foreground/90">
                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">1. Order Cancellation</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Orders can be cancelled before they are handed over to the courier partner. Once shipped, cancellation is subject to courier partner policies.</li>
                        <li>Cancellation requests must be submitted through the dashboard or support. Refunds for cancelled orders will be processed as per the timelines below.</li>
                        <li>Prepaid orders: Full shipping charges will be refunded if cancelled before pickup (minus any applicable processing fees).</li>
                        <li>COD orders: No payment has been collected; cancellation simply closes the order.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">2. Refund Eligibility</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Refunds are applicable for: cancelled orders (before shipment), failed deliveries due to courier issues, duplicate charges, or service failures on our part.</li>
                        <li>Wallet recharges: Refunds for failed or disputed recharge transactions are processed within 5–10 business days to the original payment method.</li>
                        <li>Original shipping charges may be non-refundable in cases of customer-initiated returns or address errors.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">3. Refund Process</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Refunds are typically processed within 5–10 business days after approval.</li>
                        <li>For wallet credits: Refunds will be credited to your Swiftora wallet or original payment method as applicable.</li>
                        <li>For card/UPI payments: Refunds will be credited to the same account used for payment. Bank processing may take additional time.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">4. Non-Refundable Cases</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Orders delivered successfully without valid disputes.</li>
                        <li>Charges incurred due to incorrect address, customer unavailability, or refusal to accept delivery.</li>
                        <li>RTO (Return-to-Origin) charges as per courier partner policies.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">5. Contact</h2>
                      <p>For refund or cancellation requests, contact us at <a href="mailto:support@swiftora.co" className="text-[hsl(210_100%_60%)] hover:underline">support@swiftora.co</a> or visit our <Link to="/contact" className="text-[hsl(210_100%_60%)] hover:underline">Contact</Link> page. We aim to resolve all requests within 7 business days.</p>
                      <p className="mt-4 font-medium">Legal entity: SAMSUDINBASHA JAGIRUSEN / JS ENTERPRISES</p>
                    </section>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  Contact Us
                </Link>
                <Link
                  to="/terms-and-conditions"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[hsl(210_100%_60%)]/30 text-foreground rounded-xl font-medium hover:bg-[hsl(210_100%_60%)]/10 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default RefundPolicy;
