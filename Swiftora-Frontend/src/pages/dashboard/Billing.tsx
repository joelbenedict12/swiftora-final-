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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  CreditCard,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const Billing = () => {
  const [rechargeAmount, setRechargeAmount] = useState("");

  const walletBalance = 45230.5;
  const pendingCOD = 125000;
  const totalCODCollected = 2450000;
  // const totalCODRemitted = 2325000;
  const pendingRemittance = 125000;

  const invoices = [
    {
      id: "INV-2025-001",
      date: "2025-01-15",
      amount: 45230.5,
      status: "Paid",
      type: "Shipping Charges",
      download: true,
    },
    {
      id: "INV-2025-002",
      date: "2025-01-10",
      amount: 38250.0,
      status: "Paid",
      type: "Shipping Charges",
      download: true,
    },
    {
      id: "INV-2025-003",
      date: "2025-01-05",
      amount: 41500.75,
      status: "Pending",
      type: "Shipping Charges",
      download: false,
    },
  ];

  // const codRemittances = [
  //   {
  //     id: "COD-2025-001",
  //     week: "Week 1 (Jan 1-7)",
  //     collected: 450000,
  //     remitted: 420000,
  //     pending: 30000,
  //     status: "Completed",
  //     date: "2025-01-10",
  //   },
  //   {
  //     id: "COD-2025-002",
  //     week: "Week 2 (Jan 8-14)",
  //     collected: 520000,
  //     remitted: 500000,
  //     pending: 20000,
  //     status: "Completed",
  //     date: "2025-01-17",
  //   },
  //   {
  //     id: "COD-2025-003",
  //     week: "Week 3 (Jan 15-21)",
  //     collected: 480000,
  //     remitted: 0,
  //     pending: 480000,
  //     status: "Pending",
  //     date: "2025-01-24",
  //   },
  // ];

  const transactions = [
    {
      id: "TXN-001",
      date: "2025-01-15",
      type: "Debit",
      amount: 1250.0,
      description: "Order ORD-12345 shipping charges",
      balance: 45230.5,
    },
    {
      id: "TXN-002",
      date: "2025-01-14",
      type: "Credit",
      amount: 10000.0,
      description: "Wallet recharge via UPI",
      balance: 46480.5,
    },
    {
      id: "TXN-003",
      date: "2025-01-13",
      type: "Debit",
      amount: 890.0,
      description: "Order ORD-12346 shipping charges",
      balance: 36480.5,
    },
  ];

  const weightDisputes = [
    {
      id: "WD-001",
      orderId: "ORD-12345",
      declaredWeight: "0.5 kg",
      chargedWeight: "0.8 kg",
      difference: "0.3 kg",
      amount: 150.0,
      status: "Under Review",
      date: "2025-01-15",
    },
    {
      id: "WD-002",
      orderId: "ORD-12340",
      declaredWeight: "1.0 kg",
      chargedWeight: "1.5 kg",
      difference: "0.5 kg",
      amount: 250.0,
      status: "Resolved",
      date: "2025-01-10",
    },
  ];

  const handleRecharge = () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    toast.success(`Recharge of ₹${rechargeAmount} initiated`);
    setRechargeAmount("");
  };

  const handleExportInvoices = () => {
    toast.success("Exporting all invoices...");
    // Simulate export
    setTimeout(() => {
      toast.success("Invoices exported successfully");
    }, 1500);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
    // Simulate download
    setTimeout(() => {
      toast.success("Invoice downloaded successfully");
    }, 1000);
  };

  const handleRaiseDispute = () => {
    toast.info("Raise weight dispute - Feature coming soon");
  };

  return (
    <div className="space-y-8  ">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Billing & Wallet
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your wallet, invoices, and COD remittances
        </p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary via-primary/90 to-[hsl(207,97%,45%)] text-white border-0 shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow">
          <CardHeader>
            <CardDescription className="text-white/80">
              Wallet Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              ₹{walletBalance.toLocaleString("en-IN")}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <TrendingUp className="w-4 h-4" />
              <span>Available for shipping</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Pending COD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              ₹{pendingCOD.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-gray-600">Awaiting remittance</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Total COD Collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ₹{totalCODCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-gray-600">This month</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          {/* <TabsTrigger value="cod">COD Remittance</TabsTrigger> */}
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="disputes">Weight Disputes</TabsTrigger>
        </TabsList>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recharge Wallet</CardTitle>
                <CardDescription>
                  Add funds to your wallet for seamless shipping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRechargeAmount("1000")}
                    className="w-full"
                  >
                    ₹1,000
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRechargeAmount("5000")}
                    className="w-full"
                  >
                    ₹5,000
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRechargeAmount("10000")}
                    className="w-full"
                  >
                    ₹10,000
                  </Button>
                </div>
                <Button
                  onClick={handleRecharge}
                  className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Recharge via UPI/Card
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Secure payment powered by Razorpay
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">UPI</div>
                      <div className="text-xs text-gray-500">
                        Instant payments
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-xs text-gray-500">
                        Cards ending in 4567
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Net Banking</div>
                      <div className="text-xs text-gray-500">
                        All major banks
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>
                    Download GST invoices for your shipping charges
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportInvoices}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.id}
                        </TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.type}</TableCell>
                        <TableCell className="font-semibold">
                          ₹
                          {invoice.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {invoice.status === "Paid" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.download && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COD Remittance Tab */}
        <TabsContent value="cod" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>COD Remittance</CardTitle>
                  <CardDescription>
                    Track COD collection and remittance
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Pending Remittance: </span>
                    <span className="font-bold text-orange-600">
                      ₹{pendingRemittance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Remitted</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remittance Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* {codRemittances.map((remittance) => (
                      <TableRow key={remittance.id}>
                        <TableCell className="font-medium">{remittance.week}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{remittance.collected.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ₹{remittance.remitted.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          ₹{remittance.pending.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          {remittance.status === "Completed" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{remittance.date}</TableCell>
                      </TableRow>
                    ))} */}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete history of wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.id}</TableCell>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell>
                          {txn.type === "Credit" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                              Credit
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <ArrowDownRight className="w-3 h-3 mr-1" />
                              Debit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {txn.description}
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${
                            txn.type === "Credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {txn.type === "Credit" ? "+" : "-"}₹
                          {txn.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹
                          {txn.balance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weight Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weight Discrepancy Disputes</CardTitle>
              <CardDescription>
                Raise and track weight discrepancy disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  onClick={handleRaiseDispute}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg w-full"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Raise New Dispute
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Declared Weight</TableHead>
                      <TableHead>Charged Weight</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weightDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium">
                          {dispute.id}
                        </TableCell>
                        <TableCell>
                          <a href="#" className="text-blue-600 hover:underline">
                            {dispute.orderId}
                          </a>
                        </TableCell>
                        <TableCell>{dispute.declaredWeight}</TableCell>
                        <TableCell>{dispute.chargedWeight}</TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {dispute.difference}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{dispute.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {dispute.status === "Resolved" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Under Review
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{dispute.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
