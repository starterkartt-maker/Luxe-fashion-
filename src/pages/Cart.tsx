import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";

export function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('cart_items')
        .select(`
          id, quantity, product_id, variant_id,
          product:products(id, name, slug, base_price, sale_price, product_images(image_url)),
          variant:product_variants(id, color, size, price, image_url)
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

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string, quantity: number }) => {
      if (quantity < 1) return;
      await supabase.from('cart_items').update({ quantity }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('cart_items').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 animate-spin rounded-full"></div>
        <p className="text-sm font-medium tracking-wide uppercase">Verifying bag...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <h2 className="text-2xl font-editorial font-medium">Your Bag is Empty</h2>
        <p className="text-muted-foreground">Sign in to sync your cart or start shopping.</p>
        <div className="flex justify-center gap-4">
           <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-none tracking-widest uppercase">Sign In</Button>
           <Button onClick={() => navigate("/shop")} className="rounded-none tracking-widest uppercase">Shop Now</Button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems?.reduce((acc, item: any) => {
    const price = item.variant?.price || item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl font-editorial font-medium mb-10">Shopping Bag</h1>
      
      {isLoading ? (
        <div className="animate-pulse space-y-6">
           <div className="h-24 bg-muted w-full"></div>
           <div className="h-24 bg-muted w-full"></div>
        </div>
      ) : cartItems?.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item: any) => {
              const p = item.product;
              const v = item.variant;
              const img = v?.image_url || p?.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000';
              const price = v?.price || p?.price;
              
              return (
                <div key={item.id} className="flex gap-6 border-b border-border pb-6">
                  <div className="w-24 aspect-[3/4] bg-muted">
                    <img src={img} alt={p?.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <Link to={`/product/${p?.slug}`} className="font-medium hover:underline text-neutral-900">{p?.title}</Link>
                        {(v?.color || v?.size) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {v.color && `Color: ${v.color}`}
                            {v.color && v.size && ' | '}
                            {v.size && `Size: ${v.size}`}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-neutral-900">₹{price}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-border">
                        <button 
                          onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          className="px-3 py-1 hover:bg-muted"
                        >-</button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          className="px-3 py-1 hover:bg-muted"
                        >+</button>
                      </div>
                      <button 
                        onClick={() => removeItem.mutate(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="lg:col-span-1">
            <div className="border border-border p-6 space-y-6 sticky top-24 bg-background">
              <h2 className="font-editorial text-xl font-medium border-b border-border pb-4">Order Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-medium text-base">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={() => navigate('/checkout')} className="w-full rounded-none tracking-widest uppercase py-6 bg-black text-white hover:bg-black/90">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-border bg-muted/20">
          <p className="text-muted-foreground mb-6">Your bag is empty.</p>
          <Button onClick={() => navigate("/shop")} className="rounded-none tracking-widest uppercase px-12">
            Continue Shopping
          </Button>
        </div>
      )}
    </div>
  );
}
