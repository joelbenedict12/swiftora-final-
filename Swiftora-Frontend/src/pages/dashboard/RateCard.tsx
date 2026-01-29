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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Search,
  Truck,
  DollarSign,
  MapPin,
  Rocket,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const RateCard = () => {
  const [selectedCourier, setSelectedCourier] = useState("all");

  const courierLogos = {
    Delhivery: "/delhivery-logo.webp",
    BlueDart: "/BlueDart-logo.webp",
    DTDC: "/DTDC-logo.webp",
  };
  const rateCards = {
    Delhivery: [
      {
        weight: "0-0.5 kg",
        baseRate: 50,
        perKg: 0,
        codCharge: "2.5%",
        express: 75,
      },
      {
        weight: "0.5-1 kg",
        baseRate: 50,
        perKg: 30,
        codCharge: "2.5%",
        express: 90,
      },
      {
        weight: "1-2 kg",
        baseRate: 50,
        perKg: 30,
        codCharge: "2.5%",
        express: 120,
      },
      {
        weight: "2-5 kg",
        baseRate: 50,
        perKg: 30,
        codCharge: "2.5%",
        express: 180,
      },
      {
        weight: "5-10 kg",
        baseRate: 50,
        perKg: 30,
        codCharge: "2.5%",
        express: 280,
      },
    ],
    BlueDart: [
      {
        weight: "0-0.5 kg",
        baseRate: 60,
        perKg: 0,
        codCharge: "2.0%",
        express: 90,
      },
      {
        weight: "0.5-1 kg",
        baseRate: 60,
        perKg: 35,
        codCharge: "2.0%",
        express: 110,
      },
      {
        weight: "1-2 kg",
        baseRate: 60,
        perKg: 35,
        codCharge: "2.0%",
        express: 140,
      },
      {
        weight: "2-5 kg",
        baseRate: 60,
        perKg: 35,
        codCharge: "2.0%",
        express: 200,
      },
      {
        weight: "5-10 kg",
        baseRate: 60,
        perKg: 35,
        codCharge: "2.0%",
        express: 300,
      },
    ],
    // Shiprocket: [
    //   { weight: "0-0.5 kg", baseRate: 45, perKg: 0, codCharge: "2.5%", express: 70 },
    //   { weight: "0.5-1 kg", baseRate: 45, perKg: 25, codCharge: "2.5%", express: 85 },
    //   { weight: "1-2 kg", baseRate: 45, perKg: 25, codCharge: "2.5%", express: 110 },
    //   { weight: "2-5 kg", baseRate: 45, perKg: 25, codCharge: "2.5%", express: 160 },
    //   { weight: "5-10 kg", baseRate: 45, perKg: 25, codCharge: "2.5%", express: 250 }
    // ],
    DTDC: [
      {
        weight: "0-0.5 kg",
        baseRate: 40,
        perKg: 0,
        codCharge: "2.0%",
        express: 65,
      },
      {
        weight: "0.5-1 kg",
        baseRate: 40,
        perKg: 28,
        codCharge: "2.0%",
        express: 80,
      },
      {
        weight: "1-2 kg",
        baseRate: 40,
        perKg: 28,
        codCharge: "2.0%",
        express: 105,
      },
      {
        weight: "2-5 kg",
        baseRate: 40,
        perKg: 28,
        codCharge: "2.0%",
        express: 150,
      },
      {
        weight: "5-10 kg",
        baseRate: 40,
        perKg: 28,
        codCharge: "2.0%",
        express: 230,
      },
    ],
  };

  const handleExport = () => {
    toast.success("Rate card exported successfully");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
            Rate Card
          </h1>
          <p className="text-foreground/70 text-lg">
            View shipping rates for all courier partners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCourier} onValueChange={setSelectedCourier}>
            <SelectTrigger className="w-[200px] bg-background/50 border-gray-200 text-foreground">
              <SelectValue placeholder="Filter by courier" />
            </SelectTrigger>
            <SelectContent className="bg-background border-gray-200">
              <SelectItem value="all">All Couriers</SelectItem>
              <SelectItem value="delhivery">Delhivery</SelectItem>
              <SelectItem value="bluedart">BlueDart</SelectItem>
              <SelectItem value="shiprocket">Shiprocket</SelectItem>
              <SelectItem value="dtdc">DTDC</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-gray-200 hover:bg-[blue-600]/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="bg-[blue-600]/10 border-gray-200">
          <TabsTrigger
            value="standard"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Standard Rates
          </TabsTrigger>
          <TabsTrigger
            value="express"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Express Rates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6 space-y-6">
          {(selectedCourier === "all"
            ? Object.keys(rateCards)
            : [
                selectedCourier.charAt(0).toUpperCase() +
                  selectedCourier.slice(1),
              ]
          ).map((courier) => (
            <Card
              key={courier}
              className="bg-white border border-gray-200 shadow-lg"
            >
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-[blue-600]" />
                    <CardTitle className="text-xl font-bold text-foreground">
                      {courier in courierLogos ? (
                        <img
                          src={
                            courierLogos[courier as keyof typeof courierLogos]
                          }
                          alt={courier}
                          className="h-5 w-15"
                        />
                      ) : (
                        courier
                      )}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gray-200 text-foreground/80"
                  >
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border border-gray-200 overflow-x-auto bg-white border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[blue-600]/10 to-[blue-600]/5 border-b border-gray-200">
                        <TableHead className="font-semibold text-foreground">
                          Weight Slab
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Base Rate (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Per Additional Kg (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          COD Charge
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          GST (18%)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateCards[courier as keyof typeof rateCards].map(
                        (rate, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-blue-50 border-b border-gray-200"
                          >
                            <TableCell className="font-medium text-foreground">
                              {rate.weight}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              ₹{rate.baseRate}
                            </TableCell>
                            <TableCell className="text-foreground/80">
                              {rate.perKg > 0 ? `₹${rate.perKg}` : "-"}
                            </TableCell>
                            <TableCell className="text-foreground/80">
                              {rate.codCharge}
                            </TableCell>
                            <TableCell className="text-foreground/70">
                              18%
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                  <p className="text-sm text-foreground/80">
                    <strong>Note:</strong> Rates are exclusive of GST. Final
                    amount includes 18% GST. COD charges apply only for Cash on
                    Delivery orders.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="express" className="mt-6 space-y-6">
          {(selectedCourier === "all"
            ? Object.keys(rateCards)
            : [
                selectedCourier.charAt(0).toUpperCase() +
                  selectedCourier.slice(1),
              ]
          ).map((courier) => (
            <Card
              key={courier}
              className="bg-white border border-gray-200 shadow-lg"
            >
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-[orange-600]" />
                    <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                      {courier in courierLogos ? (
                        <img
                          src={
                            courierLogos[courier as keyof typeof courierLogos]
                          }
                          alt={courier}
                          className="h-8"
                        />
                      ) : (
                        courier
                      )}
                      <span>- Express</span>
                    </CardTitle>
                  </div>
                  <img
                    src="https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505081.jpg"
                    alt="Express Delivery"
                    className="w-24 h-14"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border border-gray-200 overflow-x-auto bg-white border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[orange-600]/10 to-[orange-600]/5 border-b border-[orange-600]/20">
                        <TableHead className="font-semibold text-foreground">
                          Weight Slab
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Express Rate (₹)
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Delivery Time
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          COD Charge
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateCards[courier as keyof typeof rateCards].map(
                        (rate, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-[orange-600]/5 border-b border-[orange-600]/10"
                          >
                            <TableCell className="font-medium text-foreground">
                              {rate.weight}
                            </TableCell>
                            <TableCell className="font-semibold text-[orange-600]">
                              ₹{rate.express}
                            </TableCell>
                            <TableCell className="text-foreground/80">
                              1-2 days
                            </TableCell>
                            <TableCell className="text-foreground/80">
                              {rate.codCharge}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RateCard;
