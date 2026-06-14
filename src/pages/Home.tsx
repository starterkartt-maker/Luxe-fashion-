import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Campaign, HomepageSection } from "../types";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "../components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export function Home() {
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('*');
      return (data || []) as Campaign[];
    }
  });

  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ['homepage_sections'],
    queryFn: async () => {
      const { data } = await supabase
        .from('homepage_sections')
        .select(`
          *,
          homepage_section_products(
            id,
            product:products(
              id, name, slug, base_price, sale_price,
              product_images(image_url)
            )
          )
        `)
        .order('display_order', { ascending: true });
        
      const mapped = (data || []).map((section: any) => {
        if (!section.homepage_section_products) return section;
        return {
          ...section,
          homepage_section_products: section.homepage_section_products.map((hp: any) => {
            if (!hp.product) return hp;
            const p = hp.product;
            return {
              ...hp,
              product: {
                ...p,
                title: p.name,
                price: p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : p.base_price,
                compare_at_price: p.sale_price ? p.base_price : null
              }
            };
          })
        };
      });
      return mapped;
    }
  });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] md:h-[90vh] w-full bg-muted overflow-hidden">
        {loadingCampaigns ? (
          <Skeleton className="w-full h-full rounded-none" />
        ) : campaigns && campaigns.length > 0 ? (
          <div className="relative w-full h-full">
            <img 
              src={campaigns[0].image_url} 
              alt={campaigns[0].title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-end md:justify-center p-6 pb-24 text-center text-white z-10">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-7xl font-editorial font-medium tracking-wide mb-4"
              >
                {campaigns[0].title}
              </motion.h1>
              {campaigns[0].subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg md:text-xl font-light mb-8 max-w-lg"
                >
                  {campaigns[0].subtitle}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link to={campaigns[0].redirect_url || '/shop'}>
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-none px-12 tracking-widest uppercase">
                    {campaigns[0].button_text || 'Discover'}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900">
            <h1 className="text-4xl font-editorial tracking-widest uppercase text-muted-foreground">Luxe Collection</h1>
          </div>
        )}
      </section>

      {/* Middle Sections (H&M Style) */}
      <div className="container mx-auto px-4 py-16 space-y-24">
        {loadingSections ? (
          <div className="space-y-16">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        ) : sections && sections.length > 0 ? (
          sections.map((section) => (
            <section key={section.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-editorial font-medium tracking-wide">{section.title}</h2>
                <Link to={`/shop?section=${section.id}`} className="text-sm font-medium hover:underline flex items-center">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {section.homepage_section_products?.slice(0, 4).map((hp: any) => {
                  const p = hp.product;
                  if (!p) return null;
                  const img = p.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6';
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">₹{p.price}</span>
                          {p.compare_at_price && (
                            <span className="text-sm text-muted-foreground line-through">₹{p.compare_at_price}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-20 px-4">
             No curated sections available at the moment. Explore our full catalog holding the latest trends.
             <div className="mt-8">
               <Link to="/shop">
                 <Button variant="outline" className="rounded-none tracking-widest uppercase">Go to Shop</Button>
               </Link>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
