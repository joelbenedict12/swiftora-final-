import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
    Plug,
    CheckCircle2,
    Zap,
    Loader2,
    RefreshCw,
    Unplug,
    ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { shopifyApi } from "@/lib/api";

const ShopifyLogo = () => (
    <svg viewBox="0 0 109.5 124.5" className="w-8 h-8" fill="none">
        <path
            d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.3-.8-10.3-.8s-6.8-6.8-7.5-7.5c-.7-.7-2.1-.5-2.6-.3 0 0-1.4.4-3.6 1.1-.4-1.2-1-2.6-1.8-4.1-2.7-5.1-6.6-7.8-11.4-7.8h-.5c-1.7-2-3.7-2.9-5.5-2.9-13.6.1-20.1 17-22.1 25.7-5.3 1.6-9 2.8-9.5 2.9-2.9.9-3 1-3.4 3.8-.3 2.1-8 61.4-8 61.4l60.2 11.3 32.6-7.1S95.7 28.7 95.6 28.2zm-28.3-6.2c-1.7.5-3.7 1.1-5.8 1.8 0-3-.4-7.3-1.8-10.8 4.4.8 6.6 5.8 7.6 9zm-9.9 3c-3.9 1.2-8.2 2.5-12.5 3.9 1.2-4.6 3.5-9.2 6.3-12.2.5-.5 1.2-1 2-1.3 2.7 5.5 2.1 9.4 1.8 11.7-.6-.2-1.1-.4-1.6-.5L57.4 25zm-5.3-17.1c1.3 0 2.4.4 3.4 1.3-2.7 1.3-5.5 4.6-7.5 11.2-3.4 1.1-6.8 2.1-9.9 3.1C40 15 45.2 7.9 52.1 7.9z"
            fill="#95bf47"
        />
        <path
            d="M94.5 27.2c-.5 0-10.3-.8-10.3-.8s-6.8-6.8-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.6 93.9 32.6-7.1S95.7 28.7 95.6 28.2c-.1-.6-.6-1-1.1-1z"
            fill="#5e8e3e"
        />
        <path
            d="M67.3 44.8l-4.9 14.5s-4.3-2.3-9.5-2.3c-7.7 0-8.1 4.8-8.1 6 0 6.6 17.2 9.1 17.2 24.5 0 12.1-7.7 19.9-18 19.9-12.4 0-18.8-7.7-18.8-7.7l3.3-11s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.6-14.1-9-14.1-23.1 0-11.9 8.5-23.4 25.7-23.4 6.6-.1 9.9 1.9 9.9 1.9z"
            fill="#fff"
        />
    </svg>
);

interface ShopifyStatus {
    connected: boolean;
    shopDomain?: string;
    autoFulfill?: boolean;
    lastSyncAt?: string;
    ordersSynced?: number;
    installedAt?: string;
}

