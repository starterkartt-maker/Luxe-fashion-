import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";

export function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wishlists')
        .select(`
          id, product_id,
          product:products(id, name, slug, base_price, sale_price, product_images(image_url))
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

  const removeWishlistEntry = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('wishlists').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  });

  // Adding item to cart from wishlist can skip variations if complex, or just navigate to product
  
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 animate-spin rounded-full"></div>
        <p className="text-sm font-medium tracking-wide uppercase">Verifying wishlist...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <h2 className="text-2xl font-editorial font-medium">Saved Items</h2>
        <p className="text-muted-foreground">Sign in to sync your saved items across devices.</p>
        <Button onClick={() => navigate("/auth")} className="rounded-none tracking-widest uppercase">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl font-editorial font-medium mb-10">Wishlist</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="aspect-[3/4] w-full" />
        </div>
      ) : wishlist && wishlist.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {wishlist.map((item: any) => {
             const p = item.product;
             if (!p) return null;
             const img = p.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop';
             return (
               <div key={item.id} className="group flex flex-col space-y-3">
                 <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                   <img 
                     src={img} 
                     alt={p.title} 
                     className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                   />
                   <button 
                     onClick={(e) => { e.preventDefault(); removeWishlistEntry.mutate(item.id); }}
                     className="absolute top-2 right-2 bg-white/80 p-2 hover:bg-white transition-colors"
                     title="Remove"
                   >
                     <Trash2 className="w-4 h-4 text-black" />
                   </button>
                 </div>
                 <div className="flex flex-col space-y-1">
                   <Link to={`/product/${p.slug}`} className="text-sm font-medium hover:underline text-neutral-900">{p.title}</Link>
                   <span className="text-sm font-medium text-neutral-900">₹{p.price}</span>
                 </div>
                 <Button variant="outline" className="w-full rounded-none tracking-widest text-xs uppercase" onClick={() => navigate(`/product/${p.slug}`)}>
                   View Product
                 </Button>
               </div>
             );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-border bg-muted/20">
          <p className="text-muted-foreground mb-6">Your wishlist is currently empty.</p>
          <Button onClick={() => navigate("/shop")} className="rounded-none tracking-widest uppercase px-12">
            Discover
          </Button>
        </div>
      )}
    </div>
  );
}
