'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { subscribeWebsiteReviews } from '@/lib/firestore';
import ReviewModal from '@/components/reviews/ReviewModal';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeWebsiteReviews((data) => {
      setReviews(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-bg overflow-hidden relative">
        <div className="container py-12 relative z-10 max-w-5xl">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-4xl md:text-5xl font-normal text-text-primary tracking-tight mb-4">
                Community Reviews
              </h1>
              <p className="text-muted font-body text-lg max-w-2xl">
                See what other stargazers are saying about Astroneo, or share your own thoughts and feedback.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-surface/50 border border-stroke rounded-2xl p-4 flex items-center justify-between gap-6"
            >
              <div className="text-center px-4">
                <div className="font-display text-3xl text-accent mb-1">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                    : '-'}
                </div>
                <div className="text-xs text-muted font-body uppercase tracking-widest">Avg Rating</div>
              </div>
              <div className="w-[1px] h-12 bg-stroke"></div>
              <div className="pr-4">
                <ReviewModal />
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin-slow" />
            </div>
          ) : reviews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="liquid-glass rounded-2xl p-16 text-center"
            >
              <Star size={48} className="mx-auto text-muted/30 mb-4" />
              <h3 className="font-display text-2xl text-text-primary mb-2">No Reviews Yet</h3>
              <p className="text-muted font-body mb-6">Be the first to share your thoughts about Astroneo!</p>
              <ReviewModal />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="liquid-glass rounded-2xl p-6 relative group"
                >
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? 'fill-accent text-accent' : 'text-muted/30'}
                      />
                    ))}
                  </div>
                  <p className="text-text-primary/80 font-body text-sm leading-relaxed mb-6 flex-grow min-h-[80px]">
                    "{review.review}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-stroke/50">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface border border-stroke flex items-center justify-center text-xs font-medium text-muted">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">{review.userName}</p>
                      {review.createdAt && (
                        <p className="text-xs text-muted font-body">
                          {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
