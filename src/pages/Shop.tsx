import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Link, useSearchParams } from "react-router";
import { Skeleton } from "../components/ui/skeleton";
import { Product } from "../types";
import { Filter, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";

export function Shop() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      let query = supabase.from('products').select(`
        *,
        product_images(image_url)
      `);
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data } = await query;
      const mapped = (data || []).map((p: any) => ({
        ...p,
        title: p.name,
        price: p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : p.base_price,
        compare_at_price: p.sale_price ? p.base_price : null
      }));
      return mapped;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-editorial font-medium mb-2">Shop All</h1>
          <p className="text-muted-foreground text-sm">Discover our latest collection</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-none gap-2 flex-1 md:flex-none">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="outline" className="rounded-none gap-2 flex-1 md:flex-none">
            Sort <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div 
              key={i} 
              className="space-y-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Skeleton className="aspect-[3/4] w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-none" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3.5 w-2/3 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-none animate-pulse" />
                <Skeleton className="h-3.5 w-1/3 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-none animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {products.map(p => {
             const img = p.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop';
             return (
               <Link key={p.id} to={`/product/${p.slug}`} className="group flex flex-col space-y-3">
                 <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                   <img 
                     src={img} 
                     alt={p.title} 
                     className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                   />
                 </div>
                 <div className="flex flex-col space-y-1">
                   <h3 className="text-sm font-medium line-clamp-1 text-neutral-900">{p.title}</h3>
                   <span className="text-sm font-medium text-neutral-900">₹{p.price}</span>
                 </div>
               </Link>
             );
          })}
        </div>
      ) : (
        <div className="py-32 text-center text-muted-foreground">
           <p>No products found based on your filters.</p>
        </div>
      )}
    </div>
  );
}
