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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Truck,
  Phone,
  Mail,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { warehousesApi, pickupsApi, integrationsApi } from "@/lib/api";

type Warehouse = {
  id: string;
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  isDefault: boolean;
};

type Pickup = {
  id: string;
  warehouseId: string;
  warehouse?: { name: string };
  scheduledDate: string;
  scheduledTime?: string;
  courierName?: string;
  status: string;
  orderCount?: number;
};

const PickupPage = () => {
  const [pickupAddresses, setPickupAddresses] = useState<Warehouse[]>([]);
  const [scheduledPickups, setScheduledPickups] = useState<Pickup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSyncingFromDelhivery, setIsSyncingFromDelhivery] = useState(false);
  const [delhiveryConnected, setDelhiveryConnected] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newPickup, setNewPickup] = useState({
    name: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
    phone: "",
    email: "",
  });

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.list();
      setPickupAddresses(response.data || []);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
    }
  };

  const loadPickups = async () => {
    try {
      const response = await pickupsApi.list();
      setScheduledPickups(response.data?.pickups || []);
    } catch (error) {
      console.error("Failed to load pickups:", error);
    }
  };

  const checkDelhiveryStatus = async () => {
    try {
      const response = await integrationsApi.getDelhiveryStatus();
      setDelhiveryConnected(response.data?.connected || false);
    } catch (error) {
      console.error("Failed to check Delhivery status:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadWarehouses(), loadPickups(), checkDelhiveryStatus()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSyncFromDelhivery = async () => {
    if (!delhiveryConnected) {
      toast.error("Please connect your Delhivery account first in Settings > Integrations");
      return;
    }

    setIsSyncingFromDelhivery(true);
    try {
      const response = await warehousesApi.syncFromDelhivery();
      const data = response.data;

      if (data.success) {
        toast.success(data.message || `Synced ${data.synced} pickup locations from Delhivery`);
        if (data.created > 0) {
          toast.info(`Created ${data.created} new pickup locations`);
        }
        if (data.updated > 0) {
          toast.info(`Updated ${data.updated} existing pickup locations`);
        }
        // Reload warehouses to show the synced data
        await loadWarehouses();
      } else {
        toast.error(data.error || "Failed to sync from Delhivery");
      }
    } catch (error: any) {
      console.error("Delhivery sync error:", error);
      toast.error(error.response?.data?.error || "Failed to sync pickup locations from Delhivery");
    } finally {
      setIsSyncingFromDelhivery(false);
    }
  };


  const handleAddPickup = async () => {
    // Validate required fields
    if (!newPickup.name || !newPickup.address || !newPickup.pincode || !newPickup.city || !newPickup.state || !newPickup.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await warehousesApi.create({
        name: newPickup.name,
        address: newPickup.address,
        pincode: newPickup.pincode,
        city: newPickup.city,
        state: newPickup.state,
        phone: newPickup.phone,
        email: newPickup.email || undefined,
        syncToDelhivery: true, // Auto-sync to Delhivery
      });

      const data = response.data;

      if (data.delhiverySync?.success) {
        toast.success("Pickup address added and synced to Delhivery!");
      } else if (data.delhiverySync?.message) {
        toast.success("Pickup address added locally");
        toast.warning(`Delhivery sync: ${data.delhiverySync.message}`);
      } else {
        toast.success("Pickup address added successfully");
      }

      // Reset form and close dialog
      setNewPickup({
        name: "",
        address: "",
        pincode: "",
        city: "",
        state: "",
        phone: "",
        email: "",
      });
      setDialogOpen(false);

      // Reload warehouses
      loadWarehouses();
    } catch (error: any) {
      console.error("Failed to add pickup address:", error);
      toast.error(error.response?.data?.message || "Failed to add pickup address");
    }
  };

  const handleSchedulePickup = (addressId: string) => {
    toast.success("Pickup scheduled successfully");
  };

  const handleEditAddress = (warehouse: Warehouse) => {
    setEditingWarehouse({ ...warehouse, email: warehouse.email ?? "" });
  };

  const handleSaveEdit = async () => {
    if (!editingWarehouse) return;
    if (!editingWarehouse.name || !editingWarehouse.address || !editingWarehouse.pincode || !editingWarehouse.city || !editingWarehouse.state || !editingWarehouse.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSavingEdit(true);
    try {
      await warehousesApi.update(editingWarehouse.id, {
        name: editingWarehouse.name,
        address: editingWarehouse.address,
        pincode: editingWarehouse.pincode,
        city: editingWarehouse.city,
        state: editingWarehouse.state,
        phone: editingWarehouse.phone,
        email: editingWarehouse.email || undefined,
      });
      toast.success("Pickup location updated");
      setEditingWarehouse(null);
      loadWarehouses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await warehousesApi.update(addressId, { isDefault: true });
      toast.success("Set as default pickup location");
      loadWarehouses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to set default");
    }
  };

  const handleRemoveDefault = async (addressId: string) => {
    try {
      await warehousesApi.update(addressId, { isDefault: false });
      toast.success("Default removed. You can set another location as default.");
      loadWarehouses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove default");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setIsDeleting(addressId);
      await warehousesApi.delete(addressId);
      toast.success("Pickup location deleted");
      loadWarehouses();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReschedulePickup = (pickupId: string) => {
    toast.info(`Reschedule pickup ${pickupId} - Feature coming soon`);
  };

  const handleCancelPickup = (pickupId: string) => {
    toast.success(`Pickup ${pickupId} cancelled successfully`);
  };

  const handleViewPickupDetails = (pickupId: string) => {
    toast.info(`Viewing pickup ${pickupId} - Feature coming soon`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Pickup Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage pickup addresses and schedule pickups
          </p>
        </div>
        <div className="flex gap-3">
          {/* Sync from Delhivery Button */}
          <Button
            variant="outline"
            onClick={handleSyncFromDelhivery}
            disabled={isSyncingFromDelhivery}
            className={delhiveryConnected ? "border-green-300 hover:bg-green-50" : "border-gray-300"}
          >
            {isSyncingFromDelhivery ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isSyncingFromDelhivery ? "Syncing..." : "Sync from Delhivery"}
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg ">
                <Plus className="w-4 h-4 mr-2" />
                Add Pickup Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Pickup Address</DialogTitle>
                <DialogDescription>
                  Add a new pickup location for courier pickups
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Location Name
                  </label>
                  <Input
                    placeholder="e.g., Main Warehouse"
                    value={newPickup.name}
                    onChange={(e) =>
                      setNewPickup({ ...newPickup, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Address
                  </label>
                  <Input
                    placeholder="Street address"
                    value={newPickup.address}
                    onChange={(e) =>
                      setNewPickup({ ...newPickup, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pincode
                    </label>
                    <Input
                      placeholder="400001"
                      value={newPickup.pincode}
                      onChange={(e) =>
                        setNewPickup({ ...newPickup, pincode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Input
                      placeholder="Mumbai"
                      value={newPickup.city}
                      onChange={(e) =>
                        setNewPickup({ ...newPickup, city: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">State</label>
                  <Input
                    placeholder="Maharashtra"
                    value={newPickup.state}
                    onChange={(e) =>
                      setNewPickup({ ...newPickup, state: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Phone
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={newPickup.phone}
                      onChange={(e) =>
                        setNewPickup({ ...newPickup, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="warehouse@company.com"
                      value={newPickup.email}
                      onChange={(e) =>
                        setNewPickup({ ...newPickup, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAddPickup} className="w-full">
                  Add Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Pickup Address Dialog */}
          <Dialog open={!!editingWarehouse} onOpenChange={(open) => !open && setEditingWarehouse(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Pickup Address</DialogTitle>
                <DialogDescription>
                  Update this pickup location
                </DialogDescription>
              </DialogHeader>
              {editingWarehouse && (
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location Name</label>
                    <Input
                      placeholder="e.g., Main Warehouse"
                      value={editingWarehouse.name}
                      onChange={(e) =>
                        setEditingWarehouse({ ...editingWarehouse, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Address</label>
                    <Input
                      placeholder="Street address"
                      value={editingWarehouse.address}
                      onChange={(e) =>
                        setEditingWarehouse({ ...editingWarehouse, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Pincode</label>
                      <Input
                        placeholder="400001"
                        value={editingWarehouse.pincode}
                        onChange={(e) =>
                          setEditingWarehouse({ ...editingWarehouse, pincode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Input
                        placeholder="Mumbai"
                        value={editingWarehouse.city}
                        onChange={(e) =>
                          setEditingWarehouse({ ...editingWarehouse, city: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">State</label>
                    <Input
                      placeholder="Maharashtra"
                      value={editingWarehouse.state}
                      onChange={(e) =>
                        setEditingWarehouse({ ...editingWarehouse, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone</label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={editingWarehouse.phone}
                        onChange={(e) =>
                          setEditingWarehouse({ ...editingWarehouse, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        type="email"
                        placeholder="warehouse@company.com"
                        value={editingWarehouse.email || ""}
                        onChange={(e) =>
                          setEditingWarehouse({ ...editingWarehouse, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                      {isSavingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingWarehouse(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pickup Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Pickup Addresses</CardTitle>
          <CardDescription>Manage your pickup locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickupAddresses.map((address) => (
              <Card key={address.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{address.name}</CardTitle>
                    {address.isDefault && (
                      <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      <div>{address.address}</div>
                      <div className="text-gray-600">
                        {address.city}, {address.state} - {address.pincode}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {address.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {address.email}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSchedulePickup(address.id)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Pickup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      Edit
                    </Button>
                    {address.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveDefault(address.id)}
                      >
                        Remove default
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={isDeleting === address.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting === address.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Pickups */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Pickups</CardTitle>
          <CardDescription>Upcoming and past pickup schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledPickups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No scheduled pickups
                    </TableCell>
                  </TableRow>
                )}
                {scheduledPickups.map((pickup) => (
                  <TableRow key={pickup.id}>
                    <TableCell className="font-medium">{pickup.id.slice(-6)}</TableCell>
                    <TableCell>{pickup.warehouse?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleDateString() : '-'}</div>
                        <div className="text-gray-500">{pickup.scheduledTime || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pickup.courierName || 'Delhivery'}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {pickup.orderCount || '-'}
                    </TableCell>
                    <TableCell>
                      {pickup.status === "Completed" ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {pickup.status === "Scheduled" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReschedulePickup(pickup.id)}
                              title="Reschedule"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPickup(pickup.id)}
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPickupDetails(pickup.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupPage;
