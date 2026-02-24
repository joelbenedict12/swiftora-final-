import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "@/components/ui/dialog";
import {
  Wallet,
  CreditCard,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { billingApi } from "@/lib/api";

declare global {
  interface Window {
    Cashfree?: any;
  }
}

interface WalletData {
  balance: number;
  creditLimit: number;
  availableBalance: number;
  isPaused: boolean;
  companyName: string;
  customerType?: "CASH" | "CREDIT";
  outstanding?: number;
  unpaidInvoiceTotal?: number;
  currentMonthLedgerTotal?: number;
  availableCredit?: number;
}

interface MonthlyInvoice {
  id: string;
  invoiceNumber: string;
  month: string;
  totalShipping: number;
  platformFee: number;
  tax: number;
  totalPayable: number;
  isPaid: boolean;
  paidAt: string | null;
  dueDate: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  reference: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  order?: { orderNumber: string; courierName: string } | null;
}

const Billing = () => {
  const [searchParams] = useSearchParams();
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [qrAmount, setQrAmount] = useState("");
  const [qrUtr, setQrUtr] = useState("");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnPagination, setTxnPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [minRecharge, setMinRecharge] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecharging, setIsRecharging] = useState(false);
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [monthlyInvoices, setMonthlyInvoices] = useState<MonthlyInvoice[]>([]);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await billingApi.getInvoicesList();
      setMonthlyInvoices(res.data.invoices || []);
    } catch {
      // CREDIT-only; ignore for CASH
    }
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const res = await billingApi.getWallet();
      setWallet(res.data);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
  }, []);

  const loadTransactions = useCallback(async (page = 1) => {
    try {
      const res = await billingApi.getTransactions({ page, limit: 15 });
      setTransactions(res.data.transactions);
      setTxnPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  }, []);

  const loadQrInfo = useCallback(async () => {
    try {
      const res = await billingApi.getQrCode();
      setQrUrl(res.data.qrUrl);
      setMinRecharge(res.data.minRechargeAmount || 500);
    } catch (err) {
      console.error("Failed to load QR info:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadWallet(), loadTransactions(), loadQrInfo(), loadInvoices()]);
      setIsLoading(false);
    };
    init();
  }, [loadWallet, loadTransactions, loadQrInfo, loadInvoices]);

  // Handle return from Cashfree payment
  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const orderId = searchParams.get("order_id");
    if (paymentStatus === "success" && orderId) {
      billingApi.checkPaymentStatus(orderId).then((res) => {
        if (res.data.status === "PAID") {
          toast.success(`Wallet recharged with ₹${Number(res.data.amount).toLocaleString("en-IN")}`);
          loadWallet();
          loadTransactions();
        }
      }).catch(() => {});
    }
  }, [searchParams, loadWallet, loadTransactions]);

  const handleCashfreeRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < minRecharge) {
      toast.error(`Minimum recharge amount is ₹${minRecharge}`);
      return;
    }

    setIsRecharging(true);
    try {
      const res = await billingApi.recharge(amount);
      const { paymentSessionId, env } = res.data;

      if (!paymentSessionId) {
        toast.error("Failed to initiate payment");
        return;
      }

      const cashfreeMode = env === "production" ? "production" : "sandbox";

      if (!window.Cashfree) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const cashfree = window.Cashfree({ mode: cashfreeMode });
      const result = await cashfree.checkout({ paymentSessionId });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
      } else if (result.paymentDetails) {
        toast.success("Payment successful! Wallet will be updated shortly.");
        setTimeout(() => {
          loadWallet();
          loadTransactions();
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to initiate recharge");
    } finally {
      setIsRecharging(false);
      setRechargeAmount("");
    }
  };

  const handleQrPayment = async () => {
    const amount = parseFloat(qrAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < minRecharge) {
      toast.error(`Minimum amount is ₹${minRecharge}`);
      return;
    }
    if (!qrUtr.trim() || qrUtr.trim().length < 4) {
      toast.error("Please enter a valid UTR / transaction reference");
      return;
    }

    setIsSubmittingQr(true);
    try {
      await billingApi.submitQrPayment({ amount, utrReference: qrUtr.trim() });
      toast.success("Payment submitted! It will be credited once admin approves.");
      setQrAmount("");
      setQrUtr("");
      setQrDialogOpen(false);
      loadTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit payment");
    } finally {
      setIsSubmittingQr(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    try {
      const res = await billingApi.payInvoice(invoiceId);
      const { paymentSessionId, env } = res.data;
      if (!paymentSessionId) {
        toast.error("Failed to initiate payment");
        return;
      }
      const cashfreeMode = env === "production" ? "production" : "sandbox";
      if (!window.Cashfree) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const cashfree = window.Cashfree({ mode: cashfreeMode });
      const result = await cashfree.checkout({ paymentSessionId });
      if (result.error) {
        toast.error(result.error.message || "Payment failed");
      } else if (result.paymentDetails) {
        toast.success("Payment successful! Invoice will be marked as paid shortly.");
        setTimeout(() => { loadWallet(); loadInvoices(); }, 2000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to initiate payment");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await billingApi.downloadInvoice(invoiceId);
      if (res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      }
    } catch {
      toast.error("Invoice PDF not available yet");
    }
  };

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const txnTypeLabel = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      RECHARGE: { label: "Recharge", color: "bg-green-100 text-green-800 border-green-200", icon: ArrowUpRight },
      QR_CREDIT: { label: "QR Credit", color: "bg-green-100 text-green-800 border-green-200", icon: ArrowUpRight },
      REFUND: { label: "Refund", color: "bg-blue-100 text-blue-800 border-blue-200", icon: ArrowUpRight },
      COD_REMITTANCE: { label: "COD", color: "bg-green-100 text-green-800 border-green-200", icon: ArrowUpRight },
      DEBIT: { label: "Debit", color: "bg-red-100 text-red-800 border-red-200", icon: ArrowDownRight },
      ADJUSTMENT: { label: "Adjustment", color: "bg-gray-100 text-gray-800 border-gray-200", icon: ArrowUpRight },
    };
    return map[type] || { label: type, color: "bg-gray-100 text-gray-800", icon: ArrowUpRight };
  };

  const isCredit = (type: string) => type !== "DEBIT";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Billing & Wallet
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your wallet, recharge, and transactions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadWallet(); loadTransactions(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {wallet?.isPaused && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Account Paused</p>
            <p className="text-sm text-red-600">Your account is paused. You cannot ship orders. Please contact support.</p>
          </div>
        </div>
      )}

      {wallet?.customerType === "CREDIT" ? (
        <>
          {/* CREDIT CUSTOMER VIEW */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">Monthly Billing Enabled</p>
              <p className="text-sm text-blue-600">
                Your shipments are billed monthly. Pay invoices before the due date to keep shipping active.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white border-0 shadow-xl shadow-blue-500/20">
              <CardHeader>
                <CardDescription className="text-white/80">Credit Limit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{formatCurrency(wallet?.creditLimit || 0)}</div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp className="w-4 h-4" />
                  <span>Monthly spending cap</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Outstanding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatCurrency(wallet?.outstanding || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Invoices: {formatCurrency(wallet?.unpaidInvoiceTotal || 0)} +
                  This month: {formatCurrency(wallet?.currentMonthLedgerTotal || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Available Credit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(wallet?.availableCredit || 0)}
                </div>
                <div className="text-sm text-gray-600">Remaining this month</div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Monthly Invoices
              </CardTitle>
              <CardDescription>Your billing history and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p>No invoices yet</p>
                  <p className="text-sm">Invoices are generated at the start of each month</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Shipping</TableHead>
                        <TableHead className="text-right">Platform Fee</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium text-sm">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-sm">{inv.month}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(inv.totalShipping)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(inv.platformFee)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(inv.tax)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(inv.totalPayable)}</TableCell>
                          <TableCell>
                            {inv.isPaid ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <Clock className="w-3 h-3 mr-1" /> Unpaid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {inv.pdfUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(inv.id)}
                                >
                                  <Download className="w-3 h-3 mr-1" /> PDF
                                </Button>
                              )}
                              {!inv.isPaid && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayInvoice(inv.id)}
                                  disabled={payingInvoiceId === inv.id}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                >
                                  {payingInvoiceId === inv.id ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-3 h-3 mr-1" />
                                  )}
                                  Pay
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* CASH CUSTOMER VIEW (existing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary via-primary/90 to-[hsl(207,97%,45%)] text-white border-0 shadow-xl shadow-primary/20">
              <CardHeader>
                <CardDescription className="text-white/80">Wallet Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{formatCurrency(wallet?.balance || 0)}</div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp className="w-4 h-4" />
                  <span>Available for shipping</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Credit Limit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(wallet?.creditLimit || 0)}</div>
                <div className="text-sm text-gray-600">Extra spending allowance</div>
              </CardContent>
            </Card>

            <Card className="border-gray-200/80 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Total Available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(wallet?.availableBalance || 0)}</div>
                <div className="text-sm text-gray-600">Balance + credit limit</div>
              </CardContent>
            </Card>
          </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList>
          <TabsTrigger value="wallet">
            <Wallet className="w-4 h-4 mr-2" />
            Recharge
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="w-4 h-4 mr-2" />
            Pay via QR
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Wallet Recharge Tab */}
        <TabsContent value="wallet" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recharge Wallet</CardTitle>
                <CardDescription>
                  Add funds via UPI, Card, or Net Banking (min ₹{minRecharge})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder={`Min ₹${minRecharge}`}
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="text-lg"
                    min={minRecharge}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      onClick={() => setRechargeAmount(String(amt))}
                      className="w-full"
                    >
                      ₹{amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleCashfreeRecharge}
                  disabled={isRecharging}
                  className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  {isRecharging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isRecharging ? "Processing..." : "Pay via UPI / Card / Net Banking"}
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Secure payment powered by Cashfree
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">UPI</div>
                      <div className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Credit / Debit Card</div>
                      <div className="text-xs text-gray-500">Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Net Banking</div>
                      <div className="text-xs text-gray-500">All major banks</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QR Payment Tab */}
        <TabsContent value="qr" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pay via QR Code</CardTitle>
                <CardDescription>
                  Scan the QR code to pay via any UPI app, then submit the UTR reference
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {qrUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                    <img src={qrUrl} alt="Payment QR Code" className="w-64 h-64 object-contain" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                    <QrCode className="w-16 h-16 mx-auto mb-2" />
                    <p>QR code not configured yet</p>
                    <p className="text-xs">Admin needs to upload the payment QR</p>
                  </div>
                )}
                <Button
                  onClick={() => setQrDialogOpen(true)}
                  disabled={!qrUrl}
                  className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] text-white"
                >
                  I've Made the Payment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium">Scan QR Code</p>
                    <p className="text-sm text-gray-500">Open any UPI app and scan the QR code above</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium">Pay the amount</p>
                    <p className="text-sm text-gray-500">Enter the recharge amount (min ₹{minRecharge}) and complete the payment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium">Submit UTR reference</p>
                    <p className="text-sm text-gray-500">Click "I've Made the Payment" and enter the UTR/transaction ID from your UPI app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium">Admin approval</p>
                    <p className="text-sm text-gray-500">Once admin verifies, the amount will be credited to your wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete history of wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance After</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn) => {
                          const typeInfo = txnTypeLabel(txn.type);
                          const Icon = typeInfo.icon;
                          return (
                            <TableRow key={txn.id}>
                              <TableCell className="text-sm">{formatDate(txn.createdAt)}</TableCell>
                              <TableCell>
                                <Badge className={typeInfo.color}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm max-w-xs truncate">
                                {txn.description || (txn.order ? `Order ${txn.order.orderNumber}` : "-")}
                              </TableCell>
                              <TableCell>
                                {txn.status === "COMPLETED" ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />Done
                                  </Badge>
                                ) : txn.status === "PENDING" ? (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    <Clock className="w-3 h-3 mr-1" />Pending
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{txn.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${isCredit(txn.type) ? "text-green-600" : "text-red-600"}`}>
                                {isCredit(txn.type) ? "+" : "-"}{formatCurrency(Number(txn.amount))}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(Number(txn.balanceAfter))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {txnPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500">
                        Page {txnPagination.page} of {txnPagination.totalPages} ({txnPagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txnPagination.page <= 1}
                          onClick={() => loadTransactions(txnPagination.page - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txnPagination.page >= txnPagination.totalPages}
                          onClick={() => loadTransactions(txnPagination.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* QR Payment Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Payment Details</DialogTitle>
            <DialogDescription>
              Enter the amount you paid and the UTR/transaction reference from your UPI app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Amount Paid (₹)</label>
              <Input
                type="number"
                placeholder={`Min ₹${minRecharge}`}
                value={qrAmount}
                onChange={(e) => setQrAmount(e.target.value)}
                min={minRecharge}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">UTR / Transaction Reference</label>
              <Input
                type="text"
                placeholder="e.g. 412345678901"
                value={qrUtr}
                onChange={(e) => setQrUtr(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Find the UTR number in your UPI app's transaction details
              </p>
            </div>
            <Button
              onClick={handleQrPayment}
              disabled={isSubmittingQr}
              className="w-full"
            >
              {isSubmittingQr ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isSubmittingQr ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
