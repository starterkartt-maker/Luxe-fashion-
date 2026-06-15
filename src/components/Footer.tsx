import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  MapPin, 
  Phone,
  Sparkles
} from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['footer_categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    }
  });

  const { data: collections } = useQuery({
    queryKey: ['footer_collections'],
    queryFn: async () => {
      const { data } = await supabase.from('collections').select('*').eq('active', true);
      return data || [];
    }
  });

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail("");
    }, 900);
  };

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-900 font-sans">
      {/* Brand Perks Row */}
      <div className="border-b border-neutral-900 py-12 bg-neutral-950">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-100">
              <Truck className="w-6 h-6 stroke-[1.25]" />
            </div>
            <div>
              <h4 className="font-editorial text-lg text-neutral-100 mb-1">Complimentary Shipping</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enjoy free signature priority shipping on all international couture silhouettes.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-100">
              <RefreshCw className="w-6 h-6 stroke-[1.25]" />
            </div>
            <div>
              <h4 className="font-editorial text-lg text-neutral-100 mb-1">Bespoke Returns</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enjoy 30 days of hassle-free returns with our complimentary white-glove collection service.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-100">
              <ShieldCheck className="w-6 h-6 stroke-[1.25]" />
            </div>
            <div>
              <h4 className="font-editorial text-lg text-neutral-100 mb-1">Authenticity Guaranteed</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every silhouette from our atelier is certified authentic with an immutable product ledger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="text-2xl font-editorial font-bold tracking-widest text-neutral-50 uppercase flex items-center gap-2">
              Luxe Fashion
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              An international fashion house redefining luxury through architectural silhouettes, exquisite craftsmanship, and ethical sustainability. Designed for the elite modern wardrobe.
            </p>
            
            {/* Contact Details */}
            <div className="space-y-2 text-xs text-neutral-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-500" />
                <span>Atelier Rue de Rivoli, Paris, France</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-500" />
                <span>+33 (1) 40 20 50 50</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-500" />
                <span>concierge@luxefashion.com</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 pt-4">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center hover:bg-neutral-900 hover:text-neutral-100 transition-all text-neutral-400">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter/X" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center hover:bg-neutral-900 hover:text-neutral-100 transition-all text-neutral-400">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center hover:bg-neutral-900 hover:text-neutral-100 transition-all text-neutral-400">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center hover:bg-neutral-900 hover:text-neutral-100 transition-all text-neutral-400">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Group (Categories, Collections, Customer Service) */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Category column */}
            <div>
              <h5 className="font-editorial text-sm text-neutral-100 tracking-wider mb-6">Categories</h5>
              <ul className="space-y-3.5 text-sm text-neutral-400">
                <li>
                  <Link to="/shop" className="hover:text-neutral-100 transition-colors">Shop All</Link>
                </li>
                {categories && categories.map((cat: any) => (
                  <li key={cat.id}>
                    <Link to={`/categories/${cat.id}`} className="hover:text-neutral-100 transition-colors block truncate">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Collections column */}
            <div>
              <h5 className="font-editorial text-sm text-neutral-100 tracking-wider mb-6">Collections</h5>
              <ul className="space-y-3.5 text-sm text-neutral-400">
                {collections && collections.map((col: any) => (
                  <li key={col.id}>
                    <Link to={`/collections/${col.id}`} className="hover:text-neutral-100 transition-colors block truncate">
                      {col.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/wishlist" className="hover:text-neutral-100 transition-colors">Wishlist</Link>
                </li>
              </ul>
            </div>

            {/* Assistance column */}
            <div className="col-span-2 sm:col-span-1">
              <h5 className="font-editorial text-sm text-neutral-100 tracking-wider mb-6">Concierge</h5>
              <ul className="space-y-3.5 text-sm text-neutral-400">
                <li>
                  <Link to="/profile" className="hover:text-neutral-100 transition-colors">My Account</Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-neutral-100 transition-colors">Shopping Cart</Link>
                </li>
                <li>
                  <span className="block hover:text-neutral-100 transition-colors cursor-pointer" onClick={() => alert("Styling Concierge live support chat coming soon!")}>Virtual Stylist</span>
                </li>
                <li>
                  <span className="block hover:text-neutral-100 transition-colors cursor-pointer" onClick={() => alert("Luxe Care guides on authentic fabric preservation are available on request.")}>Silhouette Care</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter subscription */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border border-neutral-900 p-6 bg-neutral-950/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-neutral-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              
              <h5 className="font-editorial text-sm text-neutral-150 tracking-wider mb-2 flex items-center gap-1.5">
                The Luxe Circle
              </h5>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Be the first to receive invitation-only private collection previews, runway invitations, and digital capsule launches.
              </p>

              {subscribed ? (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <p className="text-xs font-semibold text-neutral-200">Welcome to the Inner Circle.</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    A confirmation of your private privileges has been dispatched.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative">
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your boutique email..."
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 py-3 pl-3 pr-10 text-neutral-150 rounded-none focus:outline-none focus:border-neutral-700 transition-colors placeholder-neutral-500"
                    />
                    <button 
                      type="submit" 
                      disabled={loading}
                      aria-label="Subscribe"
                      className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-neutral-400 hover:text-neutral-100"
                    >
                      {loading ? (
                        <div className="animate-spin w-3.5 h-3.5 border border-current border-t-transparent rounded-full" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <label className="text-[10px] text-neutral-500 leading-none block">
                    By joining, you agree to our privacy policy and boutique terms.
                  </label>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copy & Legal */}
      <div className="border-t border-neutral-900 bg-neutral-950 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-xs text-neutral-500">
              &copy; {new Date().getFullYear()} Luxe Fashion Inc. All Rights Reserved.
            </p>
            <p className="text-[10px] text-neutral-600">
              Designed & crafted for elite modern wardrobes. Curated in Paris, delivered worldwide.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-[11px] text-neutral-500">
            <span className="hover:text-neutral-300 cursor-pointer" onClick={() => alert("Privacy policy page is under boutique audit.")}>Privacy Policy</span>
            <span className="hover:text-neutral-300 cursor-pointer" onClick={() => alert("Accessibility notice: Luxe Fashion aims for WCAG full alignment.")}>Accessibility</span>
            <span className="hover:text-neutral-300 cursor-pointer" onClick={() => alert("Universal catalog sizing instructions are available.")}>Sizing Guide</span>
          </div>
        </div>
      </div>

      {/* Spacing for mobile nav bottom layout */}
      <div className="h-16 md:hidden bg-neutral-950" />
    </footer>
  );
}
