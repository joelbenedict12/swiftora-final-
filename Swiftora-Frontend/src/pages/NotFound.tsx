import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Rocket, Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

const NotFound = () => {
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

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="mb-8">
              <div
                className="w-32 h-32 bg-gradient-to-br from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)]
 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse"
              >
                <Rocket className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1
              className="text-8xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)]
 bg-clip-text text-transparent"
            >
              404
            </h1>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Page Not Found
            </h2>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)]
  hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(25_95%_55%)]/90 text-white shadow-lg"
              >
                <Link to="/" className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Return Home
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-[hsl(210_100%_60%)]/30 hover:border-[hsl(210_100%_60%)]/50 hover:bg-[hsl(210_100%_60%)]/10"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-[hsl(210_100%_60%)]/20">
              <p className="text-foreground/70 mb-6">
                You might be looking for:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/about"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(210_100%_60%)]/10 hover:bg-[hsl(210_100%_60%)]/20 text-foreground transition-all border border-[hsl(210_100%_60%)]/30"
                >
                  <Search className="w-4 h-4" />
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(25_95%_55%)]/10 hover:bg-[hsl(25_95%_55%)]/20 text-foreground transition-all border border-[hsl(25_95%_55%)]/30"
                >
                  <HelpCircle className="w-4 h-4" />
                  Contact Support
                </Link>
                <Link
                  to="/tracking"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(210_100%_60%)]/10 hover:bg-[hsl(210_100%_60%)]/20 text-foreground transition-all border border-[hsl(210_100%_60%)]/30"
                >
                  <Search className="w-4 h-4" />
                  Tracking
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default NotFound;
