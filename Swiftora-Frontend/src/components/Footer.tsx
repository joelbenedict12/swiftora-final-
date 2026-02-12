import { Link } from "react-router-dom";
import {
  Package,
  Mail,
  MapPin,
  Phone,
  Heart,
  FileText,
  Shield,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-8 relative overflow-hidden">
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand + description (matches design) */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex flex-col items-start max-w-sm">
              <img
                src="/footer-logo.jpg"
                alt="Swiftora Logo"
                className="w-32 object-contain"
              />
            </div>
            <p className="text-sm text-gray-400 mb-1 max-w-md">
              Swiftora is a unified logistics aggregator helping Indian
              businesses ship faster with multi-carrier integrations,
              automation, and real-time insights.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <MapPin className="w-4 h-4" />
              <span>Bangalore, Karnataka, India</span>
            </div>
            {/* Legal transparency (PayU requirements) */}
            <p className="text-[11px] text-gray-500 max-w-xl leading-snug">
              Swiftora is a product operated by{" "}
              <span className="font-semibold">JS Enterprise</span> (proprietor:{" "}
              <span className="font-semibold">Samsudinbasha Jagirusen</span>),
              registered at 1664, Ground Floor, 41st Cross, 18th Main Road,
              Opposite to GNR Kalyana Mantapa, Jayanagar 4th T Block, Bengaluru,
              Karnataka, 560041. Legal email:{" "}
              <span className="font-semibold">
                jsenterprises.4148@gmail.com
              </span>{" "}
              · Legal phone:{" "}
              <span className="font-semibold">+91 93442 68276</span>
            </p>
          </div>

          {/* Product column */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Product</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Dashboard
              </Link>
              <Link
                to="/tracking"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Tracking &amp; Experience
              </Link>
              <Link
                to="/contact"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Shipping Network
              </Link>
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Automation &amp; Intelligence
              </Link>
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                COD &amp; Finance
              </Link>
            </div>
          </div>

          {/* Integrations column */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Integrations</h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-400">Couriers</span>
              <span className="text-sm text-gray-400">Sales Channels</span>
              <span className="text-sm text-gray-400">APIs &amp; Webhooks</span>
              <span className="text-sm text-gray-400">Plugins</span>
            </div>
          </div>

          {/* Resources / Company / Compliance / Information combined in compact grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h3 className="font-semibold mb-3 text-white">Resources</h3>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-gray-400">Documentation</span>
                <span className="text-sm text-gray-400">API Reference</span>
                <span className="text-sm text-gray-400">FAQs</span>
                <span className="text-sm text-gray-400">Support</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-white">Company</h3>
              <div className="flex flex-col gap-2">
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
                >
                  Contact
                </Link>
                <span className="text-sm text-gray-400">Careers</span>
                <span className="text-sm text-gray-400">Blog</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-white">Compliance</h3>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-gray-400">GDPR compliant</span>
                <span className="text-sm text-gray-400">ISO / SOC</span>
                <span className="text-sm text-gray-400">Data security note</span>
                <span className="text-sm text-gray-400">
                  Built for Indian e-commerce
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-white">Information</h3>
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <Link
                    to="/privacy-policy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 93442 68276</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@swiftora.co</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row with Terms / Refund links */}
        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            © 2026 Swiftora. All rights reserved. Swiftora is a product operated
            by JS Enterprise.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link
              to="/terms-and-conditions"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span>|</span>
            <Link
              to="/refund-policy"
              className="hover:text-white transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