const ChannelIntegration = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [status, setStatus] = useState<ShopifyStatus>({ connected: false });
    const [loading, setLoading] = useState(true);
    const [storeDomain, setStoreDomain] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const res = await shopifyApi.getStatus();
            setStatus(res.data);
        } catch {
            console.log("Shopify not connected");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Handle OAuth callback params
        const shopifyParam = searchParams.get("shopify");
        const errorParam = searchParams.get("error");
        if (shopifyParam === "connected") {
            toast.success("Shopify connected successfully! 🎉");
            fetchStatus();
            navigate("/dashboard/channel-integration", { replace: true });
        } else if (errorParam) {
            toast.error(`Shopify connection failed: ${errorParam}`);
            navigate("/dashboard/channel-integration", { replace: true });
        }
    }, []);

    const handleConnect = async () => {
        if (!storeDomain.trim()) {
            toast.error("Please enter your Shopify store domain");
            return;
        }
        try {
            setConnecting(true);
            const res = await shopifyApi.connect(storeDomain.trim());
            if (res.data?.authUrl) {
                window.location.href = res.data.authUrl;
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to connect Shopify");
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Disconnect Shopify? This will stop syncing orders.")) return;
        try {
            setDisconnecting(true);
            await shopifyApi.disconnect();
            setStatus({ connected: false });
            toast.success("Shopify disconnected");
        } catch {
            toast.error("Failed to disconnect");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await shopifyApi.syncOrders();
            toast.success(res.data?.message || "Sync complete");
            await fetchStatus();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleToggleAutoFulfill = async (checked: boolean) => {
        try {
            await shopifyApi.updateSettings({ autoFulfill: checked });
            setStatus((prev) => ({ ...prev, autoFulfill: checked }));
            toast.success(`Auto-fulfillment ${checked ? "enabled" : "disabled"}`);
        } catch {
            toast.error("Failed to update setting");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                    Channel Integration
                </h1>
                <p className="text-foreground/70 text-lg">
                    Connect your online store to automatically sync and ship orders
                </p>
            </div>

            <Card className="bg-white border border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <ShopifyLogo />
                        <div>
                            <CardTitle className="text-xl font-bold text-foreground">
                                Shopify
                            </CardTitle>
                            <CardDescription className="text-foreground/70">
                                Sync orders automatically from your Shopify store
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                            <span className="ml-3 text-foreground/70 text-lg">Loading connection status...</span>
                        </div>
                    ) : status.connected ? (
                        /* ── Connected State ── */
                        <div className="space-y-6">
                            {/* Status banner */}
                            <div className="flex items-start justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                                        <ShopifyLogo />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-green-800">
                                            Shopify Connected
                                        </h3>
                                        <p className="text-sm text-green-700 font-medium">
                                            {status.shopDomain}
                                        </p>
                                        {status.installedAt && (
                                            <p className="text-xs text-green-600 mt-0.5">
                                                Connected since{" "}
                                                {new Date(status.installedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge className="bg-green-100 text-green-700 border-green-300 text-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Active
                                </Badge>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                        <ShoppingBag className="w-3.5 h-3.5" /> Orders Synced
                                    </div>
                                    <div className="text-3xl font-bold text-foreground mt-2">
                                        {status.ordersSynced || 0}
                                    </div>
                                </div>
                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                                        <RefreshCw className="w-3.5 h-3.5" /> Last Sync
                                    </div>
                                    <div className="text-sm font-semibold text-foreground mt-3">
                                        {status.lastSyncAt
                                            ? new Date(status.lastSyncAt).toLocaleString()
                                            : "Never"}
                                    </div>
                                </div>
                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                                        Connection Status
                                    </div>
                                    <Badge className="mt-3 bg-green-100 text-green-700 border-green-200">
                                        🟢 Connected
                                    </Badge>
                                </div>
                            </div>

                            {/* Auto-fulfill toggle */}
                            <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white hover:border-amber-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            Auto-Fulfill Orders
                                        </div>
                                        <div className="text-sm text-foreground/60">
                                            Automatically create orders in Swiftora when Shopify sends
                                            them via webhook
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    checked={status.autoFulfill ?? true}
                                    onCheckedChange={handleToggleAutoFulfill}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-600/90 hover:to-blue-500/90 text-white shadow-lg px-6"
                                >
                                    {syncing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2" /> Sync Orders Now
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="border-red-200 text-red-600 hover:bg-red-50 px-6"
                                >
                                    {disconnecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                            Disconnecting...
                                        </>
                                    ) : (
                                        <>
                                            <Unplug className="w-4 h-4 mr-2" /> Disconnect
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* ── Not Connected State ── */
                        <div className="space-y-8">
                            <div className="text-center py-8">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                                    <ShopifyLogo />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">
                                    Connect Your Shopify Store
                                </h3>
                                <p className="text-foreground/60 mt-2 max-w-lg mx-auto text-base">
                                    Automatically sync orders from your Shopify store. We'll
                                    create shipments and push tracking numbers back to Shopify.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto space-y-5">
                                <div>
                                    <Label className="text-foreground font-medium text-sm">
                                        Shopify Store Domain *
                                    </Label>
                                    <Input
                                        value={storeDomain}
                                        onChange={(e) => setStoreDomain(e.target.value)}
                                        placeholder="mystore.myshopify.com"
                                        className="mt-1.5 bg-background/50 border-gray-200 h-12 text-base"
                                    />
                                    <p className="text-xs text-foreground/50 mt-1.5">
                                        Enter your .myshopify.com domain (not your custom domain)
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-600/90 hover:to-green-500/90 text-white shadow-lg text-lg h-14 font-semibold rounded-xl"
                                    onClick={handleConnect}
                                    disabled={connecting || !storeDomain.trim()}
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Plug className="w-5 h-5 mr-2" /> Connect Shopify
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl max-w-lg mx-auto">
                                <h4 className="font-semibold text-blue-900 mb-3">
                                    How it works:
                                </h4>
                                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                    <li>Enter your Shopify store domain above</li>
                                    <li>
                                        You'll be redirected to Shopify to authorize our app
                                    </li>
                                    <li>
                                        Once authorized, orders will automatically sync to Swiftora
                                    </li>
                                    <li>
                                        Ship orders from Swiftora — tracking is pushed back to
                                        Shopify
                                    </li>
                                </ol>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Future channels placeholder */}
            <Card className="bg-white border-2 border-dashed border-gray-200 shadow-sm">
                <CardContent className="py-8 text-center">
                    <p className="text-foreground/50 font-medium">
                        More channels coming soon — WooCommerce, Magento, API Integration
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChannelIntegration;
