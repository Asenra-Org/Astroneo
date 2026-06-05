'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addWebsiteReview } from '@/lib/firestore';
import { MessageSquarePlus, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    setLoading(true);
    try {
      await addWebsiteReview({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL,
        rating,
        review,
      });
      toast.success('Thank you for your feedback!');
      setIsOpen(false);
      setReview('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-body text-muted hover:text-accent transition-colors"
      >
        <MessageSquarePlus size={16} />
        <span>Leave a Review</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-stroke rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="font-display text-2xl text-text-primary mb-2">
                Rate Astroneo
              </h2>
              <p className="text-muted font-body text-sm mb-6">
                Let us know what you think about the platform and how we can improve.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-body text-text-primary mb-2 text-center">
                    Rating
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
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
                  <label htmlFor="review" className="block text-sm font-body text-text-primary mb-1">
                    Your Review
                  </label>
                  <textarea
                    id="review"
                    rows={4}
                    placeholder="What do you love? What could be better?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-lg px-4 py-2.5 text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors font-body text-sm custom-scrollbar resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-full font-body text-sm text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !user}
                    className="px-6 py-2 rounded-full bg-accent text-bg font-body text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
                
                {!user && (
                  <p className="text-center text-xs text-accent mt-2 font-body">
                    You must be signed in to submit a review.
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
