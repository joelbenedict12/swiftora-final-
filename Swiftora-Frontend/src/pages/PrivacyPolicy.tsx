import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Send } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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
                  <Shield className="w-4 h-4" />
                  Privacy
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Privacy Policy
              </h1>
              <p className="text-lg text-foreground/70 mb-6">
                This website (<strong>swiftora.co</strong>) is owned and operated
                by <strong>JS Enterprise</strong> (proprietor:{" "}
                <strong>Samsudinbasha Jagirusen</strong>). This Privacy Policy
                explains how we collect, use, and protect your information when
                you use Swiftora.
              </p>

              <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg">
                <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
                  <div className="space-y-6 text-foreground/90 text-sm md:text-base">
                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        1. Data We Collect
                      </h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          <strong>Account data:</strong> Name, email, mobile
                          number, company name, and billing details.
                        </li>
                        <li>
                          <strong>Shipment data:</strong> Consignee details,
                          addresses, order identifiers, and tracking information
                          required to create and manage shipments.
                        </li>
                        <li>
                          <strong>Technical data:</strong> IP address, device
                          information, browser type, and usage logs to improve
                          security and performance.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        2. How We Use Your Information
                      </h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>To create and manage your Swiftora account.</li>
                        <li>
                          To generate shipping labels, manage pickups, and track
                          shipments across courier partners.
                        </li>
                        <li>
                          To send service notifications such as tracking updates,
                          delays, and delivery confirmations.
                        </li>
                        <li>
                          To provide support, improve our platform, and comply
                          with legal and regulatory obligations.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        3. Data Sharing
                      </h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          We share shipment-related data only with integrated
                          courier partners and service providers as required to
                          fulfil your orders.
                        </li>
                        <li>
                          We do <strong>not</strong> sell your personal data to
                          third parties.
                        </li>
                        <li>
                          Data may be shared when required by law, regulation, or
                          valid legal process.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        4. Payments & COD
                      </h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Online payments are processed securely via third-party
                          payment gateways.
                        </li>
                        <li>
                          Swiftora acts as a logistics aggregation and software
                          platform. Where applicable, COD funds are handled by
                          respective courier partners or payment providers as per
                          their policies.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        5. Data Security & Retention
                      </h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          We use industry-standard security practices to protect
                          your data against unauthorised access and misuse.
                        </li>
                        <li>
                          Data is retained only for as long as necessary for
                          operational, legal, and compliance purposes.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        6. Your Rights
                      </h2>
                      <p>
                        You may contact us to update, correct, or request
                        deletion of certain account information, subject to our
                        legal and contractual obligations.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        7. Contact & Entity Details
                      </h2>
                      <p>
                        Legal name: <strong>JS Enterprise</strong>
                        <br />
                        Proprietor / Employer:{" "}
                        <strong>Samsudinbasha Jagirusen</strong>
                        <br />
                        Brand / Product: <strong>Swiftora</strong>
                        <br />
                        Registered address: 1664, Ground Floor, 41st Cross, 18th
                        Main Road, Opposite to GNR Kalyana Mantapa, Jayanagar 4th
                        T Block, Bengaluru, Karnataka, 560041.
                        <br />
                        Email:{" "}
                        <a
                          href="mailto:jsenterprises.4148@gmail.com"
                          className="text-[hsl(210_100%_60%)] hover:underline"
                        >
                          jsenterprises.4148@gmail.com
                        </a>
                        <br />
                        Phone: <strong>+91 93442 68276</strong>
                      </p>
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
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicy;

