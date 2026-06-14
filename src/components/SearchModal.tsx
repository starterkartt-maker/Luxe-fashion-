import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Search, X, Loader2, SquareArrowOutUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  "Shirt",
  "Dress",
  "Oversized",
  "Trousers",
  "Jacket",
  "Premium Cotton"
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Query Supabase
  const { data: results, isLoading } = useQuery({
    queryKey: ["product-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, description, slug, base_price, sale_price,
          product_images(image_url)
        `);

      if (error) {
        console.error("Search query error:", error);
        return [];
      }

      const term = searchTerm.toLowerCase().trim();
      const mapped = (data || []).map((product: any) => ({
        ...product,
        title: product.name,
        price: product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.base_price,
        compare_at_price: product.sale_price ? product.base_price : null
      }));

      return mapped.filter((product: any) => {
        const titleMatch = product.title?.toLowerCase().includes(term);
        const descMatch = product.description?.toLowerCase().includes(term);
        return titleMatch || descMatch;
      }).slice(0, 6);
    },
    enabled: searchTerm.trim().length > 0
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col justify-start"
        >
          {/* Header Bar */}
          <div className="border-b border-border/45 bg-background">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full max-w-2xl">
                <Search className="w-5 h-5 text-muted-foreground stroke-[1.5]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="SEARCH FOR AN ITEM, CATEGORY, OR COLLECTION..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-base font-sans tracking-wide uppercase focus:outline-none placeholder:text-muted-foreground/60 h-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-1 hover:bg-muted font-sans text-xs uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                aria-label="Close search"
              >
                <span className="hidden sm:inline text-xs font-mono tracking-widest uppercase text-muted-foreground">ESC</span>
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* Results & Suggestions Area */}
          <div className="flex-1 overflow-y-auto bg-background py-10">
            <div className="container mx-auto px-4 max-w-4xl grid md:grid-cols-3 gap-12">
              
              {/* Left Column: Trending/Quick Links */}
              <div className="md:col-span-1 space-y-8">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Trending Searches</h3>
                  <div className="flex flex-wrap md:flex-col gap-2 md:gap-3">
                    {TRENDING_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchTerm(term)}
                        className="text-left py-1 text-sm font-sans hover:text-black/60 transition-colors uppercase tracking-wider"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Popular Categories</h3>
                  <div className="flex flex-col gap-2">
                    <Link to="/shop?category=women" onClick={onClose} className="text-sm font-sans uppercase tracking-wider hover:underline flex items-center justify-between">
                      Women <SquareArrowOutUpRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </Link>
                    <Link to="/shop?category=men" onClick={onClose} className="text-sm font-sans uppercase tracking-wider hover:underline flex items-center justify-between">
                      Men <SquareArrowOutUpRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Columns: Active Search Results */}
              <div className="md:col-span-2 space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2">
                  {searchTerm ? "Search Results" : "Featured Suggestions"}
                </h3>

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin stroke-[1.5] mb-4" />
                    <p className="font-sans text-sm tracking-wider uppercase">Searching collection...</p>
                  </div>
                )}

                {!isLoading && searchTerm && results && results.length === 0 && (
                  <div className="text-center py-20 bg-muted/20 border border-muted">
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider p-4">
                      We couldn't find any items matching "{searchTerm}".
                    </p>
                  </div>
                )}

                {!isLoading && (!results || results.length === 0) && !searchTerm && (
                  <p className="text-sm text-muted-foreground italic h-32 flex items-center">
                    Type above to discover matching apparel, accessories, and collections.
                  </p>
                )}

                {!isLoading && results && results.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {results.map((product: any) => {
                      const image = product.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000";
                      return (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={onClose}
                          className="flex gap-4 p-2 hover:bg-muted/30 transition-colors group border border-border/30"
                        >
                          <div className="w-16 aspect-[3/4] bg-muted overflow-hidden flex-shrink-0">
                            <img
                              src={image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-col justify-center gap-1">
                            <h4 className="text-sm font-medium tracking-wide line-clamp-2 uppercase text-neutral-900">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">₹{product.price}</span>
                              {product.compare_at_price && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ₹{product.compare_at_price}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
