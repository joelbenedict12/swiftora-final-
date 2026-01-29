import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resetPassword, isLoading } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetSuccessful, setResetSuccessful] = useState(false);
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            toast.error("Invalid reset link");
            navigate("/login");
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = passwordSchema.parse({ password, confirmPassword });

            if (!token) {
                toast.error("Invalid reset token");
                return;
            }

            await resetPassword(token, data.password);
            setResetSuccessful(true);
            toast.success("Password reset successful!");

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast.error(error.errors[0].message);
            } else {
                const errorMessage = (error as any)?.message || "Failed to reset password";

                // Provide more specific error messages
                if (errorMessage.includes("expired")) {
                    toast.error("This reset link has expired. Please request a new one.");
                } else if (errorMessage.includes("invalid")) {
                    toast.error("This reset link is invalid. Please request a new one.");
                } else {
                    toast.error(errorMessage);
                }
            }
        }
    };

    if (!token) {
        return null;
    }

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
                        {!resetSuccessful ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                        <Lock className="w-8 h-8 text-primary" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-foreground mb-2">
                                        Reset Your Password
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Enter your new password below
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-semibold text-foreground mb-2"
                                        >
                                            New Password
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block text-sm font-semibold text-foreground mb-2"
                                        >
                                            Confirm Password
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
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
                                                Resetting...
                                            </span>
                                        ) : (
                                            "Reset Password"
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
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Password Reset Successful!
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    Your password has been updated successfully.
                                    Redirecting to login...
                                </p>
                                <Link to="/login">
                                    <Button className="w-full">
                                        Go to Login
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

export default ResetPassword;
