import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useParams, Link, useNavigate } from "react-router";
import { Heart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { ProductReviews } from "../components/ProductReviews";

export function ProductDetails() {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(id, image_url, sort_order),
          product_variants(id, color, size, stock, price, image_url)
        `)
        .eq('slug', id)
        .single();
      
      if (error || !data) {
        console.error("Product fetch error:", error);
        return null;
      }
      
      return {
        ...data,
        title: data.name,
        price: data.sale_price !== null && data.sale_price !== undefined ? data.sale_price : data.base_price,
        compare_at_price: data.sale_price ? data.base_price : null
      };
    },
    enabled: !!id
  });

  const variants = product?.product_variants || [];
  const uniqueSizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean)));
  const uniqueColors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean)));

  // Fetch reviews for dynamic star & count updates
  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          throw fallbackError;
        }

        if (!fallbackData || fallbackData.length === 0) {
          return [];
        }

        const userIds = Array.from(new Set(fallbackData.map(r => r.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (profilesData && profilesData.length > 0) {
            const profileMap = new Map(profilesData.map(p => [p.id, p]));
            return fallbackData.map(rev => ({
              ...rev,
              profiles: profileMap.get(rev.user_id) || null
            }));
          }
        }

        return fallbackData;
      }
      return data || [];
    },
    enabled: !!product?.id
  });

  const totalReviews = reviews?.length || 0;
  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (product && variants.length > 0) {
      const firstWithColor = variants.find((v: any) => v.color);
      const firstWithSize = variants.find((v: any) => v.size);
      setSelectedColor(firstWithColor?.color || variants[0].color || '');
      setSelectedSize(firstWithSize?.size || variants[0].size || '');
    }
  }, [product, variants]);

  const activeVariant = variants.find((v: any) => {
    const colorMatch = !v.color || v.color.trim() === selectedColor.trim();
    const sizeMatch = !v.size || v.size.trim() === selectedSize.trim();
    return colorMatch && sizeMatch;
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate("/auth");
        throw new Error("Must be logged in to add to cart");
      }
      if (!product) return;
      
      const variantId = activeVariant?.id;
      
      const { data: existing, error: fetchErr } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('variant_id', variantId || null)
        .single();
        
      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            variant_id: variantId || null,
            quantity: 1
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Could show toast here
      navigate("/cart");
    }
  });

  const addToWishlist = useMutation({
    mutationFn: async () => {
      if (!user) return navigate("/auth");
      if (!product) return;
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-12">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-6 mt-12">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">
        Product not found
      </div>
    );
  }

  const images = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const fallBackImage = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop';
  const displayImages = images.length > 0 ? images : [{ image_url: fallBackImage }];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        
        {/* Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:w-20 snap-x">
            {displayImages.map((img: any, idx: number) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={cn(
                  "relative w-20 aspect-[3/4] flex-shrink-0 snap-start overflow-hidden border-2 transition-all",
                  selectedImage === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={img.image_url} alt="" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
          <div className="relative flex-1 aspect-[3/4] md:aspect-auto md:min-h-[70vh] bg-muted overflow-hidden">
            <img 
              src={displayImages[selectedImage]?.image_url} 
              alt={product.title}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-editorial font-medium mb-1 text-neutral-900">{product.title}</h1>
            
            {/* Top Stars Summary */}
            <div className="flex items-center gap-2 mb-3">
              {totalReviews > 0 ? (
                <button 
                  onClick={() => {
                    document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 group cursor-pointer"
                >
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={cn(
                          "w-3.5 h-3.5", 
                          star <= Math.round(averageRating) ? "fill-neutral-900 text-neutral-900" : "text-neutral-300"
                        )} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-neutral-850 group-hover:underline">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
                >
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5 text-neutral-200" />
                    ))}
                  </div>
                  <span>No reviews yet — be the first to share!</span>
                </button>
              )}
            </div>

            <p className="text-xl font-medium text-neutral-900">₹{product.price}</p>
          </div>          <div className="space-y-6">
            {uniqueColors.length > 0 && (
               <div className="space-y-3">
                 <p className="text-sm font-medium text-neutral-950">Color: <span className="font-semibold text-neutral-900">{selectedColor}</span></p>
                 <div className="flex flex-wrap gap-3">
                   {uniqueColors.map((color: any, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => setSelectedColor(color)}
                       className={cn(
                         "w-8 h-8 rounded-full border flex items-center justify-center p-0.5 transition-all",
                         selectedColor === color ? "border-neutral-900 ring-2 ring-neutral-950" : "border-neutral-200 hover:border-neutral-400"
                       )} 
                       title={color}
                     >
                       <span className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: color.toLowerCase().trim() }} />
                     </button>
                   ))}
                 </div>
               </div>
            )}
            
            {uniqueSizes.length > 0 && (
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <p className="text-sm font-medium text-neutral-950">Size: <span className="font-semibold text-neutral-900">{selectedSize}</span></p>
                   <button className="text-xs text-muted-foreground underline">Size Guide</button>
                 </div>
                 <div className="flex flex-wrap gap-3">
                   {uniqueSizes.map((size: any, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => setSelectedSize(size)}
                       className={cn(
                         "w-12 h-12 border flex items-center justify-center text-sm transition-all rounded-none",
                         selectedSize === size ? "border-neutral-950 bg-neutral-950 text-white font-semibold" : "border-neutral-200 hover:border-neutral-900 text-neutral-600"
                       )}
                     >
                       {size}
                     </button>
                   ))}
                 </div>
               </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 pt-4">
            <div className="flex items-center gap-4">
              <Button 
                disabled={addToCartMutation.isPending || (variants.length > 0 && !activeVariant) || (activeVariant && activeVariant.stock <= 0)} 
                onClick={() => addToCartMutation.mutate()} 
                className="flex-1 rounded-none uppercase tracking-widest bg-black text-white hover:bg-black/90 py-6"
              >
                {addToCartMutation.isPending ? "Adding..." : 
                 (variants.length > 0 && !activeVariant) ? "Select Style" :
                 (activeVariant && activeVariant.stock <= 0) ? "Out of Stock" : 
                 "Add to Bag"}
              </Button>
              <Button variant="outline" size="icon" disabled={addToWishlist.isPending} onClick={() => addToWishlist.mutate()} className="h-12 w-12 rounded-none border-border">
                <Heart className="w-5 h-5 font-light" />
              </Button>
            </div>
            {activeVariant && activeVariant.stock > 0 && activeVariant.stock <= 5 && (
              <p className="text-xs text-amber-600 font-medium mt-1">Low Block Stock: only {activeVariant.stock} left in this style</p>
            )}
          </div>

          <div className="prose prose-sm text-neutral-600 pt-8 border-t border-border space-y-4">
            <div>
              <p className="font-medium text-neutral-900 uppercase tracking-wider text-xs mb-2">Description</p>
              <p className="leading-relaxed">{product.description || "Premium quality guaranteed. Delivered in signature Luxe fashion packaging."}</p>
            </div>
            
            <div className="pt-2">
              <p className="font-medium text-neutral-900 uppercase tracking-wider text-xs mb-2">Specifications</p>
              <ul className="space-y-1.5 text-sm list-inside">
                <li>• Fabric details: {product.fabric_details || "100% premium luxury fabric"}</li>
                <li>• Care instructions: {product.care_instructions || "Dry clean or gentle wash only"}</li>
                <li>• Fit details: Standard signature silhouette</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews Component */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
