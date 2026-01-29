import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
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
  // Hero illustration - logistics dashboard & map
  const HeroIllustration = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* Main dashboard card */}
        <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Live shipments
              </p>
              <p className="text-2xl font-bold text-slate-900">1,248</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <TrendingUp className="w-3 h-3" />
              98.2% on-time
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Metro
              </p>
              <p className="text-sm font-semibold text-slate-900">620</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Tier-2
              </p>
              <p className="text-sm font-semibold text-slate-900">412</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Remote
              </p>
              <p className="text-sm font-semibold text-slate-900">216</p>
            </div>
          </div>
        </div>

        {/* Map-style nodes */}
        <div className="relative rounded-2xl bg-slate-900 text-white p-5 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_90%_80%,rgba(249,115,22,0.25),transparent_55%)]" />
          </div>

          {/* Center truck icon */}
          <motion.div
            className="relative z-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Truck className="w-6 h-6 text-white" />
          </motion.div>

          {/* Route dots */}
          <div className="relative z-10 h-32">
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-100">Mumbai</span>
            </div>
            <div className="absolute right-6 top-10 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-[11px] text-slate-100">Delhi</span>
            </div>
            <div className="absolute left-10 bottom-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-slate-100">Bengaluru</span>
            </div>

            {/* Simple connecting lines */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 120">
              <path
                d="M 20 40 Q 80 10 150 50"
                fill="none"
                stroke="rgba(148, 163, 184, 0.6)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
              <path
                d="M 40 90 Q 100 70 160 60"
                fill="none"
                stroke="rgba(148, 163, 184, 0.6)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
            </svg>
          </div>

          {/* Bottom stats */}
          <div className="relative z-10 mt-3 flex items-center justify-between text-[11px] text-slate-100">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Avg. delivery 2.3 days</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>RTO reduced by 25%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

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
    },
  ];

  // How it works steps
  const howItWorks = [
    {
      step: "1",
      title: "Connect Your Store",
      description:
        "Integrate Swiftora with your e-commerce platform in minutes. We support Shopify, WooCommerce, and custom APIs.",
      icon: Plug,
    },
    {
      step: "2",
      title: "Import Orders",
      description:
        "Automatically sync orders from your store. Our system intelligently processes and prepares them for shipping.",
      icon: ShoppingCart,
    },
    {
      step: "3",
      title: "Ship & Track",
      description:
        "Print labels, schedule pickups, and track deliveries in real-time. Get instant notifications on every status change.",
      icon: Package,
    },
    {
      step: "4",
      title: "Grow Your Business",
      description:
        "Analyze performance, optimize costs, and scale effortlessly. Focus on growing while we handle logistics.",
      icon: TrendingUp,
    },
  ];

  // Why Swiftora benefits
  const benefits = [
    {
      icon: IndianRupee,
      title: "Save Up to 40%",
      description:
        "Compare rates across couriers and automatically choose the most cost-effective option for each shipment.",
    },
    {
      icon: Clock,
      title: "Faster Delivery",
      description:
        "Optimize routes and choose the fastest courier for each destination. Reduce average delivery time by 30%.",
    },
    {
      icon: Globe,
      title: "Pan-India Reach",
      description:
        "Ship to 27,000+ pin codes across India. Access remote locations through our extensive courier network.",
    },
    {
      icon: Shield,
      title: "India-First Features",
      description:
        "Built specifically for Indian e-commerce with COD support, GST compliance, and local payment integrations.",
    },
  ];

  // Integration platforms
  const integrations = {
    ecommerce: [
      { name: "Shopify", logo: "/Shopify-Logo.png" },
      { name: "WooCommerce", logo: "/WooCommerce-Logo.png" },
      { name: "Custom API", logo: "/placeholder.svg" },
      { name: "Magento", logo: "/placeholder.svg" },
    ],
    couriers: [
      { name: "BlueDart", logo: "/BlueDart-logo.webp" },
      { name: "Delhivery", logo: "/delhivery-logo.webp" },
      { name: "DTDC", logo: "/DTDC-logo.webp" },
      { name: "More...", logo: "/placeholder.svg" },
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

  const [activeFeatureTab, setActiveFeatureTab] =
    useState<(typeof featureTabs)[number]["id"]>("all");

  const filteredFeatures =
    activeFeatureTab === "all"
      ? features
      : features.filter((feature) => feature.category === activeFeatureTab);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-sky-50">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                India's #1 Shipping Platform
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="text-gray-900">Ship Faster,</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  Ship Smarter
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                All-in-one shipping and logistics platform for Indian D2C brands,
                SMEs, and e-commerce sellers. Automate shipping, reduce costs, and
                delight customers.
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
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 text-lg px-8 py-6"
                >
                  <Link to="/contact" className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Request Demo
                  </Link>
                    </Button>
                      </div>

              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>No setup fees</span>
                      </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Free 14-day trial</span>
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
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <HeroIllustration />
                    </div>
            </motion.div>
              </div>
                    </div>
        </section>

      {/* Trusted By Section */}
      <AnimatedSection className="py-12 bg-slate-100 border-y border-gray-200">
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
      </AnimatedSection>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-blue-50">
          <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Everything You Need to Ship
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore Swiftora&apos;s capabilities by category – from
                multi-courier shipping to COD and analytics.
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="flex justify-center mb-10">
              <Tabs
                value={activeFeatureTab}
                onValueChange={(v) =>
                  setActiveFeatureTab(v as (typeof featureTabs)[number]["id"])
                }
                className="w-full max-w-5xl"
              >
                <TabsList className="w-full flex flex-wrap justify-center gap-2 bg-gray-100 rounded-full p-1">
                  {featureTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200 text-gray-600 hover:text-blue-600 transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </AnimatedSection>

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
                                  (t) => t.id === feature.category
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

          {/* Desktop: Interactive grid */}
          <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredFeatures.map((feature, index) => (
              <AnimatedCard
                key={feature.title}
                delay={index * 0.08}
                className="h-full"
              >
                <Card className="group h-full border border-gray-200 hover:border-blue-500/70 transition-all bg-white/90 hover:bg-gradient-to-br hover:from-blue-50 hover:to-orange-50 shadow-sm hover:shadow-lg relative overflow-hidden">
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-orange-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-7 flex flex-col h-full relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl ${feature.bgColor} ${feature.borderColor} border-2 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-transform`}
                      >
                        <feature.icon
                          className={`w-7 h-7 ${feature.color}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {
                          featureTabs.find((t) => t.id === feature.category)
                            ?.label
                        }
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-3 flex-1">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                      Learn more
                      <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
              </AnimatedCard>
                ))}
            </div>
          </div>
        </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                How It Works
                </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From connection to delivery in four simple, automated steps.
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
                          <p className="text-sm font-semibold">
                            Online store
                          </p>
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
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 text-white flex items-center justify-center text-sm font-semibold shadow-md">
                        {step.step}
                        </div>
                      {index < howItWorks.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent mt-1" />
                      )}
                    </div>
                    <Card className="flex-1 border border-gray-200 bg-white/90 hover:border-blue-500/60 hover:shadow-md transition-all">
                      <CardContent className="p-5 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <step.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {step.title}
                        </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
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
      <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <AnimatedSection>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                  Why Choose Swiftora?
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Built specifically for Indian e-commerce businesses. We
                  understand your challenges and provide solutions that actually
                  work.
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
                <div className="bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl p-8 shadow-2xl">
                  <div className="bg-white rounded-xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Average Savings</p>
                        <p className="text-4xl font-bold text-gray-900">40%</p>
                          </div>
                      <TrendingUp className="w-12 h-12 text-green-600" />
                        </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-orange-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                      </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Delivery Time</p>
                        <p className="text-2xl font-bold text-gray-900">-30%</p>
                    </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">RTO Rate</p>
                        <p className="text-2xl font-bold text-gray-900">-25%</p>
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
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Seamless Integrations
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Connect with your favorite platforms and courier partners in
                minutes
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-5xl mx-auto space-y-12">
            {/* E-commerce Platforms */}
            <AnimatedSection>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    E-commerce Platforms
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {integrations.ecommerce.map((platform, index) => (
                    <AnimatedCard key={index} delay={index * 0.1}>
                      <Card className="border-2 hover:border-blue-500 transition-all bg-white hover:shadow-lg">
                        <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                          <img
                            src={platform.logo}
                            alt={platform.name}
                            className="h-12 object-contain mb-2"
                          />
                          <p className="text-sm font-medium text-gray-700 text-center">
                            {platform.name}
                          </p>
                  </CardContent>
                </Card>
                    </AnimatedCard>
                  ))}
              </div>
              </div>
            </AnimatedSection>

            {/* Courier Partners */}
            <AnimatedSection delay={0.2}>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-orange-600" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Courier Partners
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {integrations.couriers.map((courier, index) => (
                    <AnimatedCard key={index} delay={index * 0.1}>
                      <Card className="border-2 hover:border-orange-500 transition-all bg-white hover:shadow-lg">
                        <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                          <img
                            src={courier.logo}
                            alt={courier.name}
                            className="h-12 object-contain mb-2"
                          />
                          <p className="text-sm font-medium text-gray-700 text-center">
                            {courier.name}
                          </p>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Loved by Indian Sellers
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of businesses that trust Swiftora for their
                shipping needs
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
      <section className="py-20 md:py-28 bg-blue-800 relative overflow-hidden">
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl text-lg px-10 py-6 font-bold"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    Start Shipping Free
                    <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6"
                >
                  <Link to="/contact">Schedule a Demo</Link>
                </Button>
                      </div>
              <p className="text-blue-100 mt-6 text-sm">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
                      </div>
          </AnimatedSection>
          </div>
        </section>

        <Footer />
    </div>
  );
};

export default Index;
