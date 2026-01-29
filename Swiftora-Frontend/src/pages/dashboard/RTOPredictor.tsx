import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";

const RTOPredictor = () => {
  const [formData, setFormData] = useState({
    orderId: "",
    startPincode: "",
    pincode: "",
    amount: "",
    paymentMode: "prepaid",
    productCategory: "",
    customerHistory: "new",
  });

  const [prediction, setPrediction] = useState<any>(null);

  const calculateRTORisk = () => {
    if (!formData.startPincode || formData.startPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit start pincode");
      return;
    }

    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit destination pincode");
      return;
    }

    if (!formData.amount) {
      toast.error("Please enter order amount");
      return;
    }

    // Simulate RTO prediction
    let riskScore = 0;
    let factors: string[] = [];

    if (formData.paymentMode === "cod") {
      riskScore += 30;
      factors.push("COD orders have higher RTO risk");
    }

    if (parseFloat(formData.amount) > 5000) {
      riskScore += 20;
      factors.push("High value orders are more prone to RTO");
    }

    if (formData.customerHistory === "new") {
      riskScore += 25;
      factors.push("New customers have higher RTO probability");
    }

    if (formData.productCategory === "electronics") {
      riskScore += 15;
      factors.push("Electronics category shows higher RTO rates");
    }

    // Randomize based on pincode (simulate)
    const pincodeRisk = parseInt(formData.pincode.slice(-1)) * 2;
    riskScore += pincodeRisk;

    riskScore = Math.min(riskScore, 100);

    const riskLevel =
      riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high";
    const recommendation =
      riskScore < 30
        ? "Safe to ship. Standard process recommended."
        : riskScore < 60
        ? "Moderate risk. Consider customer verification before dispatch."
        : "High risk. Strongly recommend customer verification and confirmation before shipping.";

    setPrediction({
      riskScore,
      riskLevel,
      factors,
      recommendation,
      estimatedRTORate: `${riskScore}%`,
    });

    toast.success("RTO risk calculated successfully");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
          RTO Predictor
        </h1>
        <p className="text-foreground/70 text-lg">
          Predict the risk of Return to Origin (RTO) for your orders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white border border-gray-200 border-gray-200 shadow-lg sticky top-4">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <TrendingDown className="w-5 h-5 text-[blue-600]" />
              Predict RTO Risk
            </CardTitle>
            <CardDescription className="mt-1 text-foreground/70">
              Enter order details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-foreground">Order ID (Optional)</Label>
              <Input
                value={formData.orderId}
                onChange={(e) =>
                  setFormData({ ...formData, orderId: e.target.value })
                }
                placeholder="ORD-12345"
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Start Pincode (From) *</Label>
              <Input
                value={formData.startPincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startPincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                placeholder="400001"
                maxLength={6}
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">
                Destination Pincode (To) *
              </Label>
              <Input
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                placeholder="110001"
                maxLength={6}
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Order Amount (₹) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="1000"
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Payment Mode *</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMode: value })
                }
              >
                <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-gray-200">
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Product Category</Label>
              <Select
                value={formData.productCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, productCategory: value })
                }
              >
                <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-gray-200">
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="home">Home & Living</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Customer History</Label>
              <Select
                value={formData.customerHistory}
                onValueChange={(value) =>
                  setFormData({ ...formData, customerHistory: value })
                }
              >
                <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-gray-200">
                  <SelectItem value="new">New Customer</SelectItem>
                  <SelectItem value="returning">Returning Customer</SelectItem>
                  <SelectItem value="frequent">Frequent Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={calculateRTORisk}
              className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
            >
              <Search className="w-4 h-4 mr-2" />
              Predict RTO Risk
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {prediction ? (
            <>
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-foreground">
                    RTO Risk Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-[blue-600]/10 to-[orange-600]/10 rounded-xl border border-gray-200">
                      <div
                        className="text-5xl font-bold mb-2"
                        style={{
                          color:
                            prediction.riskLevel === "low"
                              ? "#2563eb"
                              : prediction.riskLevel === "medium"
                              ? "#ea580c"
                              : "#ea580c",
                        }}
                      >
                        {prediction.riskScore}%
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        RTO Risk Score
                      </div>
                      <Badge
                        className={`mt-3 ${
                          prediction.riskLevel === "low"
                            ? "bg-[blue-600]/20 text-[blue-600] border-gray-200"
                            : prediction.riskLevel === "medium"
                            ? "bg-[orange-600]/20 text-[orange-600] border-orange-200"
                            : "bg-[orange-600]/30 text-[orange-600] border-[orange-600]/40"
                        }`}
                      >
                        {prediction.riskLevel === "low" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {prediction.riskLevel.charAt(0).toUpperCase() +
                          prediction.riskLevel.slice(1)}{" "}
                        Risk
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-foreground">Risk Level</Label>
                        <span className="text-sm font-semibold text-foreground">
                          {prediction.riskScore}%
                        </span>
                      </div>
                      <div className="w-full bg-foreground/10 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            prediction.riskLevel === "low"
                              ? "bg-[blue-600]"
                              : prediction.riskLevel === "medium"
                              ? "bg-[orange-600]"
                              : "bg-[orange-600]"
                          }`}
                          style={{ width: `${prediction.riskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                      <div className="flex items-start gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-[blue-600] mt-0.5" />
                        <div className="font-semibold text-[blue-600]">
                          Recommendation
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {prediction.recommendation}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-foreground">
                        Risk Factors Identified:
                      </h4>
                      <div className="space-y-2">
                        {prediction.factors.map(
                          (factor: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-3 bg-foreground/5 rounded-lg border border-[orange-600]/20"
                            >
                              <AlertTriangle className="w-4 h-4 text-[orange-600] mt-0.5" />
                              <span className="text-sm text-foreground/80">
                                {factor}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        View Detailed Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="p-12 text-center">
                <TrendingDown className="w-16 h-16 mx-auto text-[blue-600]/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Prediction Available
                </h3>
                <p className="text-foreground/60">
                  Enter order details and click Predict RTO Risk
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RTOPredictor;
