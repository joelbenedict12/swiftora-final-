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
import { Textarea } from "@/components/ui/textarea";
import { Ban, Plus, Edit, Trash2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

const RestrictedItems = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    description: "",
    restrictionLevel: "prohibited",
  });

  const restrictedItems = [
    {
      id: 1,
      name: "Liquor/Alcohol",
      category: "Beverages",
      description: "Alcoholic beverages are prohibited",
      restrictionLevel: "prohibited",
      couriers: ["All"],
    },
    {
      id: 2,
      name: "Weapons",
      category: "Dangerous Goods",
      description: "Firearms, knives, and other weapons",
      restrictionLevel: "prohibited",
      couriers: ["All"],
    },
    {
      id: 3,
      name: "Perishable Food",
      category: "Food Items",
      description: "Requires special handling and temperature control",
      restrictionLevel: "restricted",
      couriers: ["BlueDart", "Delhivery"],
    },
    {
      id: 4,
      name: "Batteries",
      category: "Electronics",
      description: "Lithium batteries require special packaging",
      restrictionLevel: "restricted",
      couriers: ["All"],
    },
    {
      id: 5,
      name: "Cash",
      category: "Currency",
      description: "Cash and currency notes are prohibited",
      restrictionLevel: "prohibited",
      couriers: ["All"],
    },
  ];

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category) {
      toast.error("Please fill all required fields");
      return;
    }
    toast.success("Restricted item added successfully");
    setNewItem({
      name: "",
      category: "",
      description: "",
      restrictionLevel: "prohibited",
    });
  };

  const handleDelete = (id: number) => {
    toast.success("Restricted item deleted successfully");
  };

  const filteredItems = restrictedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
            Restricted Items
          </h1>
          <p className="text-foreground/70 text-lg">
            Manage items that are restricted or prohibited for shipping
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg ">
              <Plus className="w-4 h-4 mr-2" />
              Add Restricted Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Add Restricted Item
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                Add a new item to the restricted items list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-foreground">Item Name *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="e.g., Liquor, Weapons"
                  className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Category *</Label>
                <Input
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                  placeholder="e.g., Beverages, Dangerous Goods"
                  className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="Description of the restriction"
                  rows={3}
                  className="bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground resize-none"
                />
              </div>
              <div>
                <Label className="text-foreground">Restriction Level</Label>
                <select
                  value={newItem.restrictionLevel}
                  onChange={(e) =>
                    setNewItem({ ...newItem, restrictionLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-background/50 text-foreground"
                >
                  <option value="prohibited">Prohibited</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
              <Button
                onClick={handleAddItem}
                className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
              >
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Restricted Items List
              </CardTitle>
              <CardDescription className="mt-1 text-foreground/70">
                Items that cannot be shipped or require special handling
              </CardDescription>
            </div>
            <div className="flex-1 max-w-xs ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-gray-200 overflow-x-auto bg-white border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[blue-600]/10 to-[blue-600]/5 border-b border-gray-200">
                  <TableHead className="font-semibold text-foreground">
                    Item Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Restriction Level
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Applicable Couriers
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-blue-50 border-b border-gray-200"
                  >
                    <TableCell className="font-medium text-foreground">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-gray-200 text-foreground/80"
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/70">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.restrictionLevel === "prohibited"
                            ? "bg-[orange-600]/30 text-[orange-600] border-[orange-600]/40"
                            : "bg-[orange-600]/20 text-[orange-600] border-orange-200"
                        }
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {item.restrictionLevel === "prohibited"
                          ? "Prohibited"
                          : "Restricted"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/70">
                      {item.couriers.join(", ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[blue-600]/10"
                        >
                          <Edit className="w-4 h-4 text-foreground/70" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[orange-600]/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-[orange-600]" />
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

export default RestrictedItems;
