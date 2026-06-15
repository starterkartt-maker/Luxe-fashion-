import { useState, FormEvent, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { useNavigate, Navigate } from "react-router";
import { cn } from "../lib/utils";

export function CheckoutPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  });
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: addresses } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setAddress({
        name: defaultAddr.full_name || '',
        street: defaultAddr.address_line_1 || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        zip: defaultAddr.postal_code || '',
        phone: defaultAddr.phone || ''
      });
    }
  }, [addresses]);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setAddress({
      name: addr.full_name || '',
      street: addr.address_line_1 || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.postal_code || '',
      phone: addr.phone || ''
    });
  };

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('cart_items')
        .select(`
          id, quantity, product_id, variant_id,
          product:products(id, name, base_price, sale_price),
          variant:product_variants(id, price)
        `)
        .eq('user_id', user.id);
      
      const mapped = (data || []).map((item: any) => {
        if (!item.product) return item;
        const p = item.product;
        return {
          ...item,
          product: {
            ...p,
            title: p.name,
            price: p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : p.base_price,
            compare_at_price: p.sale_price ? p.base_price : null
          }
        };
      });
      return mapped;
    },
    enabled: !!user
  });

  const subtotal = cartItems?.reduce((acc, item: any) => {
    const price = item.variant?.price || item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0) || 0;

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || cartItems?.length === 0) return;
    
    setPlacingOrder(true);
    setErrorMessage(null);
    
    try {
      let finalAddressId = selectedAddressId;

      // If no pre-selected address is present, insert a new one
      if (!finalAddressId) {
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            full_name: address.name,
            address_line_1: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.zip,
            phone: address.phone,
            is_default: !addresses || addresses.length === 0
          })
          .select('id')
          .single();
          
        if (addressError) {
          console.error("Address DB insert error:", addressError);
          throw addressError;
        }
        finalAddressId = addressData?.id;
      }

      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: subtotal,
          subtotal: subtotal,
          discount: 0,
          payment_method: paymentMethod || 'cod',
          payment_status: 'pending',
          status: 'pending',
          address_id: finalAddressId
        })
        .select('id')
        .single();

      if (orderError) {
        console.error("Order DB insert error:", orderError);
        throw orderError;
      }

      // 2. Insert Order Items
      const orderItems = cartItems.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Clear Cart
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      navigate(`/checkout/success?order_id=${orderData.id}`);

    } catch (err: any) {
      console.error("Order placement failed:", err);
      setErrorMessage(err.message || 'Payment/Order failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 animate-spin rounded-full"></div>
        <p className="text-sm font-medium tracking-wide uppercase">Verifying checkout session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  if (cartItems?.length === 0) {
    return <Navigate to="/cart" />;
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl font-editorial font-medium mb-10">Checkout</h1>
      
      <div className="grid lg:grid-cols-2 gap-12">
        <form onSubmit={handlePlaceOrder} className="space-y-10">
          
          <section className="space-y-6">
             <h2 className="text-xl font-medium border-b border-border pb-2">Shipping Information</h2>

             {addresses && addresses.length > 0 && (
               <div className="space-y-3 mb-6 bg-neutral-50/20 p-4 border border-dashed border-border">
                 <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Choose Saved Address</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {addresses.map((addr: any) => (
                     <div 
                       key={addr.id}
                       type="button"
                       onClick={() => handleSelectAddress(addr)}
                       className={cn(
                         "border p-4 cursor-pointer text-left transition-all relative flex flex-col justify-between rounded-sm",
                         selectedAddressId === addr.id ? "border-black bg-white ring-1 ring-black" : "border-border hover:border-neutral-400 bg-white shadow-xs"
                       )}
                     >
                       <div>
                         <p className="font-semibold text-sm text-neutral-900">{addr.full_name}</p>
                         <p className="text-xs text-neutral-500 mt-1 lines-clamp-1">{addr.address_line_1}</p>
                         <p className="text-xs text-neutral-500">{addr.city}, {addr.state} {addr.postal_code}</p>
                         <p className="text-xs text-neutral-500 mt-1">{addr.phone}</p>
                       </div>
                       {selectedAddressId === addr.id && (
                         <span className="absolute top-2 right-2 text-[9px] bg-black text-white px-1.5 py-0.5 font-bold uppercase tracking-widest rounded-sm">Selected</span>
                       )}
                     </div>
                   ))}
                   <div 
                     type="button"
                     onClick={() => {
                       setSelectedAddressId('');
                       setAddress({ name: '', street: '', city: '', state: '', zip: '', phone: '' });
                     }}
                     className={cn(
                       "border p-4 cursor-pointer text-center flex flex-col items-center justify-center transition-all min-h-[96px] rounded-sm bg-white border-dashed",
                       !selectedAddressId ? "border-black bg-white ring-1 ring-black" : "border-border hover:border-neutral-400"
                     )}
                   >
                     <p className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">+ New Address</p>
                     <p className="text-[11px] text-neutral-500 mt-0.5">Ship to new destination</p>
                   </div>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input placeholder="Full Name" required value={address.name} onChange={e=>{setSelectedAddressId(''); setAddress({...address, name: e.target.value});}} className="col-span-full h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
               <input placeholder="Street Address" required value={address.street} onChange={e=>{setSelectedAddressId(''); setAddress({...address, street: e.target.value});}} className="col-span-full h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
               <input placeholder="City" required value={address.city} onChange={e=>{setSelectedAddressId(''); setAddress({...address, city: e.target.value});}} className="h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
               <input placeholder="State / Province" required value={address.state} onChange={e=>{setSelectedAddressId(''); setAddress({...address, state: e.target.value});}} className="h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
               <input placeholder="ZIP / Postal Code" required value={address.zip} onChange={e=>{setSelectedAddressId(''); setAddress({...address, zip: e.target.value});}} className="h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
               <input placeholder="Phone" required value={address.phone} onChange={e=>{setSelectedAddressId(''); setAddress({...address, phone: e.target.value});}} className="h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors" />
             </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-medium border-b border-border pb-2">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 border border-border p-4 cursor-pointer hover:bg-muted/50">
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span className="font-medium">Cash on Delivery (COD)</span>
              </label>
              <label className="flex items-center gap-3 border border-border p-4 opacity-50 cursor-not-allowed">
                <input type="radio" name="payment" value="razorpay" disabled />
                <span className="font-medium flex justify-between w-full">Razorpay <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span></span>
              </label>
            </div>
          </section>

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-200 text-sm rounded-none font-medium animate-in fade-in duration-200">
              <p className="font-semibold uppercase tracking-wider text-xs">Order Placement Error</p>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
              <p className="mt-2 text-[11px] text-red-600">Please verify your details and try again, or contact support if the issue persists.</p>
            </div>
          )}

          <Button type="submit" disabled={placingOrder} className="w-full h-14 rounded-none uppercase tracking-widest text-lg">
            {placingOrder ? "Placing Order..." : "Place Order"}
          </Button>

        </form>

        <div>
          <div className="border border-border p-6 bg-muted/20 sticky top-24">
             <h2 className="text-xl font-medium border-b border-border pb-4 mb-4">Summary</h2>
             <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
               {cartItems?.map((item: any) => (
                 <div key={item.id} className="flex justify-between text-sm">
                   <span className="text-muted-foreground font-medium">{item.quantity} × {item.product.title}</span>
                   <span className="text-neutral-900 font-medium">₹{((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}</span>
                 </div>
               ))}
             </div>
             <div className="border-t border-border pt-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg text-neutral-900 font-bold pt-2">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
