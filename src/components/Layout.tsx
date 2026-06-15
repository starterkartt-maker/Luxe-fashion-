import { useState } from "react";
import { Link } from "react-router";
import { Search, ShoppingBag, Heart, User, Menu, X, LayoutGrid } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SearchModal } from "./SearchModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['navbar_categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    }
  });

  const { data: collections } = useQuery({
    queryKey: ['navbar_collections'],
    queryFn: async () => {
      const { data } = await supabase.from('collections').select('*').eq('active', true);
      return data || [];
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Nav (Desktop & Tablet) */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="md:hidden" aria-label="Menu" onClick={() => setIsMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="text-xl font-editorial font-bold tracking-widest uppercase">
              Luxe Fashion
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
              <Link to="/shop" className="hover:text-black/70 transition-colors">Shop All</Link>
              
              {/* Dynamic Categories */}
              {categories && categories.map((cat: any) => (
                <Link 
                  key={cat.id} 
                  to={`/categories/${cat.id}`} 
                  className="hover:text-black/70 transition-colors truncate max-w-[120px]"
                >
                  {cat.name}
                </Link>
              ))}

              {/* Dynamic Collections */}
              {collections && collections.map((col: any) => (
                <Link 
                  key={col.id} 
                  to={`/collections/${col.id}`} 
                  className="hover:text-black/70 transition-colors truncate max-w-[150px] font-semibold border-l border-neutral-300 pl-3"
                >
                  {col.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop Search Bar Trigger */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setIsSearchOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsSearchOpen(true); } }}
              className="hidden md:flex items-center gap-2 border border-border bg-neutral-50 hover:bg-neutral-100/70 transition-all px-3.5 py-2 w-44 lg:w-64 cursor-pointer select-none text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4 stroke-[1.5]" />
              <span className="text-xs uppercase tracking-widest font-sans">Search collection...</span>
            </div>

            {/* Mobile Search Icon */}
            <button 
              aria-label="Search" 
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-1"
            >
              <Search className="w-5 h-5 font-light cursor-pointer hover:opacity-70 transition-opacity" />
            </button>

            <Link to="/profile" className="hidden md:block">
              <User className="w-5 h-5 font-light hover:opacity-70 transition-opacity" />
            </Link>
            <Link to="/wishlist" className="hidden md:block">
              <Heart className="w-5 h-5 font-light hover:opacity-70 transition-opacity" />
            </Link>
            <Link to="/cart" className="hidden md:block relative">
              <ShoppingBag className="w-5 h-5 font-light hover:opacity-70 transition-opacity" />
            </Link>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <span className="text-xl font-editorial font-bold tracking-widest uppercase">
              Luxe Fashion
            </span>
            <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col p-6 space-y-6 text-lg font-medium overflow-y-auto max-h-[70vh]">
            <Link to="/" className="hover:text-black/70" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/shop" className="hover:text-black/70" onClick={() => setIsMenuOpen(false)}>Shop All</Link>
            
            {/* Dynamic Categories in Mobile Menu */}
            {categories && categories.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2 pl-2 border-l border-neutral-200">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Categories</span>
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.id} 
                    to={`/categories/${cat.id}`} 
                    className="hover:text-black/70 text-base" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Dynamic Collections in Mobile Menu */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2 pl-2 border-l border-neutral-200">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Collections</span>
                {collections.map((col: any) => (
                  <Link 
                    key={col.id} 
                    to={`/collections/${col.id}`} 
                    className="hover:text-black/70 text-base font-semibold" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {col.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t py-2 px-6 flex items-center justify-between">
        <Link to="/" className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Home
        </Link>
        <Link to="/shop" className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <LayoutGrid className="w-5 h-5" />
          Shop
        </Link>
        <Link to="/wishlist" className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <Heart className="w-5 h-5" />
          Wishlist
        </Link>
        <Link to="/cart" className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <ShoppingBag className="w-5 h-5" />
          Cart
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <User className="w-5 h-5" />
          Profile
        </Link>
      </nav>
    </div>
  );
}

import { Outlet } from "react-router";
