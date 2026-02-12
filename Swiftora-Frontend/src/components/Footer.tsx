import { Link } from "react-router-dom";
import { Package, Mail, MapPin, Phone, Heart, FileText, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-20 relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Swiftora</span>
            </div>
            <p className="text-sm font-medium text-white/90 mb-1">
              Legal name: JS Enterprise
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Swiftora is a product operated by JS Enterprise (proprietor:
              Samsudinbasha Jagirusen).
            </p>
            <p className="text-sm text-gray-400 mb-3 max-w-md">
              Unified logistics aggregator helping Indian businesses ship faster
              with multi-carrier integrations, automation, and real-time
              insights.
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4 mt-1" />
              <span>
                Registered address: 1664, Ground Floor, 41st Cross, 18th Main
                Road, Opposite to GNR Kalyana Mantapa, Jayanagar 4th T Block,
                Bengaluru, Karnataka, 560041.
              </span>
            </div>
            <div className="flex flex-col gap-1 text-sm text-gray-400">
              <span>
                Legal email:{" "}
                <span className="font-medium">
                  jsenterprises.4148@gmail.com
                </span>
              </span>
              <span>
                Legal phone:{" "}
                <span className="font-medium">+91 93442 68276</span>
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Product</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Features
              </Link>
              <Link
                to="/tracking"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Track Package
              </Link>
              <Link
                to="/contact"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Pricing
              </Link>
              <Link
                to="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Integrations
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Company</h3>
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
              <Link
                to="/dashboard/support"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Support
              </Link>
              <Link
                to="/terms-and-conditions"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Terms & Conditions
              </Link>
              <Link
                to="/refund-policy"
                className="text-sm text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block"
              >
                Refund & Cancellation
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
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
                <span>+91 80436 91691</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@swiftora.co</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © 2026 Swiftora. All rights reserved. Swiftora is a product
            operated by JS Enterprise.
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Made with{" "}
            <Heart className="w-4 h-4 text-red-500" />{" "}
            for Indian e-commerce
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
