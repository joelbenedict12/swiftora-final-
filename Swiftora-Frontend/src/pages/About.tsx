import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  Users,
  Lightbulb,
  Award,
  Send,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Brain,
  Zap,
  Globe,
  Shield,
  Layers,
  Cpu,
  Network,
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const timeline = [
    {
      step: "01",
      title: "Platform Onboarding",
      description:
        "Seamless integration with your existing infrastructure through our intuitive setup process.",
    },
    {
      step: "02",
      title: "AI Configuration",
      description:
        "Customize intelligent algorithms to match your specific business requirements and workflows.",
    },
    {
      step: "03",
      title: "Real-Time Monitoring",
      description:
        "Access live dashboards with comprehensive analytics and performance insights.",
    },
    {
      step: "04",
      title: "Optimization & Scaling",
      description:
        "Leverage advanced features to optimize operations and scale your business efficiently.",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Our Vision",
      description:
        "To revolutionize enterprise technology by delivering innovative solutions that empower businesses worldwide.",
      color: "text-[hsl(210_100%_60%)]",
      bgColor: "bg-[hsl(210_100%_60%)]/10",
      borderColor: "border-[hsl(210_100%_60%)]/30",
    },
    {
      icon: Users,
      title: "User-Centric",
      description:
        "Every decision and feature is crafted with our users' success and satisfaction as the primary focus.",
      color: "text-[hsl(25_95%_55%)]",
      bgColor: "bg-[hsl(25_95%_55%)]/10",
      borderColor: "border-[hsl(25_95%_55%)]/30",
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description:
        "We continuously explore cutting-edge technologies to deliver breakthrough solutions.",
      color: "text-[hsl(210_100%_60%)]",
      bgColor: "bg-[hsl(210_100%_60%)]/10",
      borderColor: "border-[hsl(210_100%_60%)]/30",
    },
    {
      icon: Award,
      title: "Excellence",
      description:
        "Committed to maintaining the highest quality standards across all our products and services.",
      color: "text-[hsl(25_95%_55%)]",
      bgColor: "bg-[hsl(25_95%_55%)]/10",
      borderColor: "border-[hsl(25_95%_55%)]/30",
    },
  ];

  const technologies = [
    {
      icon: Brain,
      title: "Machine Learning",
      description: "Advanced neural networks power intelligent decision-making",
      color: "text-[hsl(210_100%_60%)]",
      bgColor: "bg-[hsl(210_100%_60%)]/10",
    },
    {
      icon: Zap,
      title: "Edge Computing",
      description: "Ultra-low latency processing at the network edge",
      color: "text-[hsl(25_95%_55%)]",
      bgColor: "bg-[hsl(25_95%_55%)]/10",
    },
    {
      icon: Shield,
      title: "Zero-Trust Security",
      description: "Enterprise-grade protection with end-to-end encryption",
      color: "text-[hsl(210_100%_60%)]",
      bgColor: "bg-[hsl(210_100%_60%)]/10",
    },
  ];

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
        <section className="pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-[hsl(210_100%_60%)]/10 text-[hsl(210_100%_60%)] rounded-full text-sm font-semibold flex items-center gap-2 border border-[hsl(210_100%_60%)]/30">
                  <Rocket className="w-4 h-4" />
                  About Our Platform
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-center">
                <span className="text-foreground">Building the future of</span>
                <br />
                <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] bg-clip-text text-transparent">
                  enterprise technology
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                We're dedicated to transforming how businesses operate through
                cutting-edge technology solutions and exceptional user
                experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 md:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-block mb-6">
                <span className="px-6 py-3 bg-[hsl(210_100%_60%)]/10 text-[hsl(210_100%_60%)] rounded-full text-sm font-bold border border-[hsl(210_100%_60%)]/30">
                  ⭐ CORE VALUES
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
                The principles{" "}
                <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] bg-clip-text text-transparent">
                  that guide us
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                Our values shape every decision and drive our commitment to
                excellence
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 max-w-7xl mx-auto">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 hover:border-[hsl(25_95%_55%)]/50 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 text-center">
                    <CardContent className="p-8 lg:p-10">
                      <div className="relative mb-8">
                        <div
                          className={`w-20 h-20 ${value.bgColor} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-all duration-500 shadow-lg border ${value.borderColor}`}
                        >
                          <value.icon className={`w-10 h-10 ${value.color}`} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[hsl(25_95%_55%)]/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-[hsl(210_100%_60%)] transition-colors duration-300">
                        {value.title}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed text-lg">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-32 relative border-t border-[hsl(210_100%_60%)]/20 bg-gradient-to-r from-[#E81CFF] to-[#40C9FF]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-block mb-6">
                <span className="px-6 py-3 bg-[hsl(210_100%_60%)]/20 text-white rounded-full text-sm font-bold border border-[hsl(210_100%_60%)]/30">
                  🔄 PROCESS
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
                How our{" "}
                {/* <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] bg-clip-text text-transparent"> */}
                platform {/* </span>{" "} */}
                works
              </h2>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                Simple, streamlined process from setup to full deployment in
                just 4 steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  className="text-center group animate-fade-in-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[hsl(180,7%,37%)] to-[hsl(183,54%,37%)] rounded-3xl shadow-lg flex items-center justify-center mx-auto group-hover:scale-105 transition-all duration-500 border border-[hsl(210_100%_60%)]/30">
                      <span className="text-3xl font-bold text-white">
                        {item.step}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:scale-105 transition-transform duration-300">
                    {item.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    {item.description}
                  </p>

                  <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-[hsl(210,24%,89%)] to-[hsl(207,41%,84%)] mx-auto mt-4 transition-all duration-500 rounded-full"></div>
                </div>
              ))}
            </div>

            <div className="mt-20 flex justify-center">
              <div className="flex items-center gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-[hsl(210_100%_60%)]/40 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-20 md:py-28 relative">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
              <div className="order-2 md:order-1">
                <div className="mb-4">
                  <span className="px-4 py-2 bg-[hsl(25_95%_55%)]/10 to-[hsl(207,97%,45%)] rounded-full text-sm font-semibold border border-[hsl(25_95%_55%)]/30">
                    TECHNOLOGY
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Built on next-generation infrastructure
                </h2>
                <p className="text-lg text-foreground/70 mb-8">
                  Our platform leverages artificial intelligence, distributed
                  computing, and real-time data processing to deliver
                  unparalleled performance and reliability.
                </p>

                <div className="space-y-5">
                  {[
                    "AI-driven automation reduces operational costs by up to 45%",
                    "Predictive analytics enable proactive decision-making",
                    "Real-time monitoring across all system components",
                    "Automated scaling and intelligent resource allocation",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-gradient-to-br from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-foreground/80 font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(25_95%_55%)]/90 text-white shadow-lg"
                  >
                    <Link to="/contact">
                      Learn More <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="order-1 md:order-2 relative">
                <div className="absolute -inset-4 bg-[hsl(210_100%_60%)]/10 rounded-3xl blur-lg"></div>
                <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg overflow-hidden relative z-10">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {technologies.map((tech, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div
                            className={`w-16 h-16 ${tech.bgColor} rounded-xl flex items-center justify-center border border-[hsl(210_100%_60%)]/30`}
                          >
                            <tech.icon className={`w-8 h-8 ${tech.color}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-foreground">
                              {tech.title}
                            </h3>
                            <p className="text-sm text-foreground/70">
                              {tech.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative border-t border-[hsl(210_100%_60%)]/20 bg-gradient-to-r from-[#40C9FF] to-[#E81CFF]">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-block mb-8">
                <span className="px-8 py-4 bg-[hsl(210_100%_60%)]/20 text-white rounded-full text-sm font-bold border border-[hsl(210_100%_60%)]/30">
                  🚀 GET STARTED
                </span>
              </div>

              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-foreground">
                Ready to{" "}
                {/* <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] bg-clip-text text-transparent"> */}
                transform {/* </span>{" "} */}
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
                  className="group bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(25_95%_55%)]/90 text-white shadow-lg text-lg font-bold h-16 px-12 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <Link to="/contact" className="flex items-center gap-3">
                    Get Started Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm text-foreground border-2 border-[hsl(210_100%_60%)]/30 hover:bg-[hsl(210_100%_60%)]/10 hover:border-[hsl(210_100%_60%)]/50 text-lg font-bold h-16 px-12 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <Link to="/tracking" className="flex items-center gap-3">
                    <Send className="w-5 h-5" />
                    Explore Platform
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-8 text-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(210_100%_60%)]" />
                  <span className="font-semibold">Free setup</span>
                </div>
                <div className="w-px h-4 bg-foreground/30"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(25_95%_55%)]" />
                  <span className="font-semibold">No contracts</span>
                </div>
                <div className="w-px h-4 bg-foreground/30"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(210_100%_60%)]" />
                  <span className="font-semibold">24/7 support</span>
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
