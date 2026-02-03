import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send } from "lucide-react";
import { Link } from "react-router-dom";

const TermsAndConditionsPublic = () => {
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
                <span className="px-4 py-2 bg-[hsl(210_100%_60%)]/10 text-[hsl(210_100%_60%)] rounded-full text-sm font-semibold flex items-center gap-2 border border-[hsl(210_100%_60%)]/30">
                  <FileText className="w-4 h-4" />
                  Legal
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Terms and Conditions
              </h1>
              <p className="text-lg text-foreground/70 mb-12">
                Please read these terms and conditions carefully before using Swiftora services.
              </p>

              <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg">
                <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
                  <div className="space-y-6 text-foreground/90">
                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">1. Shipping Terms</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Delivery Timeframes:</strong> Standard delivery 3–7 business days; Express 1–2 business days. Times are estimates only.</li>
                        <li><strong>Shipping Charges:</strong> Calculated by weight, dimensions, and destination. COD charges apply for Cash on Delivery orders. All charges include GST.</li>
                        <li><strong>Delivery Address:</strong> You are responsible for accurate delivery addresses. Address changes after dispatch may incur extra charges. Failed deliveries due to incorrect addresses may result in RTO charges.</li>
                        <li><strong>Liability:</strong> We are not liable for delays by courier partners. Insurance is available for high-value shipments. Claims must be filed within 7 days of delivery.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">2. Account & Service Terms</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>You must be 18 or older to use our services.</li>
                        <li>Account information must be accurate and kept up to date.</li>
                        <li>You are responsible for maintaining the security of your account.</li>
                        <li>Items listed in our Restricted Items policy cannot be shipped. Violations may lead to account suspension.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">3. Payment Terms</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Prepaid and COD payment modes are available as per courier partner policies.</li>
                        <li>Wallet recharges and payments are processed through secure payment gateways.</li>
                        <li>Refunds are governed by our Refund & Cancellation Policy.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">4. Dispute Resolution</h2>
                      <p>Disputes should be raised through our support system. We aim to resolve disputes within 7 business days. Legal disputes are subject to the jurisdiction of Mumbai, India.</p>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">5. Company Information</h2>
                      <p>Swiftora is operated by <strong>SAMSUDINBASHA JAGIRUSEN / JS ENTERPRISES</strong>. For contact details, please visit our <Link to="/contact" className="text-[hsl(210_100%_60%)] hover:underline">Contact</Link> page.</p>
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
                  to="/refund-policy"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[hsl(210_100%_60%)]/30 text-foreground rounded-xl font-medium hover:bg-[hsl(210_100%_60%)]/10 transition-colors"
                >
                  Refund & Cancellation Policy
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

export default TermsAndConditionsPublic;
