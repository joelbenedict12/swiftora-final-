import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Clock,
  Headphones,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(20),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = contactSchema.parse(formData);

      setIsSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
                  <Send className="w-4 h-4" />
                  Contact Us
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-center">
                <span className="text-foreground">We're here to</span>
                <br />
                <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(261,78%,44%)] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  help you succeed
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Have questions or need assistance? Our team is ready to help.
                Reach out and we'll respond as quickly as possible.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-20 md:py-32 relative bg-gradient-to-r from-[#40C9FF] to-[#E81CFF]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-block mb-6">
                <span className="px-6 py-3 bg-[hsl(210_100%_60%)]/10 text-white rounded-full text-sm font-bold border border-[hsl(210_100%_60%)]/30">
                  📞 GET IN TOUCH
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-foreground">
                Multiple ways to{" "}
                {/* <span className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] bg-clip-text text-transparent"> */}
                connect
                {/* </span> */}
              </h2>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
                Choose your preferred method of communication and we'll respond
                promptly
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto mb-16">
              {[
                {
                  icon: MapPin,
                  title: "Visit Us",
                  content: [
                    "456 Tech Boulevard",
                    "Suite 1200",
                    "San Francisco, CA 94105",
                  ],
                  color: "text-[hsl(210_100%_60%)]",
                  bgColor: "bg-[hsl(210_100%_60%)]/10",
                  borderColor: "border-[hsl(210_100%_60%)]/30",
                },
                {
                  icon: Phone,
                  title: "Call Us",
                  content: [
                    "Main: +1 (555) 987-6543",
                    "Support: +1 (555) 987-6544",
                    "Mon-Fri, 8AM-8PM PST",
                  ],
                  color: "text-[hsl(25_95%_55%)]",
                  bgColor: "bg-[hsl(25_95%_55%)]/10",
                  borderColor: "border-[hsl(25_95%_55%)]/30",
                },
                {
                  icon: Mail,
                  title: "Email Us",
                  content: [
                    "General: contact@platform.com",
                    "Support: support@platform.com",
                    "Sales: sales@platform.com",
                  ],
                  color: "text-[hsl(210_100%_60%)]",
                  bgColor: "bg-[hsl(210_100%_60%)]/10",
                  borderColor: "border-[hsl(210_100%_60%)]/30",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 hover:border-[hsl(25_95%_55%)]/50 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 text-center">
                    <CardContent className="p-8 lg:p-10">
                      <div className="relative mb-8">
                        <div
                          className={`w-20 h-20 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-all duration-500 shadow-lg border ${item.borderColor}`}
                        >
                          <item.icon className={`w-10 h-10 ${item.color}`} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[hsl(25_95%_55%)]/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-[hsl(210_100%_60%)] transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="space-y-1">
                        {item.content.map((line, i) => (
                          <p
                            key={i}
                            className="text-foreground/70 leading-relaxed text-lg"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto ">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Send us a message
                </h2>
                <p className="text-lg text-foreground/70">
                  We'll get back to you within 24 hours
                </p>
              </div>

              <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-foreground mb-2"
                        >
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="h-12 border-[hsl(210_100%_60%)]/30 focus:border-[hsl(210_100%_60%)] bg-background/50"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-semibold text-foreground mb-2"
                        >
                          Phone Number *
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 123-4567"
                          className="h-12 border-[hsl(210_100%_60%)]/30 focus:border-[hsl(210_100%_60%)] bg-background/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-foreground mb-2"
                      >
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="h-12 border-[hsl(210_100%_60%)]/30 focus:border-[hsl(210_100%_60%)] bg-background/50"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-foreground mb-2"
                      >
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        rows={6}
                        className="border-[hsl(210_100%_60%)]/30 focus:border-[hsl(210_100%_60%)] resize-none bg-background/50"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-20 md:py-28 relative bg-gradient-to-br from-[hsl(210_100%_60%)]/5 to-[hsl(207,97%,45%)]/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Need Immediate Assistance?
                </h2>
                <p className="text-lg text-foreground/70">
                  Our support team is available 24/7 to help you
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-background/90 border-[hsl(210_100%_60%)]/30 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-[hsl(210_100%_60%)]/10 rounded-xl flex items-center justify-center border border-[hsl(210_100%_60%)]/30">
                        <Headphones className="w-8 h-8 text-[hsl(210_100%_60%)]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Live Chat Support
                        </h3>
                        <p className="text-foreground/70 mb-4">
                          Get instant help from our support team
                        </p>
                        <Button className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white">
                          Start Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/90 border-[hsl(25_95%_55%)]/30 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-[hsl(25_95%_55%)]/10 rounded-xl flex items-center justify-center border border-[hsl(25_95%_55%)]/30">
                        <HelpCircle className="w-8 h-8 text-[hsl(25_95%_55%)]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Knowledge Base
                        </h3>
                        <p className="text-foreground/70 mb-4">
                          Browse our comprehensive documentation
                        </p>
                        <Button
                          variant="outline"
                          className="border-[hsl(25_95%_55%)]/30 hover:bg-[hsl(25_95%_55%)]/10"
                        >
                          View Docs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Contact;
