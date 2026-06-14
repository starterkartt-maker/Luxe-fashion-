import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LogOut, Package, MapPin, User as UserIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "../lib/utils";

type Tab = "details" | "orders" | "addresses";

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    name: '', street: '', city: '', state: '', zip: '', phone: ''
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    enabled: !!user
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data;
    },
    enabled: !!user
  });

  const { data: trackingOrderDetails } = useQuery({
    queryKey: ['order-details', trackingOrderId],
    queryFn: async () => {
      if (!trackingOrderId) return null;
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(*)
        `)
        .eq('id', trackingOrderId)
        .single();
        
      if (!order) return null;
      
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          id, quantity, price,
          product:products(id, name, slug, product_images(image_url)),
          variant:product_variants(id, color, size)
        `)
        .eq('order_id', trackingOrderId);
        
      return {
        ...order,
        items: items || []
      };
    },
    enabled: !!trackingOrderId
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const addAddressMutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        full_name: newAddress.name,
        address_line_1: newAddress.street,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.zip,
        phone: newAddress.phone,
        is_default: addresses?.length === 0
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddingAddress(false);
      setNewAddress({ name: '', street: '', city: '', state: '', zip: '', phone: '' });
    }
  });

  if (authLoading || isLoading) {
    return <div className="p-8 text-center"><Skeleton className="h-40 w-full" /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <h2 className="text-2xl font-editorial font-medium">Authentication Required</h2>
        <p className="text-muted-foreground">Sign in to view your profile and orders.</p>
        <Button onClick={() => navigate("/auth")} className="rounded-none px-12 tracking-widest uppercase">Sign In</Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-editorial font-medium mb-2">My Account</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="rounded-none gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 border border-border p-6 space-y-6 self-start bg-muted/10">
          <h3 className="font-medium tracking-wide uppercase text-sm border-b pb-3">Menu</h3>
          <nav className="flex flex-col space-y-2">
            <button 
              onClick={() => setActiveTab('details')}
              className={cn(
                "flex items-center gap-3 text-sm p-2 transition-colors",
                activeTab === 'details' ? "bg-muted font-medium" : "hover:text-muted-foreground hover:bg-muted/50"
              )}
            >
              <UserIcon className="w-4 h-4" /> Account Details
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "flex items-center gap-3 text-sm p-2 transition-colors",
                activeTab === 'orders' ? "bg-muted font-medium" : "hover:text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Package className="w-4 h-4" /> Order History
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={cn(
                "flex items-center gap-3 text-sm p-2 transition-colors",
                activeTab === 'addresses' ? "bg-muted font-medium" : "hover:text-muted-foreground hover:bg-muted/50"
              )}
            >
              <MapPin className="w-4 h-4" /> Saved Addresses
            </button>
          </nav>
        </div>
        
        <div className="md:col-span-3">
          {activeTab === 'details' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-editorial font-medium">Account Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border p-6 bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">{profile?.full_name || 'N/A'}</p>
                </div>
                <div className="border border-border p-6 bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-editorial font-medium">
                  {trackingOrderId ? "Tracking Information" : "Recent Orders"}
                </h2>
                {trackingOrderId && (
                  <Button 
                    onClick={() => setTrackingOrderId(null)} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none text-xs"
                  >
                    ← Back to List
                  </Button>
                )}
              </div>

              {trackingOrderId ? (
                trackingOrderDetails ? (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border border-neutral-200 p-6 bg-white space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between border-b pb-4 border-neutral-100 gap-2">
                        <div>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Order ID</p>
                          <p className="font-mono text-sm text-neutral-800">#{trackingOrderDetails.id}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest text-left sm:text-right">Ordered On</p>
                          <p className="text-sm text-neutral-800 text-left sm:text-right">
                            {new Date(trackingOrderDetails.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </p>
                        </div>
                      </div>

                      {/* Timeline status wizard */}
                      <div className="py-6 border-b border-neutral-100">
                        <div className="flex justify-between items-center relative mb-10 mt-2 max-w-xl mx-auto">
                          {/* Connection line background */}
                          <div className="absolute left-0 right-0 top-[14px] -translate-y-1/2 h-0.5 bg-neutral-100 -z-0" />
                          <div 
                            className="absolute left-0 top-[14px] -translate-y-1/2 h-0.5 bg-black transition-all duration-750 -z-0" 
                            style={{ 
                              width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(trackingOrderDetails.status?.toLowerCase() || 'pending')) / 3) * 100}%` 
                            }}
                          />
                          
                          {/* Timeline Node Points */}
                          {['Order Placed', 'Processing', 'In Transit', 'Delivered'].map((label, idx) => {
                            const stepsMap = ['pending', 'processing', 'shipped', 'delivered'];
                            const currentStatusIdx = stepsMap.indexOf(trackingOrderDetails.status?.toLowerCase() || 'pending');
                            const isCompleted = idx <= currentStatusIdx;
                            const isActive = idx === currentStatusIdx;

                            return (
                              <div key={idx} className="flex flex-col items-center relative z-10">
                                <div className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                                  isActive ? "bg-black border-black text-white ring-4 ring-neutral-100" :
                                  isCompleted ? "bg-black border-black text-white" : 
                                  "bg-white border-neutral-200 text-neutral-400"
                                )}>
                                  {idx + 1}
                                </div>
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-wider mt-2.5 whitespace-nowrap",
                                  isCompleted ? "text-neutral-900" : "text-neutral-400"
                                )}>
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <p className="text-center text-xs text-neutral-500 font-medium">
                          Current status: <span className="font-bold text-neutral-900 uppercase text-xs">
                            {trackingOrderDetails.status === 'pending' ? 'Preparing Shipment' : trackingOrderDetails.status}
                          </span>
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 pt-4">
                        {/* Shipped to address card */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Delivery Destination</p>
                          {trackingOrderDetails.address ? (
                            <div className="bg-neutral-50 p-4 border border-neutral-100 rounded-sm space-y-1">
                              <p className="font-semibold text-sm text-neutral-950">{trackingOrderDetails.address.full_name}</p>
                              <p className="text-xs text-neutral-500">{trackingOrderDetails.address.address_line_1}</p>
                              <p className="text-xs text-neutral-500">{trackingOrderDetails.address.city}, {trackingOrderDetails.address.state} {trackingOrderDetails.address.postal_code}</p>
                              <p className="text-xs text-neutral-500">{trackingOrderDetails.address.phone}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-400 italic">No delivery address linked</p>
                          )}
                        </div>

                        {/* Summary of Items */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Items Ordered</p>
                          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {trackingOrderDetails.items?.map((item: any) => (
                              <div key={item.id} className="flex gap-4 border-b border-neutral-100 pb-4 last:border-none last:pb-0">
                                <div className="w-12 aspect-[3/4] bg-neutral-50 border border-neutral-200/50 flex-shrink-0">
                                  <img 
                                    src={item.product?.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000'} 
                                    alt={item.product?.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-neutral-950 leading-tight truncate">{item.product?.name}</p>
                                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                                    {item.variant ? `Size: ${item.variant.size}, Colour: ${item.variant.color}` : 'Standard Silhouette'}
                                  </p>
                                  <p className="text-[11px] font-semibold text-neutral-800 mt-1">{item.quantity} × ₹{item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="border-t border-neutral-100 pt-3 flex justify-between items-center">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Total Value</span>
                            <span className="font-bold text-sm text-neutral-900">₹{trackingOrderDetails.total_amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-neutral-400">Loading tracking steps...</div>
                )
              ) : (
                orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        onClick={() => setTrackingOrderId(order.id)}
                        className="border border-border p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-background hover:border-black cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">Order #{order.id.slice(0,8)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Ordered: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-4 items-center w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                          <span className="text-[10px] font-bold px-2.5 py-1 bg-neutral-100 rounded-sm uppercase tracking-wider text-neutral-700">{order.status}</span>
                          <p className="font-semibold text-sm text-neutral-900 ml-4">₹{order.total_amount}</p>
                          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider ml-2 hidden md:block">Track →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 p-12 text-center border border-border flex flex-col items-center">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm text-muted-foreground mt-2">When you place an order, it will appear here.</p>
                    <Button onClick={() => navigate('/shop')} className="mt-6 rounded-none uppercase tracking-widest px-8">Start Shopping</Button>
                  </div>
                )
              )}
            </section>
          )}

          {activeTab === 'addresses' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <h2 className="text-xl font-editorial font-medium">Saved Addresses</h2>
               {!isAddingAddress && (
                 <Button onClick={() => setIsAddingAddress(true)} size="sm" variant="outline" className="rounded-none gap-2">
                   <Plus className="w-4 h-4" /> Add New Address
                 </Button>
               )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={(e) => addAddressMutation.mutate(e)} className="border border-border p-6 space-y-6 bg-muted/10">
                  <h3 className="font-medium">Add New Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                     <input placeholder="Full Name" required value={newAddress.name} onChange={e=>setNewAddress({...newAddress, name: e.target.value})} className="col-span-full h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                     <input placeholder="Street Address" required value={newAddress.street} onChange={e=>setNewAddress({...newAddress, street: e.target.value})} className="col-span-full h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                     <input placeholder="City" required value={newAddress.city} onChange={e=>setNewAddress({...newAddress, city: e.target.value})} className="h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                     <input placeholder="State / Province" required value={newAddress.state} onChange={e=>setNewAddress({...newAddress, state: e.target.value})} className="h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                     <input placeholder="ZIP / Postal Code" required value={newAddress.zip} onChange={e=>setNewAddress({...newAddress, zip: e.target.value})} className="h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                     <input placeholder="Phone" required value={newAddress.phone} onChange={e=>setNewAddress({...newAddress, phone: e.target.value})} className="h-12 border border-border px-4 focus:outline-none focus:border-black bg-background" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button type="submit" disabled={addAddressMutation.isPending} className="rounded-none tracking-widest uppercase">
                      {addAddressMutation.isPending ? "Saving..." : "Save Address"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddingAddress(false)} className="rounded-none tracking-widest uppercase">
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {addresses && addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <div key={addr.id} className="border border-border p-6 bg-background space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{addr.full_name}</p>
                          {addr.is_default && <span className="text-xs bg-muted px-2 py-1 uppercase tracking-wider">Default</span>}
                        </div>
                        <p className="text-muted-foreground text-sm">{addr.address_line_1}</p>
                        <p className="text-muted-foreground text-sm">{addr.city}, {addr.state} {addr.postal_code}</p>
                        <p className="text-muted-foreground text-sm">{addr.phone}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted/30 p-12 text-center border border-border flex flex-col items-center">
                      <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium">No saved addresses</p>
                      <p className="text-sm text-muted-foreground mt-2">Add your shipping addresses for a faster checkout experience.</p>
                      <Button onClick={() => setIsAddingAddress(true)} className="mt-6 rounded-none uppercase tracking-widest px-8" variant="outline">
                        Add New Address
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
