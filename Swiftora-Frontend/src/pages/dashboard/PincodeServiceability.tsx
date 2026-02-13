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
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Search,
  Truck,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api";

const PincodeServiceability = () => {
  const [startPincode, setStartPincode] = useState("");
  const [destinationPincode, setDestinationPincode] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkServiceability = async () => {
    if (!startPincode || startPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit start pincode");
      return;
    }

    if (!destinationPincode || destinationPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit destination pincode");
      return;
    }

    setIsLoading(true);
    try {
      const response = await integrationsApi.checkPincodeServiceability(
        startPincode,
        destinationPincode
      );

      const data = response.data;

      if (data.success) {
        setResults({
          startPincode,
          destinationPincode,
          serviceable: data.serviceable,
          origin: data.origin,
          destination: data.destination,
          couriers: data.couriers || [],
        });

        if (data.serviceable && data.couriers?.length > 0) {
          toast.success(`Route is serviceable by ${data.couriers.length} courier(s)!`);
        } else {
          toast.warning("Route is not serviceable");
        }
      } else {
        toast.error("Failed to check serviceability");
      }
    } catch (error: any) {
      console.error("Serviceability check error:", error);
      toast.error(error.response?.data?.message || "Failed to check serviceability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCheck = () => {
    toast.info("Bulk pincode check - Feature coming soon");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
          Pincode Serviceability
        </h1>
        <p className="text-foreground/70 text-lg">
          Check if a pincode is serviceable by our courier partners
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white border border-gray-200 border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <MapPin className="w-5 h-5 text-[blue-600]" />
              Check Serviceability
            </CardTitle>
            <CardDescription className="mt-1 text-foreground/70">
              Enter pincode to check
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-foreground">Start Pincode (From)</Label>
              <Input
                value={startPincode}
                onChange={(e) =>
                  setStartPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit start pincode"
                maxLength={6}
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">
                Destination Pincode (To)
              </Label>
              <Input
                value={destinationPincode}
                onChange={(e) =>
                  setDestinationPincode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit destination pincode"
                maxLength={6}
                className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
              />
            </div>
            <Button
              onClick={checkServiceability}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Checking..." : "Check Serviceability"}
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-200 hover:bg-[blue-600]/10"
              onClick={handleBulkCheck}
            >
              <Download className="w-4 h-4 mr-2" />
              Bulk Check (CSV)
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {results ? (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Serviceability Results
                    </CardTitle>
                    <CardDescription className="mt-1 text-foreground/70">
                      {results.origin?.city || results.startPincode} ({results.startPincode}) → {results.destination?.city || results.destinationPincode} ({results.destinationPincode})
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      results.serviceable
                        ? "bg-[blue-600]/20 text-[blue-600] border-gray-200"
                        : "bg-[orange-600]/20 text-[orange-600] border-orange-200"
                    }
                  >
                    {results.serviceable ? "Serviceable" : "Not Serviceable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {results.couriers.map((courier: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white "
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-[blue-600]" />
                          <h3 className="font-semibold text-lg text-foreground">
                            {courier.name}
                          </h3>
                        </div>
                        {courier.serviceable ? (
                          <CheckCircle2 className="w-5 h-5 text-[blue-600]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[orange-600]" />
                        )}
                      </div>
                      {courier.serviceable && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-foreground/60">
                              COD Available
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                courier.cod
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-600 border-red-200"
                              }
                            >
                              {courier.cod ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-xs text-foreground/60">
                              Prepaid Available
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                courier.prepaid
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-600 border-red-200"
                              }
                            >
                              {courier.prepaid ? "Yes" : "No"}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-xs text-foreground/60">
                              Destination
                            </div>
                            <div className="font-semibold text-foreground">
                              {courier.destinationCity || results.destination?.city || '-'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {results.couriers?.length === 0 && (
                    <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200">
                      <XCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
                      <h3 className="text-lg font-semibold text-red-700 mb-2">
                        Route Not Serviceable
                      </h3>
                      <p className="text-red-600">
                        {!results.origin?.found ? `Origin pincode ${results.startPincode} is not serviceable.` :
                          !results.destination?.found ? `Destination pincode ${results.destinationPincode} is not serviceable.` :
                            'This route is not currently serviceable by Delhivery.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="p-12 text-center">
                <MapPin className="w-16 h-16 mx-auto text-[blue-600]/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Results
                </h3>
                <p className="text-foreground/60">
                  Enter a pincode and click Check Serviceability
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PincodeServiceability;
