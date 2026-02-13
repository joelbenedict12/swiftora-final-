import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Removed OTP imports
import {
  LogIn,
  UserPlus,
  Phone,
  Lock,
  User,
  ArrowRight,
  Rocket,
  Shield,
  Zap,
  Send,
  Box,
  Building2,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().trim().min(2, "Company name is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login, register, user, token, _hasHydrated } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [shippingType, setShippingType] = useState<"b2c" | "b2b" | "">("");
  const [monthlyVolume, setMonthlyVolume] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    companyName: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && user && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, token, _hasHydrated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = loginSchema.parse(loginData);
      setIsLoading(true);

      await login(data.email, data.password);

      // Get the user after login to check if admin
      const { user: loggedInUser } = useAuth.getState();

      toast.success("Login successful! Welcome back.");
      setLoginData({ email: "", password: "" });

      // Redirect admin users to admin dashboard, others to regular dashboard
      if (loggedInUser?.isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message =
          (error as any)?.message || "Login failed. Please check your credentials.";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = signupSchema.parse(signupData);

      if (!shippingType) {
        toast.error("Please select B2C or B2B shipping");
        setSignupStep(1);
        return;
      }

      if (!monthlyVolume) {
        toast.error("Please select your monthly shipment volume");
        setSignupStep(2);
        return;
      }

      setIsLoading(true);

      await register({
        email: data.email,
        phone: data.mobile,  // Backend expects 'phone'
        name: data.name,
        password: data.password,
        companyName: data.companyName,  // Backend expects 'companyName'
      });

      toast.success("Account created successfully! Welcome to Swiftora.");
      setSignupData({ name: "", mobile: "", email: "", password: "", companyName: "" });
      setShippingType("");
      setMonthlyVolume("");
      setSignupStep(1);
      setActiveTab("login");
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message =
          (error as any)?.message || "Signup failed. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content - Split Screen Design */}
      <div
        className="pt-16 min-h-[calc(100vh-4rem)] flex "
        style={{ backgroundImage: "url(/login_img.png)" }}
      >
        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>

          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
            <div className="max-w-md">
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold">Platform</h1>
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                  Welcome back!
                </h2>
                <p className="text-white/90 text-lg leading-relaxed">
                  Sign in to access your platform dashboard and manage your
                  operations with powerful tools.
                </p>
              </div>

              <div className="space-y-4 mt-12">
                {[
                  { icon: Zap, text: "Lightning-fast performance" },
                  { icon: Shield, text: "Enterprise-grade security" },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12  bg-black/50">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[hsl(210_100%_60%)]/10 rounded-xl flex items-center justify-center border border-[hsl(210_100%_60%)]/30">
                  <Rocket className="w-6 h-6 text-[hsl(210_100%_60%)]" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Platform</h1>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {activeTab === "login"
                  ? "Welcome back!"
                  : "Create your account"}
              </h2>
              <p className="text-foreground/70">
                {activeTab === "login"
                  ? "Sign in to access your platform dashboard"
                  : "Join thousands of businesses using our platform"}
              </p>
            </div>

            {/* Form Card */}
            <Card className="bg-background/90 backdrop-blur-xl border-[hsl(210_100%_60%)]/30 shadow-lg p-8 md:p-10">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-[hsl(210_100%_60%)]/10 p-1 rounded-xl">
                  <TabsTrigger
                    value="login"
                    className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="font-semibold">Login</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-semibold">Sign Up</span>
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label
                        htmlFor="login-email"
                        className="block text-sm font-semibold text-foreground mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          placeholder="you@company.com"
                          className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-sm font-semibold text-gray-900 mb-2"
                      >
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="login-password"
                          name="password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Enter your password"
                          className="pl-12 pr-12 h-14 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                          tabIndex={-1}
                        >
                          {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[hsl(210_100%_60%)] border-2 border-[hsl(210_100%_60%)]/30 rounded focus:ring-2 focus:ring-[hsl(210_100%_60%)]/20 cursor-pointer"
                        />
                        <span className="text-sm text-foreground/70 group-hover:text-gray-900 transition-colors">
                          Remember me
                        </span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl text-base font-semibold mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </span>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <AnimatePresence mode="wait">
                      {signupStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4 text-center"
                        >
                          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                            What type of shipping do you need?
                          </h3>
                          <p className="text-sm text-foreground/70 mb-3">
                            Choose the primary way you&apos;ll use Swiftora.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <button
                              type="button"
                              onClick={() => setShippingType("b2c")}
                              className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all ${shippingType === "b2c"
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-border bg-background hover:border-blue-200 hover:bg-blue-50/40"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${shippingType === "b2c"
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-50 text-blue-600"
                                    }`}
                                >
                                  <Box className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">
                                    B2C Shipping
                                  </p>
                                  <p className="text-xs text-foreground/70">
                                    For individual customers and small shipments
                                  </p>
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShippingType("b2b")}
                              className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all ${shippingType === "b2b"
                                ? "border-slate-700 bg-slate-900 text-slate-50 shadow-md"
                                : "border-border bg-background hover:border-slate-400 hover:bg-slate-900/5"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${shippingType === "b2b"
                                    ? "bg-slate-800 text-slate-50"
                                    : "bg-slate-100 text-slate-800"
                                    }`}
                                >
                                  <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                  <p
                                    className={`font-semibold text-sm ${shippingType === "b2b"
                                      ? "text-slate-50"
                                      : "text-slate-900"
                                      }`}
                                  >
                                    B2B Shipping
                                  </p>
                                  <p
                                    className={`text-xs ${shippingType === "b2b"
                                      ? "text-slate-200"
                                      : "text-slate-600"
                                      }`}
                                  >
                                    For bulk, GST and business logistics
                                  </p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {signupStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4 text-center"
                        >
                          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                            How many shipments do you send per month?
                          </h3>
                          <p className="text-sm text-foreground/70 mb-3">
                            This helps us tailor your experience and pricing.
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-left">
                            {[
                              "0–50",
                              "50–200",
                              "200–1,000",
                              "1,000+",
                              "Not sure yet",
                            ].map((range) => (
                              <button
                                key={range}
                                type="button"
                                onClick={() => setMonthlyVolume(range)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${monthlyVolume === range
                                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-border bg-background hover:border-blue-200 hover:bg-blue-50/40"
                                  }`}
                              >
                                {range}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {signupStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                            Basic account details
                          </h3>
                          <p className="text-sm text-foreground/70 mb-3">
                            We&apos;ll use this to set up your Swiftora account and
                            create your merchant workspace.
                          </p>

                          <div>
                            <label
                              htmlFor="signup-name"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              Full Name
                            </label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                              <Input
                                id="signup-name"
                                name="name"
                                type="text"
                                value={signupData.name}
                                onChange={handleSignupChange}
                                placeholder="John Doe"
                                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="signup-email"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              Email Address
                            </label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                              <Input
                                id="signup-email"
                                name="email"
                                type="email"
                                value={signupData.email}
                                onChange={handleSignupChange}
                                placeholder="you@company.com"
                                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="signup-mobile"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              Phone Number
                            </label>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                              <Input
                                id="signup-mobile"
                                name="mobile"
                                type="tel"
                                value={signupData.mobile}
                                onChange={handleSignupChange}
                                placeholder="Enter your mobile number"
                                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="signup-company"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                              >
                                Company Name
                              </label>
                              <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input
                                  id="signup-company"
                                  name="companyName"
                                  type="text"
                                  value={signupData.companyName}
                                  onChange={handleSignupChange}
                                  placeholder="Your company or store name"
                                  className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="signup-password"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                              >
                                Password
                              </label>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                <Input
                                  id="signup-password"
                                  name="password"
                                  type={showSignupPassword ? "text" : "password"}
                                  value={signupData.password}
                                  onChange={handleSignupChange}
                                  placeholder="Create a strong password"
                                  className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSignupPassword((v) => !v)}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                                  tabIndex={-1}
                                >
                                  {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 pt-2">
                            <input
                              type="checkbox"
                              id="terms"
                              className="w-5 h-5 mt-0.5 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
                              required
                            />
                            <label
                              htmlFor="terms"
                              className="text-sm text-foreground/70 cursor-pointer leading-relaxed"
                            >
                              I agree to the{" "}
                              <Link
                                to="/terms"
                                className="text-primary hover:text-primary/80 font-semibold"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                to="/privacy"
                                className="text-primary hover:text-primary/80 font-semibold"
                              >
                                Privacy Policy
                              </Link>
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-6 flex items-center justify-between">
                      {signupStep > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-sm text-foreground/70 hover:text-foreground"
                          onClick={() =>
                            setSignupStep((prev) =>
                              prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev
                            )
                          }
                        >
                          Back
                        </Button>
                      ) : (
                        <span />
                      )}

                      <Button
                        type={signupStep === 3 ? "submit" : "button"}
                        size="lg"
                        className="h-12 px-6 bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90  text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl text-sm font-semibold"
                        disabled={isLoading}
                        onClick={() => {
                          if (isLoading) return;
                          if (signupStep === 1) {
                            if (!shippingType) {
                              toast.error("Please select a shipping type");
                              return;
                            }
                            setSignupStep(2);
                          } else if (signupStep === 2) {
                            if (!monthlyVolume) {
                              toast.error(
                                "Please select your monthly shipment volume"
                              );
                              return;
                            }
                            setSignupStep(3);
                          }
                        }}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {signupStep === 3
                              ? "Creating account..."
                              : "Loading..."}
                          </span>
                        ) : (
                          <>
                            {signupStep === 3 ? "Create Account" : "Continue"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[hsl(210_100%_60%)]/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background/90 text-foreground/70 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-1">
                <Button
                  variant="outline"
                  className="h-14 border-2 border-[hsl(210_100%_60%)]/30 hover:border-[hsl(210_100%_60%)]/50 hover:bg-[hsl(210_100%_60%)]/10 rounded-xl transition-all font-semibold grid place-items-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                {/* <Button
                  variant="outline"
                  className="h-14 border-2 border-[hsl(210_100%_60%)]/30 hover:border-[hsl(210_100%_60%)]/50 hover:bg-[hsl(210_100%_60%)]/10 rounded-xl transition-all font-semibold"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button> */}
              </div>
            </Card>

            {/* Additional Links */}
            {/* <div className="text-center mt-6">
              <p className="text-foreground/70">
                Need help?{" "}
                <Link
                  to="/contact"
                  className="text-[hsl(210_100%_60%)] hover:text-[hsl(210_100%_60%)]/80 font-semibold transition-colors"
                >
                  Contact Support
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default Login;
