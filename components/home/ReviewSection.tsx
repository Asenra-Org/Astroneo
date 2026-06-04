'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeWebsiteReviews, addWebsiteReview } from '@/lib/firestore';
import { Star, MessageSquarePlus, UserCircle2, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWebsiteReviews((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addWebsiteReview({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL,
        rating,
        review: reviewText.trim(),
      });
      toast.success('Thank you for your feedback!');
      setReviewText('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#FF6B6B]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-text-primary mb-4 tracking-tight">
            Community Voices
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto font-body">
            Join the conversation. Share your thoughts on AstroLens and see what other stargazers are saying.
          </p>
        </div>

        {/* Review Submission Form */}
        <div className="max-w-2xl mx-auto mb-20 liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent/20 p-2.5 rounded-full text-accent">
              <MessageSquarePlus size={24} />
            </div>
            <h3 className="font-display text-2xl text-text-primary">Leave a Review</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-body text-text-primary mb-3">
                How would you rate your experience?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        rating >= star ? 'fill-accent text-accent' : 'text-muted/30'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="reviewText" className="block text-sm font-body text-text-primary mb-2">
                Your thoughts
              </label>
              <textarea
                id="reviewText"
                rows={4}
                placeholder="What do you love? What could be improved?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-body text-sm custom-scrollbar resize-none"
                disabled={!user || isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {!user ? (
                <p className="text-sm text-[#FF6B6B] font-body flex items-center gap-2">
                  <UserCircle2 size={16} />
                  Please sign in to share your thoughts
                </p>
              ) : (
                <p className="text-sm text-accent font-body">
                  Posting as {user.displayName || 'Anonymous'}
                </p>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting || !user || !reviewText.trim()}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-accent-light text-background font-body text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,228,255,0.2)] hover:shadow-[0_0_30px_rgba(204,228,255,0.4)] flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Post Review
              </button>
            </div>
          </form>
        </div>

        {/* Reviews Feed */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-display text-2xl text-text-primary mb-8 border-b border-white/10 pb-4">
            Recent Reviews
          </h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-20 text-muted">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 liquid-glass rounded-2xl border border-white/5">
              <Star size={48} className="mx-auto text-muted/30 mb-4" />
              <p className="text-text-primary font-body">No reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {displayedReviews.map((rev: any, i: number) => (
                    <motion.div
                      key={rev.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="liquid-glass rounded-2xl p-6 border border-white/10 hover:border-accent/30 transition-colors flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {rev.userPhoto ? (
                          <img src={rev.userPhoto} alt={rev.userName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <UserCircle2 size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-body font-medium text-sm line-clamp-1">{rev.userName}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= (rev.rating || 5) ? 'fill-accent text-accent' : 'text-muted/30'}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted font-body text-sm leading-relaxed flex-1">
                        "{rev.review}"
                      </p>
                      {rev.createdAt && (
                        <p className="text-[10px] text-muted/50 font-body mt-4 uppercase tracking-wider">
                          {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString() : 'Recently'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {reviews.length > 3 && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-muted hover:text-text-primary hover:border-white/30 transition-all font-body text-sm bg-white/5"
                  >
                    {showAll ? 'Show Less' : `See All Reviews (${reviews.length})`}
                    <ChevronDown size={16} className={`transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
