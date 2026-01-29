import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Users,
  Truck,
  Plug,
  Bell,
  Zap,
  Shield,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Smartphone,
  Globe,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api";

const Settings = () => {
  const [showDelhiveryModal, setShowDelhiveryModal] = useState(false);
  const [delhiveryApiKey, setDelhiveryApiKey] = useState("");
  const [delhiveryStatus, setDelhiveryStatus] = useState<{
    connected: boolean;
    lastSync?: string;
    clientId?: string;
  }>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: "Swiftora Logistics",
    gstin: "27ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    address: "123 Logistics Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "+91 98765 43210",
    email: "info@swiftora.com",
    website: "www.swiftora.com",
    timezone: "Asia/Kolkata",
    currency: "INR",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    whatsapp: false,
    orderStatus: true,
    ndrAlerts: true,
    rtoAlerts: true,
    deliveryUpdates: true,
    paymentAlerts: true,
    lowBalanceAlerts: true,
    emailAddress: "notifications@swiftora.com",
    phoneNumber: "+91 98765 43210",
    whatsappNumber: "+91 98765 43210",
  });

  const [automation, setAutomation] = useState({
    autoCourierSelection: true,
    autoLabelGeneration: true,
    autoManifestCreation: false,
    autoNDRFollowup: false,
    autoOrderConfirmation: true,
    autoTagging: false,
    manifestSchedule: "daily",
    manifestTime: "18:00",
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    ipWhitelist: false,
    passwordExpiry: "90",
    showPassword: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleEditUser = (userId: string) => {
    toast.info(`Edit user ${userId} - Feature coming soon`);
  };

  const handleConfigureCourier = (courierName: string) => {
    toast.info(`Configure ${courierName} - Feature coming soon`);
  };

  const handleCopyAPIKey = () => {
    const apiKey = "sk_live_abc123...";
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const handleRegenerateAPIKey = () => {
    toast.success("API key regenerated successfully");
  };

  const handleAddUser = () => {
    toast.info("Add user - Feature coming soon");
  };

  const handleConnectChannel = (channelName: string) => {
    toast.info(`Connect ${channelName} - Feature coming soon`);
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved successfully");
  };

  const handleSaveAutomation = () => {
    toast.success("Automation settings saved successfully");
  };

  const handleSaveSecurity = () => {
    toast.success("Security settings saved successfully");
  };

  const handleChangePassword = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    toast.success("Password changed successfully");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleEnable2FA = () => {
    toast.info("Two-factor authentication setup - Feature coming soon");
  };

  // Fetch Delhivery connection status
  useEffect(() => {
    const fetchDelhiveryStatus = async () => {
      try {
        setIsLoadingStatus(true);
        const response = await integrationsApi.getDelhiveryStatus();
        setDelhiveryStatus(response.data);
      } catch (error) {
        console.log('Not connected to Delhivery yet');
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchDelhiveryStatus();
  }, []);

  // Connect Delhivery
  const handleConnectDelhivery = async () => {
    if (!delhiveryApiKey.trim()) {
      toast.error("Please enter your Delhivery API key");
      return;
    }
    try {
      setIsConnecting(true);
      await integrationsApi.connectDelhivery({ apiKey: delhiveryApiKey });
      toast.success("Delhivery connected! Next: Create your pickup location to start shipping.", {
        duration: 6000,
        action: {
          label: "Create Now",
          onClick: () => {
            // Navigate to pickup locations section
            document.getElementById('pickup-locations-section')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
      });
      setDelhiveryStatus({ connected: true });
      setShowDelhiveryModal(false);
      setDelhiveryApiKey("");
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to connect Delhivery";
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Delhivery
  const handleDisconnectDelhivery = async () => {
    try {
      await integrationsApi.disconnectDelhivery();
      setDelhiveryStatus({ connected: false });
      toast.success("Delhivery disconnected");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  // Test Delhivery Connection
  const handleTestDelhivery = async () => {
    try {
      const response = await integrationsApi.testDelhivery();
      const result = response.data;

      if (result.connected && result.apiKeyValid) {
        toast.success("Delhivery API is working! ✅");
        console.log("Delhivery test response:", result);
      } else {
        toast.error(`Delhivery Error: ${result.error || result.message}`);
        console.log("Delhivery test failed:", result);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to test connection";
      toast.error(message);
      console.error("Delhivery test error:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Delhivery Connection Modal */}
      <Dialog open={showDelhiveryModal} onOpenChange={setShowDelhiveryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Connect Your Delhivery Account
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Enter your Delhivery API key to start creating shipments automatically
            </DialogDescription>
          </DialogHeader>

          {/* Steps */}
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">How to get your API key:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Log in to your Delhivery account at <a href="https://www.delhivery.com" target="_blank" className="underline">delhivery.com</a></li>
                <li>Go to API Settings or Developer section</li>
                <li>Copy your API Token/Key</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delhivery-api-key" className="text-foreground font-medium">
                Delhivery API Key *
              </Label>
              <Input
                id="delhivery-api-key"
                type="password"
                value={delhiveryApiKey}
                onChange={(e) => setDelhiveryApiKey(e.target.value)}
                placeholder="Enter your Delhivery API token"
                className="bg-background/50 border-gray-200"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-600/90 hover:to-blue-500/90 text-white text-lg py-6 rounded-lg font-semibold shadow-lg"
              onClick={handleConnectDelhivery}
              disabled={isConnecting || !delhiveryApiKey.trim()}
            >
              {isConnecting ? "Connecting..." : "Connect Delhivery"}
            </Button>
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
              onClick={() => {
                setShowDelhiveryModal(false);
                setDelhiveryApiKey("");
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-foreground/70 text-lg">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 bg-[blue-600]/10 border-gray-200">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="courier"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Courier
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="automation"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Automation
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="tax"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Tax
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Bank
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-[blue-600]/20 data-[state=active]:text-foreground"
          >
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Company Information
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Update your company details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Building2 className="w-5 h-5 text-[blue-600]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Company Name *</Label>
                    <Input
                      value={companyInfo.name}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, name: e.target.value })
                      }
                      placeholder="Enter company name"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Website</Label>
                    <Input
                      value={companyInfo.website}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          website: e.target.value,
                        })
                      }
                      placeholder="www.example.com"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">GSTIN *</Label>
                    <Input
                      value={companyInfo.gstin}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          gstin: e.target.value,
                        })
                      }
                      placeholder="27ABCDE1234F1Z5"
                      maxLength={15}
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">PAN *</Label>
                    <Input
                      value={companyInfo.pan}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, pan: e.target.value })
                      }
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <MapPin className="w-5 h-5 text-[blue-600]" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-foreground">Address *</Label>
                    <Textarea
                      value={companyInfo.address}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          address: e.target.value,
                        })
                      }
                      placeholder="Street address, building, apartment"
                      rows={2}
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">City *</Label>
                    <Input
                      value={companyInfo.city}
                      onChange={(e) =>
                        setCompanyInfo({ ...companyInfo, city: e.target.value })
                      }
                      placeholder="Mumbai"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">State *</Label>
                    <Input
                      value={companyInfo.state}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          state: e.target.value,
                        })
                      }
                      placeholder="Maharashtra"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Pincode *</Label>
                    <Input
                      value={companyInfo.pincode}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          pincode: e.target.value,
                        })
                      }
                      placeholder="400001"
                      maxLength={6}
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Phone className="w-5 h-5 text-[blue-600]" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Email *</Label>
                    <Input
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          email: e.target.value,
                        })
                      }
                      placeholder="info@company.com"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Phone *</Label>
                    <Input
                      value={companyInfo.phone}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 98765 43210"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Globe className="w-5 h-5 text-[blue-600]" />
                  Regional Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Timezone</Label>
                    <Select
                      value={companyInfo.timezone}
                      onValueChange={(value) =>
                        setCompanyInfo({ ...companyInfo, timezone: value })
                      }
                    >
                      <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-gray-200">
                        <SelectItem value="Asia/Kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                        <SelectItem value="Asia/Dubai">
                          Asia/Dubai (GST)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Currency</Label>
                    <Select
                      value={companyInfo.currency}
                      onValueChange={(value) =>
                        setCompanyInfo({ ...companyInfo, currency: value })
                      }
                    >
                      <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-gray-200">
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg "
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Roles */}
        <TabsContent value="users" className="mt-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">
                    Users & Roles
                  </CardTitle>
                  <CardDescription className="text-foreground/70">
                    Manage team members and permissions
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddUser}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md  bg-white border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[blue-600]/10 to-[blue-600]/5 border-b border-gray-200">
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Email</TableHead>
                      <TableHead className="text-foreground">Role</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">
                        Last Active
                      </TableHead>
                      <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-blue-50 border-b border-gray-200">
                      <TableCell className="font-medium text-foreground">
                        John Doe
                      </TableCell>
                      <TableCell className="text-foreground/80">
                        john@company.com
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                          Admin
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/70">
                        2 hours ago
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[blue-600]/10"
                          onClick={() => handleEditUser("user1")}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-blue-50 border-b border-gray-200">
                      <TableCell className="font-medium text-foreground">
                        Jane Smith
                      </TableCell>
                      <TableCell className="text-foreground/80">
                        jane@company.com
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[orange-600]/20 text-[orange-600] border-orange-200">
                          Operations
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/70">
                        1 day ago
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[blue-600]/10"
                          onClick={() => handleEditUser("user1")}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courier Management */}
        <TabsContent value="courier" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-foreground">
                Courier Partners
              </CardTitle>
              <CardDescription className="text-foreground/70">
                Manage courier integrations and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Delhivery", "BlueDart", "DTDC"].map((courier) => (
                  <div
                    key={courier}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors bg-white "
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-[blue-600]" />
                      <div>
                        <div className="font-medium text-foreground">
                          {courier}
                        </div>
                        <div className="text-sm text-foreground/60">Active</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:bg-[blue-600]/10"
                        onClick={() => handleConfigureCourier(courier)}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-foreground">Courier Rules</CardTitle>
              <CardDescription className="text-foreground/70">
                Set rules for automatic courier selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-medium text-foreground">
                      Weight-based Rule
                    </div>
                    <div className="text-sm text-foreground/60">
                      Orders &lt; 1kg: Delhivery, Orders &gt; 1kg: BlueDart
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-medium text-foreground">
                      Pincode-based Rule
                    </div>
                    <div className="text-sm text-foreground/60">
                      Metro cities: Delhivery, Others: DTDC
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Notification Channels
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Enable or disable notification channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[blue-600]" />
                    <div>
                      <div className="font-semibold text-foreground">
                        Email Notifications
                      </div>
                      <div className="text-sm text-foreground/60">
                        Receive updates via email
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[blue-600]" />
                    <div>
                      <div className="font-semibold text-foreground">
                        SMS Notifications
                      </div>
                      <div className="text-sm text-foreground/60">
                        Receive updates via SMS
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[blue-600]" />
                    <div>
                      <div className="font-semibold text-foreground">
                        WhatsApp Notifications
                      </div>
                      <div className="text-sm text-foreground/60">
                        Receive updates via WhatsApp
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.whatsapp}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, whatsapp: checked })
                    }
                  />
                </div>
              </div>

              {notifications.email && (
                <div className="p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                  <Label className="text-sm font-semibold mb-2 block text-foreground">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={notifications.emailAddress}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailAddress: e.target.value,
                      })
                    }
                    placeholder="notifications@company.com"
                    className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                  />
                </div>
              )}

              {notifications.sms && (
                <div className="p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                  <Label className="text-sm font-semibold mb-2 block text-foreground">
                    Phone Number
                  </Label>
                  <Input
                    value={notifications.phoneNumber}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        phoneNumber: e.target.value,
                      })
                    }
                    placeholder="+91 98765 43210"
                    className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                  />
                </div>
              )}

              {notifications.whatsapp && (
                <div className="p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                  <Label className="text-sm font-semibold mb-2 block text-foreground">
                    WhatsApp Number
                  </Label>
                  <Input
                    value={notifications.whatsappNumber}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        whatsappNumber: e.target.value,
                      })
                    }
                    placeholder="+91 98765 43210"
                    className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Notification Types
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Choose what events you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      Order Status Updates
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified when order status changes
                    </div>
                  </div>
                  <Switch
                    checked={notifications.orderStatus}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        orderStatus: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      NDR Alerts
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified on non-delivery reports
                    </div>
                  </div>
                  <Switch
                    checked={notifications.ndrAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, ndrAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      RTO Alerts
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified on return to origin events
                    </div>
                  </div>
                  <Switch
                    checked={notifications.rtoAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, rtoAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      Delivery Updates
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified on delivery milestones
                    </div>
                  </div>
                  <Switch
                    checked={notifications.deliveryUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        deliveryUpdates: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      Payment Alerts
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified on payment transactions
                    </div>
                  </div>
                  <Switch
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        paymentAlerts: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                  <div>
                    <div className="font-semibold text-foreground">
                      Low Balance Alerts
                    </div>
                    <div className="text-sm text-foreground/60">
                      Get notified when wallet balance is low
                    </div>
                  </div>
                  <Switch
                    checked={notifications.lowBalanceAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        lowBalanceAlerts: checked,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSaveNotifications}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Automation Rules
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Set up automated workflows to streamline operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-[orange-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto Courier Selection
                    </div>
                    <div className="text-sm text-foreground/60">
                      Automatically assign courier based on weight, pincode, and
                      other rules
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoCourierSelection}
                  onCheckedChange={(checked) =>
                    setAutomation({
                      ...automation,
                      autoCourierSelection: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto Label Generation
                    </div>
                    <div className="text-sm text-foreground/60">
                      Generate shipping labels automatically when order is
                      created
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoLabelGeneration}
                  onCheckedChange={(checked) =>
                    setAutomation({
                      ...automation,
                      autoLabelGeneration: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto Manifest Creation
                    </div>
                    <div className="text-sm text-foreground/60">
                      Create manifests automatically at scheduled times
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoManifestCreation}
                  onCheckedChange={(checked) =>
                    setAutomation({
                      ...automation,
                      autoManifestCreation: checked,
                    })
                  }
                />
              </div>
              {automation.autoManifestCreation && (
                <div className="ml-8 p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-foreground">
                        Schedule
                      </Label>
                      <Select
                        value={automation.manifestSchedule}
                        onValueChange={(value) =>
                          setAutomation({
                            ...automation,
                            manifestSchedule: value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-background/50 border-gray-200 text-foreground mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-gray-200">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="twice-daily">
                            Twice Daily
                          </SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">
                        Time
                      </Label>
                      <Input
                        type="time"
                        value={automation.manifestTime}
                        onChange={(e) =>
                          setAutomation({
                            ...automation,
                            manifestTime: e.target.value,
                          })
                        }
                        className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto NDR Follow-up
                    </div>
                    <div className="text-sm text-foreground/60">
                      Automatically send follow-up messages for NDR cases
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoNDRFollowup}
                  onCheckedChange={(checked) =>
                    setAutomation({ ...automation, autoNDRFollowup: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto Order Confirmation
                    </div>
                    <div className="text-sm text-foreground/60">
                      Automatically confirm orders when received from channels
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoOrderConfirmation}
                  onCheckedChange={(checked) =>
                    setAutomation({
                      ...automation,
                      autoOrderConfirmation: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <Filter className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Auto Tagging
                    </div>
                    <div className="text-sm text-foreground/60">
                      Automatically tag orders based on rules (COD, Express,
                      etc.)
                    </div>
                  </div>
                </div>
                <Switch
                  checked={automation.autoTagging}
                  onCheckedChange={(checked) =>
                    setAutomation({ ...automation, autoTagging: checked })
                  }
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSaveAutomation}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Automation Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                KYC Verification
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Complete your KYC for account verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[blue-600]" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Business Documents
                    </div>
                    <div className="text-sm text-foreground/60">
                      GST Certificate, PAN Card, Business License
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[blue-600]/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[blue-600]" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Bank Account
                    </div>
                    <div className="text-sm text-foreground/60">
                      For COD remittance and payments
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[blue-600]/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[blue-600]" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Identity Verification
                    </div>
                    <div className="text-sm text-foreground/60">
                      Aadhaar, Passport, or Driving License
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[orange-600]/20 text-[orange-600] border-orange-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:bg-[blue-600]/10"
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Security Settings
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      Two-Factor Authentication (2FA)
                    </div>
                    <div className="text-sm text-foreground/60">
                      Add an extra layer of security to your account using
                      authenticator apps
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, twoFactorAuth: checked })
                    }
                  />
                  {security.twoFactorAuth && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-200 hover:bg-[blue-600]/10"
                      onClick={handleEnable2FA}
                    >
                      Setup 2FA
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4  rounded-xl space-y-4 bg-white border border-gray-200">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Session Timeout
                  </Label>
                  <Select
                    value={security.sessionTimeout}
                    onValueChange={(value) =>
                      setSecurity({ ...security, sessionTimeout: value })
                    }
                  >
                    <SelectTrigger className="mt-2 bg-background/50 border-gray-200 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-gray-200">
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-foreground/60 mt-1">
                    Automatically log out after inactivity
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors bg-white ">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[blue-600] mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      IP Whitelist
                    </div>
                    <div className="text-sm text-foreground/60">
                      Restrict access to specific IP addresses
                    </div>
                  </div>
                </div>
                <Switch
                  checked={security.ipWhitelist}
                  onCheckedChange={(checked) =>
                    setSecurity({ ...security, ipWhitelist: checked })
                  }
                />
              </div>

              <div className="p-4 rounded-xl space-y-4 bg-white border border-gray-200">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Password Expiry
                  </Label>
                  <Select
                    value={security.passwordExpiry}
                    onValueChange={(value) =>
                      setSecurity({ ...security, passwordExpiry: value })
                    }
                  >
                    <SelectTrigger className="mt-2 bg-background/50 border-gray-200 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-gray-200">
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-foreground/60 mt-1">
                    Force password change after specified days
                  </p>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-[blue-600]/10"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background/95 border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      Change Password
                    </DialogTitle>
                    <DialogDescription className="text-foreground/70">
                      Enter your current password and choose a new one
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-foreground">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={security.showPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full hover:bg-[blue-600]/10"
                          onClick={() =>
                            setSecurity({
                              ...security,
                              showPassword: !security.showPassword,
                            })
                          }
                        >
                          {security.showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground">New Password</Label>
                      <Input
                        type={security.showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Enter new password (min 8 characters)"
                        className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">
                        Confirm New Password
                      </Label>
                      <Input
                        type={security.showPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                        className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Password must be at least 8 characters with uppercase,
                        lowercase, and numbers
                      </span>
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSaveSecurity}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Active Sessions
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200">
                  <div>
                    <div className="font-semibold text-foreground">
                      Current Session
                    </div>
                    <div className="text-sm text-foreground/60">
                      Chrome on macOS • IP: 192.168.1.1
                    </div>
                    <div className="text-xs text-foreground/50 mt-1">
                      Last active: Just now
                    </div>
                  </div>
                  <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4  rounded-xl opacity-60 bg-white border border-gray-200">
                  <div>
                    <div className="font-semibold text-foreground">
                      Mobile App
                    </div>
                    <div className="text-sm text-foreground/60">
                      iOS App • IP: 192.168.1.2
                    </div>
                    <div className="text-xs text-foreground/50 mt-1">
                      Last active: 2 hours ago
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[blue-600]/10"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Configurations */}
        <TabsContent value="tax" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Tax Configuration
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Manage GST and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  GST Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">GSTIN</Label>
                    <Input
                      value={companyInfo.gstin}
                      readOnly
                      className="bg-background/50 border-gray-200 text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">
                      GST Registration Type
                    </Label>
                    <Select defaultValue="regular">
                      <SelectTrigger className="bg-background/50 border-gray-200 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-gray-200">
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="composition">
                          Composition Scheme
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">GST Rate (%)</Label>
                    <Input
                      type="number"
                      defaultValue="18"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">HSN/SAC Code</Label>
                    <Input
                      placeholder="996511"
                      className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Tax Exemptions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4  rounded-xl hover:bg-blue-50 transition-colors bg-white border border-gray-200">
                    <div>
                      <div className="font-semibold text-foreground">
                        Export Orders
                      </div>
                      <div className="text-sm text-foreground/60">
                        Zero-rated GST for export shipments
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 transition-colors bg-white border border-gray-200">
                    <div>
                      <div className="font-semibold text-foreground">
                        B2B Transactions
                      </div>
                      <div className="text-sm text-foreground/60">
                        Apply reverse charge mechanism
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Tax Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details */}
        <TabsContent value="bank" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Bank Accounts
                  </CardTitle>
                  <CardDescription className="mt-1 text-foreground/70">
                    Manage bank accounts for COD remittance
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Card className="border-2 border-gray-200 bg-white ">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-[blue-600]" />
                          <h3 className="text-lg font-bold text-foreground">
                            HDFC Bank
                          </h3>
                          <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                            Primary
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-foreground/70">
                          <div>Account Number: ****1234</div>
                          <div>IFSC: HDFC0001234</div>
                          <div>Account Holder: Swiftora Logistics</div>
                          <div>Branch: Mumbai Main Branch</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:bg-[blue-600]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-200 hover:bg-[orange-600]/10"
                        >
                          <Trash2 className="w-4 h-4 text-[orange-600]" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-[blue-600]" />
                          <h3 className="text-lg font-bold text-foreground">
                            ICICI Bank
                          </h3>
                        </div>
                        <div className="space-y-1 text-sm text-foreground/70">
                          <div>Account Number: ****5678</div>
                          <div>IFSC: ICIC0005678</div>
                          <div>Account Holder: Swiftora Logistics</div>
                          <div>Branch: Delhi Branch</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:bg-[blue-600]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:bg-[blue-600]/10"
                        >
                          Set as Primary
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Templates */}
        <TabsContent value="invoices" className="mt-6 space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-foreground">
                Invoice Templates
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Customize your invoice templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[blue-600]" />
                        <div>
                          <h3 className="font-bold text-foreground">
                            Standard Template
                          </h3>
                          <p className="text-sm text-foreground/60">
                            Default invoice template
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
                        Active
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer bg-white ">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[blue-600]" />
                        <div>
                          <h3 className="font-bold text-foreground">
                            Minimal Template
                          </h3>
                          <p className="text-sm text-foreground/60">
                            Simple and clean design
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className=" hover:border-blue-300 transition-colors cursor-pointer bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[blue-600]" />
                        <div>
                          <h3 className="font-bold text-foreground">
                            Detailed Template
                          </h3>
                          <p className="text-sm text-foreground/60">
                            Comprehensive invoice format
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-[blue-600]/10"
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors cursor-pointer bg-white">
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
                    <Plus className="w-8 h-8 text-[blue-600]/40 mb-2" />
                    <p className="text-sm font-semibold text-foreground/70">
                      Create New Template
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-[blue-600]/10 border border-gray-200 rounded-xl">
                <h4 className="font-semibold mb-2 text-foreground">
                  Template Customization Options:
                </h4>
                <ul className="text-sm text-foreground/80 space-y-1 list-disc list-inside">
                  <li>Company logo and branding</li>
                  <li>Invoice number format</li>
                  <li>Tax details and calculations</li>
                  <li>Payment terms and conditions</li>
                  <li>Footer information</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
