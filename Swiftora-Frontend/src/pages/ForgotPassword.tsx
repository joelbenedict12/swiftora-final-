import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

const ForgotPassword = () => {
    const { forgotPassword, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = emailSchema.parse({ email });
            await forgotPassword(data.email);
            toast.success("Reset email sent! Please check your inbox.");
            setEmailSent(true);
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast.error(error.errors[0].message);
            } else {
                toast.error((error as any)?.message || "Failed to send reset email");
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="pt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <Card className="bg-background/90 backdrop-blur-xl border-primary/30 shadow-lg p-8 md:p-10">
                        {!emailSent ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                        <Mail className="w-8 h-8 text-primary" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-foreground mb-2">
                                        Forgot Password?
                                    </h1>
                                    <p className="text-muted-foreground">
                                        No worries! Enter your email and we'll send you reset instructions.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-semibold text-foreground mb-2"
                                        >
                                            Email Address
                                        </label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@company.com"
                                                className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl text-base font-semibold"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Sending...
                                            </span>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 mr-2" />
                                                Send Reset Link
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                    <Send className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Check Your Email
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>.
                                    Please check your inbox and follow the instructions.
                                </p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Didn't receive it?{" "}
                                    <button
                                        onClick={() => setEmailSent(false)}
                                        className="text-primary hover:text-primary/80 font-semibold"
                                    >
                                        Try another email
                                    </button>
                                </p>
                                <Link to="/login">
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
