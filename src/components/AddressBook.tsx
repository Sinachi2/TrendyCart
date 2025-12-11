import { useState, useEffect } from "react";
import { Plus, MapPin, Edit2, Trash2, Check, X, Home, Building, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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

interface Address {
  id: string;
  label: string;
  full_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

interface AddressBookProps {
  userId: string;
}

const emptyAddress = {
  label: "Home",
  full_name: "",
  street_address: "",
  apartment: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  phone: "",
  is_default: false,
};

export const AddressBook = ({ userId }: AddressBookProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData(emptyAddress);
    setDialogOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      full_name: address.full_name,
      street_address: address.street_address,
      apartment: address.apartment || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || "",
      is_default: address.is_default,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.street_address || !formData.city || !formData.state || !formData.postal_code) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // If setting as default, unset other defaults first
      if (formData.is_default && !editingAddress?.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update({
            label: formData.label,
            full_name: formData.full_name,
            street_address: formData.street_address,
            apartment: formData.apartment || null,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            phone: formData.phone || null,
            is_default: formData.is_default,
          })
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast({ title: "Address updated" });
      } else {
        const { error } = await supabase.from("addresses").insert({
          user_id: userId,
          label: formData.label,
          full_name: formData.full_name,
          street_address: formData.street_address,
          apartment: formData.apartment || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone || null,
          is_default: addresses.length === 0 ? true : formData.is_default,
        });

        if (error) throw error;
        toast({ title: "Address added" });
      }

      setDialogOpen(false);
      loadAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Address deleted" });
      loadAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);

      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Default address updated" });
      loadAddresses();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "home": return Home;
      case "work": return Building;
      default: return MapPin;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Address Book</h2>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="rounded-xl gap-2"
                onClick={handleOpenAdd}
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Label</Label>
                    <Select
                      value={formData.label}
                      onValueChange={(value) => setFormData({ ...formData, label: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Street Address *</Label>
                  <Input
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    className="h-11 rounded-xl"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Apartment, Suite, etc.</Label>
                  <Input
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    className="h-11 rounded-xl"
                    placeholder="Apt 4B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">State *</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Postal Code *</Label>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Set as default address</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl"
                >
                  {saving ? "Saving..." : editingAddress ? "Update" : "Add Address"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-10">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No addresses saved yet</p>
            <Button 
              variant="outline" 
              className="rounded-xl gap-2"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" />
              Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => {
              const LabelIcon = getLabelIcon(address.label);
              return (
                <div
                  key={address.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    address.is_default 
                      ? "border-primary/30 bg-primary/5" 
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  {address.is_default && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </span>
                  )}
                  
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      address.label.toLowerCase() === "home" 
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : address.label.toLowerCase() === "work"
                        ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <LabelIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{address.label}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{address.full_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street_address}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      {address.phone && (
                        <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(address)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-destructive ml-auto"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
