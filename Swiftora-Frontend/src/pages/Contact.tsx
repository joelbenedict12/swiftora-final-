import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden bg-slate-100">
      <div className="relative z-10">
        <Navigation />
        <div className="w-full bg-slate-50 text-slate-800">
          {/* ================= HERO SECTION ================= */}
          <section className="relative py-28 w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white">
            <div className="mx-auto max-w-7xl px-6 py-20 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in Touch with Swiftora
              </h1>
              <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
                Have questions about shipments, payments, or integrations? Our
                team is here to help you.
              </p>
            </div>
          </section>

          {/* ================= CONTACT OPTIONS ================= */}
          <section className="relative -mt-16 z-10">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid gap-6 md:grid-cols-4">
                {[
                  {
                    title: "Email Support",
                    desc: "Operational and platform support",
                    value: "support@swiftora.co",
                  },
                  {
                    title: "Call Us",
                    desc: "Mon–Fri, 9AM–6PM IST",
                    value: "+91 93442 68276",
                  },
                  {
                    title: "WhatsApp",
                    desc: "Fast responses on chat",
                    value: "Coming soon",
                  },
                  {
                    title: "Business / Compliance",
                    desc: "KYC, billing & partnerships",
                    value: "jsenterprises.4148@gmail.com",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white p-6 shadow-md hover:shadow-xl transition"
                  >
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500 mb-3">{item.desc}</p>
                    <p className="text-indigo-600 font-medium break-words">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================= CONTACT FORM ================= */}
          <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid gap-12 md:grid-cols-2">
              {/* Form */}
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

                <form className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Phone Number (optional)"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <select className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Choose a subject</option>
                    <option>Shipment & Tracking</option>
                    <option>Payments & Billing</option>
                    <option>Technical Support</option>
                    <option>Business Partnership</option>
                    <option>General Enquiry</option>
                  </select>

                  <textarea
                    rows={5}
                    placeholder="Write your message..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              {/* Info / Trust Section */}
              <div className="flex flex-col justify-center space-y-6">
                <h3 className="text-2xl font-bold">Why contact Swiftora?</h3>

                <ul className="space-y-4 text-slate-600">
                  <li>🚚 Logistics & shipment support across partners</li>
                  <li>💳 Secure payments & billing assistance</li>
                  <li>⚙️ API & platform integration help</li>
                  <li>🤝 Dedicated merchant & partner support</li>
                </ul>

                <div className="rounded-xl bg-indigo-50 p-6">
                  <h4 className="font-semibold mb-2">Support SLA</h4>
                  <p className="text-sm text-slate-600">
                    ⏱ Average response time: within 24 hours
                    <br />
                    📦 Shipment issues are prioritized
                    <br />
                    🔒 Your data is always secure
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= LEGAL BUSINESS DETAILS ================= */}
          <section className="pb-20 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-2xl bg-slate-900 text-slate-100 p-6 md:p-8 flex flex-col gap-2">
                <h2 className="text-xl md:text-2xl font-semibold mb-1">
                  Legal business information
                </h2>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Legal Name:</span>{" "}
                  JS Enterprise
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Proprietor / Employer:</span>{" "}
                  Samsudinbasha Jagirusen
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Brand / Product:</span>{" "}
                  Swiftora
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Registered Address:</span>{" "}
                  1664, Ground Floor, 41st Cross, 18th Main Road, Opposite to
                  GNR Kalyana Mantapa, Jayanagar 4th T Block, Bengaluru,
                  Karnataka, 560041.
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Email:</span>{" "}
                  jsenterprises.4148@gmail.com
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">Phone:</span>{" "}
                  +91 93442 68276
                </p>
              </div>
            </div>
          </section>

          {/* ================= FINAL CTA ================= */}
          <section className="bg-slate-900 text-white py-16 text-center">
            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-slate-300">
              Our support team is always happy to help you.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;

