import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Package,
  Zap,
  MapPin,
  BarChart3,
  RotateCcw,
  IndianRupee,
  Truck,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Globe,
  Sparkles,
  Route,
  Warehouse,
  Smartphone,
  ShoppingCart,
  Code,
  Plug,
} from "lucide-react";

// Reusable animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// Animated section wrapper
const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={fadeInUp}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated card component
const AnimatedCard = ({
  children,
  className = "",
  delay = 0,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={scaleIn}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -8, transition: { duration: 0.2 } } : {}}
    >
      <div className={className}>{children}</div>
    </motion.div>
  );
};

const Index = () => {
  // Features data
  const features = [
    {
      icon: Truck,
      title: "Multi-Courier Integration",
      description:
        "Connect with 20+ leading courier partners across India. Automatically choose the best shipping option for each order.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      category: "network",
      // Use an existing illustration asset so the image
      // shows correctly in production as well.
      img: "/Global_regions.jpg",
    },
    {
      icon: Zap,
      title: "Automated Shipping Rules",
      description:
        "Set smart rules to automatically assign couriers, apply discounts, and optimize shipping costs based on weight, destination, and value.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      category: "automation",
      img: "/Enterprise-security.jpg",
    },
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description:
        "Track every shipment in real-time with automated SMS and email updates. Keep your customers informed at every step.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      category: "experience",
      img: "/Transactions.jpg",
    },
    {
      icon: RotateCcw,
      title: "NDR & Returns Management",
      description:
        "Intelligent NDR workflow to reduce RTO rates. Streamlined returns process with automated refunds and exchanges.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      category: "experience",
      img: "/Uptime.jpg",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Comprehensive insights into shipping performance, costs, delivery times, and courier efficiency. Make data-driven decisions.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      category: "automation",
      img: "/Precision-analysis.jpg",
    },
    {
      icon: IndianRupee,
      title: "COD Reconciliation",
      description:
        "Automated COD collection and reconciliation. Get paid faster with real-time remittance tracking and instant settlements.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      category: "finance",
      img: "/Active_users.jpg",
    },
  ];

  // How it works steps
  const howItWorks = [
    {
      step: "1",
      title: "Connect Your Platform",
      description:
        "Integrate Swiftora once using APIs or plugins to access multiple courier partners instantly.",
      icon: Plug,
    },
    {
      step: "2",
      title: "Smart Carrier Aggregation",
      description:
        "Automatically select the best courier based on cost, SLA, destination, and performance.",
      icon: ShoppingCart,
    },
    {
      step: "3",
      title: "Ship & Track Centrally",
      description:
        "Generate labels, manage pickups, and track shipments across carriers in real time.",
      icon: Package,
    },
    {
      step: "4",
      title: "Settle, Analyze & Scale",
      description:
        "Manage COD, monitor delivery performance, reduce RTO, and scale operations confidently.",
      icon: TrendingUp,
    },
  ];

  // Why Swiftora benefits
  const benefits = [
    {
      icon: IndianRupee,
      title: "Reduce Shipping Costs",
      description:
        "Compare rates across multiple courier partners in real time and automatically ship with the most cost-effective option for every order.",
    },
    {
      icon: Clock,
      title: "Faster & Smarter Shipping",
      description:
        "Automatically select the fastest courier based on destination, performance history, and SLA — reducing delivery time and delays.",
    },
    {
      icon: Globe,
      title: "Pan-India Coverage at Scale",
      description:
        "Access a wide courier network that enables reliable deliveries across metros, Tier-2 cities, and remote locations.",
    },
    {
      icon: Shield,
      title: "Built for Indian Businesses",
      description:
        "Designed for Indian e-commerce with COD management, GST-ready billing, local payment integration, and compilance support.",
    },
  ];

  // Integration platforms — logo files in public/ (see public/LOGO_SOURCES.md)
  const integrations = {
    channels: [
      { name: "Shopify", logo: "/Shopify-Logo.png" },
      { name: "WooCommerce", logo: "/WooCommerce-Logo.png" },
      { name: "Unicommerce", logo: "/unicommerce.png" },
      { name: "EasyEcom", logo: "/easyecom.jpg" },
    ],
    couriers: [
      { name: "Delhivery", logo: "/delhivery-logo.webp" },
      { name: "Ekart", logo: "/ekart-logo.svg" },
      { name: "Xpressbees", logo: "/xpresssbees.png" },
      { name: "BlueDart", logo: "/BlueDart-logo.webp" },
      { name: "Innofullfill", logo: "/innofullfil.png" },
    ],
  };
  // Testimonials
  const testimonials = [
    {
      name: "Priya Sharma",
      company: "Fashion Forward",
      role: "Founder",
      text: "Swiftora transformed our shipping operations. We've cut costs by 35% and our customers love the real-time tracking. Game changer!",
      rating: 5,
      avatar: "PS",
    },
    {
      name: "Rahul Mehta",
      company: "TechGadgets India",
      role: "Operations Head",
      text: "The automated shipping rules save us hours every day. Integration was seamless and support is excellent. Highly recommended!",
      rating: 5,
      avatar: "RM",
    },
    {
      name: "Anjali Patel",
      company: "Home Essentials",
      role: "E-commerce Manager",
      text: "Best logistics platform for Indian sellers. COD reconciliation is a breeze and analytics help us make better decisions.",
      rating: 5,
      avatar: "AP",
    },
  ];

  const [activeFeatureTab, setActiveFeatureTab] =
    useState<(typeof featureTabs)[number]["id"]>("all");

  const [activeIntegrationTab, setActiveIntegrationTab] = useState<
    "couriers" | "channels"
  >("couriers");

  const filteredFeatures =
    activeFeatureTab === "all"
      ? features
      : features.filter((feature) => feature.category === activeFeatureTab);

  // Trusted by logos (using existing assets)
  const trustedBy = [
    { name: "Flipkart", logo: "/Flipkart-Logo.png" },
    { name: "Myntra", logo: "/myntra-logo.png" },
    { name: "Amazon", logo: "/Amazon_logo.png" },
    { name: "Shopify", logo: "/Shopify-Logo.png" },
    { name: "WooCommerce", logo: "/WooCommerce-Logo.png" },
  ];

  const featureTabs = [
    { id: "all", label: "All features" },
    { id: "network", label: "Shipping network" },
    { id: "automation", label: "Automation & intelligence" },
    { id: "experience", label: "Tracking & experience" },
    { id: "finance", label: "COD & finance" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-300">
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-sky-900"
        id="hero"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-350 border border-blue-200 text-blue-500 text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Unified Shipping Infrastructure for Growing Businesses.
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-5xl font-bold mb-6 leading-tight">
                <span className="text-white/90">One Platform,</span>
                <br />
                <span className="text-white/60">
                  Every Carrier. Faster Shipping.
                </span>
              </h1>

              <p className="text-xl md:text-xl text-green-300 mb-8 leading-relaxed">
                Swiftora is a unified logistics aggregator that connects
                multiple carriers, automates shipping decisions, and gives
                businesses complete control over orders, tracking, and
                performance — from a single platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all text-lg px-8 py-6"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    Start Shipping
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                {/* <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-500 text-gray-200 hover:text-blue-600 text-lg px-8 py-6"
                >
                  <Link to="/contact" className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Request Demo
                  </Link>
                </Button> */}
              </div>

              <div className="flex items-center gap-8 text-sm text-orange-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>No Extra Charges</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                 <HeroIllustration /> 
              </div> */}

              <img src="/main2-img.jpg" alt="Laptop-Image" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      {/* <AnimatedSection className="py-12 bg-slate-100 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8 font-medium uppercase tracking-wider">
            Trusted by 10,000+ Indian Businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
            {trustedBy.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-12 flex items-center"
              >
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-8 md:h-10 object-contain"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection> */}

      {/* Features Section */}
      <section
        className="py-24 px-6 from-[#3B164F] to-[#2A0E3F] hover:scale-[1.02] transition-transform duration-300

"
      >
        <div className="container max-w-7xl mx-auto px-4">
          <AnimatedSection>
            <div className="rounded-3xl bg-gradient-to-br from-[#3B164F] to-[#2A0E3F] px-6 py-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Everything You Need to Ship -- From One Platform
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-white/80 text-lg">
                Explore Swiftora’s aggregator capabilities — from multi-carrier
                shipping and automation to tracking, COD, and performance
                analytics.
              </p>

              {/* Feature Tabs */}

              {/* Desktop: Interactive Carousel */}
              <div className="hidden lg:block max-w-6xl mx-auto px-7 py-3">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-6">
                    {filteredFeatures.map((feature, index) => (
                      <CarouselItem
                        key={feature.title}
                        className="pl-6 md:basis-1/2 lg:basis-1/3 hover:text-white"
                      >
                        <AnimatedCard delay={index * 0.08} className="h-full">
                          <Card className="group h-full border border-gray-200 hover:border-blue-500/70 transition-all bg-white/80 hover:bg-[#968bd6]  shadow-sm hover:shadow-lg relative overflow-hidden ">
                            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-orange-300 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-3 flex flex-col h-full relative z-10 ">
                              <div className="flex items-center justify-between mb-5">
                                <div
                                  className={`w-14 h-14 rounded-2xl ${feature.bgColor} ${feature.borderColor} border-2 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-transform`}
                                >
                                  <feature.icon
                                    className={`w-5 h-5 ${feature.color}`}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {
                                    featureTabs.find(
                                      (t) => t.id === feature.category,
                                    )?.label
                                  }
                                </span>
                              </div>
                              <div className="h-40 w-full bg-gray-100 mb-4 rounded-lg overflow-hidden">
                                <img
                                  src={feature.img}
                                  alt={feature.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <h3 className="text-x font-bold mb-2 text-gray-900 group-hover:text-blue-700 transition-colors hover:text-white">
                                {feature.title}
                              </h3>
                              <p className="text-gray-600 text-xs leading-relaxed mb-3 flex-1 hover:text-white">
                                {feature.description}
                              </p>
                              {/* <div className="flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                                Learn more
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </div> */}
                            </CardContent>
                          </Card>
                        </AnimatedCard>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-12 h-12 w-12 border-gray-200 hover:bg-white shadow-md" />
                  <CarouselNext className="-right-12 h-12 w-12 border-gray-200 hover:bg-white shadow-md" />
                </Carousel>
              </div>

              {/* Mobile / Tablet: Carousel */}
              <div className="lg:hidden max-w-4xl mx-auto">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="relative"
                >
                  <CarouselContent>
                    {filteredFeatures.map((feature, index) => (
                      <CarouselItem
                        key={feature.title}
                        className="sm:basis-1/2"
                      >
                        <motion.div
                          className="h-full"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: index * 0.08 }}
                          whileHover={{
                            y: -6,
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }}
                        >
                          <Card className="h-full border border-gray-200 hover:border-blue-500/70 transition-all bg-white/90 hover:bg-gradient-to-br hover:from-blue-50 hover:to-orange-50 shadow-sm hover:shadow-lg">
                            <CardContent className="p-6 flex flex-col h-full">
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className={`w-12 h-12 rounded-xl ${feature.bgColor} ${feature.borderColor} border-2 flex items-center justify-center`}
                                >
                                  <feature.icon
                                    className={`w-6 h-6 ${feature.color}`}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {
                                    featureTabs.find(
                                      (t) => t.id === feature.category,
                                    )?.label
                                  }
                                </span>
                              </div>
                              <h3 className="text-lg font-bold mb-2 text-gray-900">
                                {feature.title}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed flex-1">
                                {feature.description}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="bg-white/90 border-gray-200 hover:bg-white shadow-md -left-4" />
                  <CarouselNext className="bg-white/90 border-gray-200 hover:bg-white shadow-md -right-4" />
                </Carousel>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-20 md:py-28 bg-[#dcdcdd] bg-no-repeat bg-cover"
        //add img background
        style={{
          backgroundImage: "url('/howitworks-img.jpg') ",
        }}
      >
        <div className="container mx-auto px-4 ">
          <AnimatedSection>
            <div className="text-center mb-44">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                How It Works
              </h2>
              <p className="text-xl text-gray-900 max-w-2xl mx-auto">
                A unified logistics flow that connects your business to multiple
                carriers, warehouses, and customers — automatically.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-10 items-center max-w-7xl mx-auto">
            {/* Illustration panel */}
            <AnimatedSection delay={0.1} className="order-2 lg:order-1">
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-orange-500 text-white">
                <CardContent className="p-8 md:p-10">
                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium">
                      <Route className="w-4 h-4" />
                      Visual shipping journey
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold">
                      One connected logistics flow
                    </h3>
                    <p className="text-sm md:text-base text-blue-50/90 max-w-md">
                      Orders flow from your store to Swiftora, through our
                      courier network, and into your customer&apos;s hands with
                      real-time tracking at every step.
                    </p>

                    {/* Flow illustration */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Online store</p>
                          <p className="text-xs text-blue-100">
                            Orders from Shopify, WooCommerce, and more
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-100">
                        <span className="h-px flex-1 bg-gradient-to-r from-white/40 to-white/10" />
                        <Route className="w-4 h-4" />
                        <span>Swiftora routing engine</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-white/40" />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            Warehouses & hubs
                          </p>
                          <p className="text-xs text-blue-100">
                            Auto-assigns the best courier and pickup route
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            In-transit network
                          </p>
                          <p className="text-xs text-blue-100">
                            Pan-India coverage with multi-courier routing
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            Customer doorstep
                          </p>
                          <p className="text-xs text-blue-100">
                            Real-time SMS / WhatsApp tracking for your buyers
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative route line */}
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 0.6, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 400 260"
                    >
                      <defs>
                        <linearGradient
                          id="how-it-works-line"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                          <stop
                            offset="100%"
                            stopColor="rgba(255,255,255,0.1)"
                          />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M 20 220 C 80 160 130 180 190 140 C 250 100 290 120 360 60"
                        fill="none"
                        stroke="url(#how-it-works-line)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, delay: 0.4 }}
                      />
                    </svg>
                  </motion.div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Step-by-step timeline */}
            <AnimatedSection
              delay={0.15}
              className="order-1 lg:order-2 max-w-xl mx-auto w-full"
            >
              <div className="space-y-6">
                {howItWorks.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 text-white flex items-center justify-center text-sm font-semibold shadow-md">
                        {step.step}
                      </div>
                      {index < howItWorks.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent mt-1" />
                      )}
                    </div>
                    <Card
                      className="flex-1 bg-white
border border-slate-200
rounded-xl
shadow-sm hover:shadow-md
transition-all"
                    >
                      <CardContent className="p-5 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <step.icon
                            className="w-5 h-5 bg-[#067ADF]/10
text-[#067ADF]
"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                            {step.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Swiftora Section */}
      <section className="py-20 md:py-28 bg-[#a3dbb8]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <AnimatedSection>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f172a]">
                  Why Businesses Choose Swiftora
                </h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Built as a unified logistics aggregator for Indian e-commerce
                  brands. Swiftora simplifies shipping by combining multiple
                  carriers.
                </p>

                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1 text-gray-900">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-8 shadow-2xl">
                  <div className="bg-white rounded-xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm text-slate-600 mb-1">
                          Average Savings
                        </h4>
                        <p className="text-4xl font-bold text-[#0f172a]">40%</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-orange-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">
                          Delivery Time
                        </p>
                        <p className="text-2xl font-semibold text-[#3aaa63]">
                          -30%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">RTO Rate</p>
                        <p className="text-2xl font-semibold text-[#3aaa63]">
                          -25%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 md:py-28 bg-slate-100">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0f172a]">
                Built to Integrate Everywhere
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From marketplaces and e-commerce platforms to multi-carrier
                logistics partners, Swiftora connects it all seamlessly.
              </p>
            </div>
          </AnimatedSection>

          {/* Integration Toggles */}
          <div className="mt-10 flex justify-center mb-6">
            <div className="inline-flex bg-white p-1 rounded-full border border-slate-300 shadow-sm ">
              <button
                onClick={() => setActiveIntegrationTab("couriers")}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeIntegrationTab === "couriers"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Couriers
              </button>
              <button
                onClick={() => setActiveIntegrationTab("channels")}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeIntegrationTab === "channels"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Channels
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto min-h-[250px]">
            {activeIntegrationTab === "channels" && (
              <AnimatedSection key="channels">
                <div className="overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                  <motion.div
                    className="flex gap-6 w-max"
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{
                      duration: 10,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    {[...integrations.channels, ...integrations.channels].map(
                      (platform, index) => (
                        <div
                          key={index}
                          className="w-[220px] md:w-[240px] flex-shrink-0"
                        >
                          <AnimatedCard delay={0}>
                            <Card className="border-2 hover:border-blue-500 transition-all bg-white hover:shadow-lg h-full">
                              <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                                <img
                                  src={platform.logo}
                                  alt={platform.name}
                                  className="h-12 object-contain mb-3"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                                <p className="text-sm font-medium text-gray-700 text-center">
                                  {platform.name}
                                </p>
                              </CardContent>
                            </Card>
                          </AnimatedCard>
                        </div>
                      ),
                    )}
                  </motion.div>
                </div>
              </AnimatedSection>
            )}

            {activeIntegrationTab === "couriers" && (
              <AnimatedSection key="couriers">
                <div className="overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                  <motion.div
                    className="flex gap-6 w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                      duration: 10,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    {[...integrations.couriers, ...integrations.couriers].map(
                      (courier, index) => (
                        <div
                          key={index}
                          className="w-[220px] md:w-[240px] flex-shrink-0"
                        >
                          <AnimatedCard delay={0}>
                            <Card className="border-2 hover:border-orange-500 transition-all bg-white hover:shadow-lg h-full">
                              <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                                <img
                                  src={courier.logo}
                                  alt={courier.name}
                                  className="h-12 object-contain mb-3"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                                <p className="text-sm font-medium text-gray-700 text-center">
                                  {courier.name}
                                </p>
                              </CardContent>
                            </Card>
                          </AnimatedCard>
                        </div>
                      ),
                    )}
                  </motion.div>
                </div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-[#b6f1ea]">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                What Sellers Say About Swiftora
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Hear from e-commerce brands using Swiftora to manage couriers,
                automate shipping, and scale operations with confidence.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedCard key={index} delay={index * 0.15}>
                <Card className="border-2 hover:border-primary/50 transition-all bg-white hover:shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {testimonial.role}, {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="py-20 md:py-28 bg-blue-500 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        //add img background
        style={{
          backgroundImage: "url('/readyto-img.png') ",
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                Ready to Transform Your Shipping?
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
                Join 10,000+ Indian businesses shipping smarter with Swiftora.
                Start your free 14-day trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center ">
                <Button
                  asChild
                  size="lg"
                  className="bg-sky-900 text-white hover:bg-gray-200 shadow-2xl text-lg px-10 py-6 font-bold"
                >
                  <Link to="/login" className="flex items-center gap-2 ">
                    Start Shipping Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                {/* <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6"
                >
                  <Link to="/contact">Schedule a Demo</Link>
                </Button> */}
              </div>
              <p className="text-blue-100 mt-6 text-sm">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get answers to common questions about Swiftora's logistics
                aggregation platform for Indian businesses.
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    What is logistics aggregation and how does Swiftora help
                    Indian businesses?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Logistics aggregation consolidates multiple courier partners
                    into a single platform. Swiftora connects Indian businesses
                    to 20+ leading carriers, automatically selecting the optimal
                    shipping option based on cost, speed, and reliability across
                    metros, Tier-2 cities, and remote locations.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    How does multi-carrier shipping work with Swiftora?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Swiftora's intelligent routing engine evaluates real-time
                    rates, SLAs, and performance data from multiple carriers. It
                    automatically assigns the best courier for each shipment,
                    ensuring reliable delivery across India's diverse geography
                    while optimizing costs and transit times.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    What integrations are available for Indian e-commerce
                    platforms?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Swiftora integrates seamlessly with major Indian platforms
                    including Shopify, WooCommerce, Unicommerce, and EasyEcom.
                    We also support custom API integrations for enterprise
                    systems, ensuring smooth order flow from your e-commerce
                    platform to our logistics network.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    How does COD reconciliation work for Indian businesses?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Our automated COD system handles collection, reconciliation,
                    and remittance across all carriers. Indian businesses
                    receive real-time COD tracking, instant settlements, and
                    GST-compliant billing, reducing cash flow delays and
                    administrative overhead.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    What are the pricing models for Swiftora?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Swiftora offers transparent, volume-based pricing with no
                    hidden fees. Enterprise plans start with a free 14-day
                    trial, followed by competitive rates based on shipment
                    volume. We provide detailed cost analytics to help Indian
                    businesses optimize their logistics spend.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-6"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    How does Swiftora ensure security for Indian businesses?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Security is paramount for Indian enterprises. Swiftora
                    employs bank-grade encryption, SOC 2 compliance, and secure
                    API gateways. We adhere to Indian data protection
                    regulations, ensuring your business and customer data
                    remains protected throughout the logistics process.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-7"
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900">
                    What enterprise support is available for Indian businesses?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    Indian enterprises receive dedicated account management,
                    24/7 technical support, and priority onboarding. Our team
                    provides comprehensive training, custom integrations, and
                    strategic consulting to help businesses scale their
                    operations across India's logistics landscape.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

