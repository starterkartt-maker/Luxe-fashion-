import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Star, MessageSquare, ShieldCheck, CornerDownRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        throw error;
      }
      return data || [];
    }
  });

  // 2. Check if the user has purchased this product
  const { data: hasPurchased = false, isLoading: isPurchaseChecking } = useQuery({
    queryKey: ['user-purchase-check', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Get all order IDs for user
      const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id);

      if (ordErr || !orders || orders.length === 0) return false;

      const orderIds = orders.map(o => o.id);

      // Check if any of these orders contains this product
      const { data: items, error: itemErr } = await supabase
        .from('order_items')
        .select('id')
        .in('order_id', orderIds)
        .eq('product_id', productId)
        .limit(1);

      if (itemErr) {
        console.error("Purchase check error:", itemErr);
        return false;
      }

      return items && items.length > 0;
    },
    enabled: !!user && !!productId
  });

  // 3. Submit a review
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please log in to leave a review.");
      if (!reviewText.trim()) throw new Error("Please share some feedback.");

      const payload = {
        user_id: user.id,
        product_id: productId,
        rating,
        review_text: reviewText.trim(),
        verified_purchase: hasPurchased
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setSuccessMsg("Thank you! Your review has been published.");
      setReviewText("");
      setRating(5);
      setErrorMsg(null);
      // Invalidate both product and reviews queries so metrics & list refresh
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Something went wrong. Please check your network and retry.");
    }
  });

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const starBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews ? reviews.filter((r: any) => r.rating === stars).length : 0;
    const percentage = reviews && reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div id="product-reviews-section" className="border-t border-neutral-200 pt-16 mt-16">
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* Stats Summary */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-editorial font-medium text-neutral-900 mb-1">Customer Reviews</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Feedback from the Luxe Community</p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/60 p-6 space-y-5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-editorial font-semibold text-neutral-950">
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
              </span>
              <span className="text-sm text-neutral-500 font-medium">out of 5 stars</span>
            </div>

            {/* General Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn(
                    "w-4 h-4", 
                    star <= Math.round(averageRating) ? "fill-neutral-900 text-neutral-900" : "text-neutral-300"
                  )} 
                />
              ))}
              <span className="text-xs text-neutral-500 ml-2">
                ({reviews?.length || 0} customer {reviews?.length === 1 ? 'rating' : 'ratings'})
              </span>
            </div>

            {/* Breakdown progress bars */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-200/50">
              {starBreakdown.map((row) => (
                <div key={row.stars} className="flex items-center text-xs text-neutral-600 gap-3">
                  <span className="w-10 font-medium text-right flex items-center justify-end gap-1">
                    {row.stars} <Star className="w-3 h-3 fill-neutral-500 text-neutral-500" />
                  </span>
                  <div className="flex-1 h-2 bg-neutral-200 overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 transition-all duration-500" 
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-neutral-400 text-right">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List & Submission */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Write a Review Drawer/Box */}
          <div className="border border-neutral-200 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-editorial text-lg font-medium text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-500" /> Write a Review
              </h4>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" /> Community Feedback
              </span>
            </div>

            {!user ? (
              <div className="bg-neutral-50/80 border p-5 text-center space-y-3">
                <p className="text-sm text-neutral-600">Please sign in with your Luxe account to write a review of this silhouette.</p>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="rounded-none uppercase tracking-wider text-xs border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Authenticate
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submitReviewMutation.mutate(); }} className="space-y-4">
                
                {/* Star rating input */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest font-semibold text-neutral-500">Your Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 -ml-1 transition-transform active:scale-95 focus:outline-none"
                      >
                        <Star 
                          className={cn(
                            "w-7 h-7 transition-colors",
                            star <= (hoverRating ?? rating) 
                              ? "fill-neutral-950 text-neutral-950" 
                              : "text-neutral-300 hover:text-neutral-500"
                          )} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-neutral-400 ml-2">
                      ({rating}/5 stars)
                    </span>
                  </div>
                </div>

                {/* Review text */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest font-semibold text-neutral-500">Feedback Description</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={1000}
                    placeholder="Describe how the silhouette fits, fabric tactility, and overall design craftsmanship..."
                    className="w-full text-sm border border-neutral-300 p-4 focus:outline-none focus:border-neutral-900 transition-colors placeholder:text-neutral-400"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Be helpful, honest, and detailed.</span>
                    <span>{reviewText.length}/1000 chars</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitReviewMutation.isPending}
                    className="rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs px-6 py-5 h-auto"
                  >
                    {submitReviewMutation.isPending ? "Submitting Review..." : "Publish Review"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <h4 className="font-editorial text-lg font-medium border-b border-neutral-200 pb-3 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-neutral-500" /> Customer Comments ({reviews?.length || 0})
            </h4>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse space-y-3 pb-6 border-b">
                    <div className="flex justify-between">
                      <div className="h-4 bg-neutral-200 w-1/4" />
                      <div className="h-4 bg-neutral-200 w-1/6" />
                    </div>
                    <div className="h-3 bg-neutral-200 w-full" />
                    <div className="h-3 bg-neutral-200 w-2/3" />
                  </div>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {reviews.map((rev: any) => {
                  const reviewerName = rev.profiles?.full_name?.trim() || "Anonymous Luxe Customer";
                  const dateStr = rev.created_at 
                    ? new Date(rev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : "Recently";

                  return (
                    <div key={rev.id} className="py-6 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        {/* Name & Stars */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-semibold text-neutral-900">{reviewerName}</span>
                            {rev.verified_purchase && (
                              <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 tracking-wider inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified Purchase
                              </span>
                            )}
                          </div>
                          
                          {/* Stars */}
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={cn(
                                  "w-3.5 h-3.5",
                                  star <= rev.rating ? "fill-neutral-950 text-neutral-950" : "text-neutral-200"
                                )} 
                              />
                            ))}
                          </div>
                        </div>

                        {/* Date */}
                        <span className="text-[11px] font-mono text-neutral-400 sm:text-right">{dateStr}</span>
                      </div>

                      {/* Content */}
                      <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{rev.review_text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-neutral-50/50 border border-dashed text-neutral-500 rounded-none">
                <p className="text-sm">No reviews posted yet for this piece.</p>
                <p className="text-xs text-neutral-400 mt-1">Be the first customer to share your thoughts!</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
