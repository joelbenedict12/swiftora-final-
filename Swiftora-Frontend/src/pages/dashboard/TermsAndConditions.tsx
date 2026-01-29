import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Save, Eye, Download } from "lucide-react";
import { toast } from "sonner";

const TermsAndConditions = () => {
  const [terms, setTerms] = useState({
    shipping: `1. Shipping Terms and Conditions

1.1 Delivery Timeframes
- Standard delivery: 3-7 business days
- Express delivery: 1-2 business days
- Delivery times are estimates and not guaranteed

1.2 Shipping Charges
- Shipping charges are calculated based on weight, dimensions, and destination
- COD charges apply for Cash on Delivery orders
- All charges are inclusive of GST

1.3 Delivery Address
- Customer is responsible for providing accurate delivery address
- Changes to delivery address after dispatch may incur additional charges
- Failed deliveries due to incorrect address will result in RTO charges

1.4 Liability
- We are not liable for delays caused by courier partners
- Insurance coverage available for high-value shipments
- Claims must be filed within 7 days of delivery

2. Return and Refund Policy

2.1 Return Eligibility
- Items must be returned within 7 days of delivery
- Products must be in original condition with tags
- Customized items are not eligible for return

2.2 Refund Process
- Refunds processed within 5-7 business days
- Original shipping charges are non-refundable
- COD orders: Refund to original payment method`,

    privacy: `Privacy Policy

1. Information Collection
We collect information necessary to process and deliver your orders, including:
- Name, address, and contact details
- Payment information (processed securely)
- Order history and preferences

2. Data Usage
Your information is used to:
- Process and fulfill orders
- Communicate order updates
- Improve our services
- Comply with legal requirements

3. Data Security
- All data is encrypted and stored securely
- We do not share your information with third parties except for order fulfillment
- Payment information is processed through secure payment gateways

4. Your Rights
- Access your personal data
- Request data correction
- Request data deletion
- Opt-out of marketing communications`,

    service: `Service Terms

1. Service Availability
- Services are available across India
- Some areas may have limited courier coverage
- International shipping available on request

2. Account Terms
- You must be 18+ to use our services
- Account information must be accurate
- You are responsible for account security

3. Prohibited Items
- Items listed in our Restricted Items policy cannot be shipped
- Violation may result in account suspension
- We reserve the right to refuse service

4. Dispute Resolution
- Disputes should be raised through our support system
- We aim to resolve disputes within 7 business days
- Legal disputes subject to Mumbai jurisdiction`,
  });

  const handleSave = (type: string) => {
    toast.success(`${type} terms saved successfully`);
  };

  const handlePreview = (type: string) => {
    toast.info(`Previewing ${type} terms`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your terms of service, privacy policy, and shipping terms
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList>
          <TabsTrigger value="shipping">Shipping Terms</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="service">Service Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="shipping" className="mt-6">
          <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    Shipping Terms and Conditions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Terms related to shipping and delivery
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("Shipping")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave("Shipping")}
                    className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div>
                <Label>Shipping Terms Content</Label>
                <Textarea
                  value={terms.shipping}
                  onChange={(e) =>
                    setTerms({ ...terms, shipping: e.target.value })
                  }
                  rows={20}
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    Privacy Policy
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Customer data and privacy terms
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("Privacy")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave("Privacy")}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div>
                <Label>Privacy Policy Content</Label>
                <Textarea
                  value={terms.privacy}
                  onChange={(e) =>
                    setTerms({ ...terms, privacy: e.target.value })
                  }
                  rows={20}
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service" className="mt-6">
          <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">
                    Service Terms
                  </CardTitle>
                  <CardDescription className="mt-1">
                    General terms of service
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("Service")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave("Service")}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div>
                <Label>Service Terms Content</Label>
                <Textarea
                  value={terms.service}
                  onChange={(e) =>
                    setTerms({ ...terms, service: e.target.value })
                  }
                  rows={20}
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TermsAndConditions;
