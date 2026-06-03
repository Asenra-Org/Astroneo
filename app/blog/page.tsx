'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    slug: 'betelgeuse-star',
    title: 'What is Betelgeuse? The Star That Might Explode',
    excerpt: 'Betelgeuse is one of the most famous stars in the night sky. A red supergiant 700 times larger than our Sun, it could go supernova within the next million years.',
    date: '2025-05-15',
    readTime: '8 min read',
    category: 'Deep Dives',
    featured: true,
  },
  {
    slug: 'stars-visible-india',
    title: '10 Stars Visible from India Tonight',
    excerpt: "India's dark skies offer incredible stargazing opportunities. Here are the 10 brightest and most interesting stars you can spot with the naked eye from the Indian subcontinent.",
    date: '2025-05-10',
    readTime: '6 min read',
    category: 'Guides',
    featured: false,
  },
  {
    slug: 'spectral-classification',
    title: 'How to Read Spectral Classification',
    excerpt: 'OBAFGKM — the sequence that tells you everything about a star. Learn how astronomers classify stars by their light and what each letter really means.',
    date: '2025-05-05',
    readTime: '10 min read',
    category: 'Education',
    featured: false,
  },
  {
    slug: 'brightest-stars',
    title: 'The 20 Brightest Stars in the Night Sky',
    excerpt: "From Sirius to Denebola, we rank the 20 brightest stars visible to the naked eye, with facts, distances, and how to find them in your night sky.",
    date: '2025-04-28',
    readTime: '12 min read',
    category: 'Lists',
    featured: false,
  },
  {
    slug: 'telescope-guide-2025',
    title: 'Beginner Telescope Guide 2025',
    excerpt: 'Thinking about buying your first telescope? We break down the best options for beginners, from refractors to reflectors, with specific product recommendations.',
    date: '2025-04-20',
    readTime: '15 min read',
    category: 'Equipment',
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  'Deep Dives': '#89AACC',
  'Guides': '#4E85BF',
  'Education': '#9BA5B5',
  'Lists': '#C2D1DF',
  'Equipment': '#6E8B99',
};

export default function BlogPage() {
  const featured = articles.find(a => a.featured)!;
  const rest = articles.filter(a => !a.featured);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-bg">
        <div className="container py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="font-display text-5xl md:text-6xl text-text-primary tracking-tight mb-3">
              Space <em className="italic text-text-primary/70">Blog</em>
            </h1>
            <p className="font-body text-muted">
              Astronomy articles, star guides, and space science
            </p>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show">
            {/* Featured article */}
            <motion.div variants={item} className="mb-8">
              <Link href={`/blog/${featured.slug}`} className="block group">
                <div className="liquid-glass rounded-3xl p-8 md:p-12 relative overflow-hidden transition-colors duration-500 group-hover:bg-bg/70">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-accent-gradient opacity-80" />
                  
                  <div className="flex items-center gap-3 mb-6">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-body font-medium"
                      style={{ 
                        backgroundColor: `${categoryColors[featured.category]}15`,
                        color: categoryColors[featured.category],
                        border: `1px solid ${categoryColors[featured.category]}30`
                      }}
                    >
                      {featured.category}
                    </span>
                    <span className="text-xs text-muted font-body uppercase tracking-widest">Featured</span>
                  </div>
                  
                  <h2 className="font-display text-3xl md:text-5xl text-text-primary tracking-tight mb-6 group-hover:text-white transition-colors">
                    {featured.title}
                  </h2>
                  
                  <p className="font-body text-muted md:text-lg leading-relaxed max-w-3xl mb-8">
                    {featured.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 border-t border-stroke/50 pt-6">
                    <span className="text-sm text-muted font-body">{featured.date}</span>
                    <span className="text-sm text-muted font-body">·</span>
                    <span className="text-sm text-muted font-body">{featured.readTime}</span>
                    <span className="ml-auto flex items-center gap-2 text-sm text-text-primary font-body group-hover:text-white transition-colors">
                      Read article <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Rest of articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article) => (
                <motion.div variants={item} key={article.slug}>
                  <Link href={`/blog/${article.slug}`} className="block group h-full">
                    <div className="liquid-glass rounded-3xl p-8 h-full flex flex-col transition-colors duration-500 group-hover:bg-bg/70">
                      <div className="mb-5">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-body font-medium"
                          style={{ 
                            backgroundColor: `${categoryColors[article.category]}15`,
                            color: categoryColors[article.category],
                            border: `1px solid ${categoryColors[article.category]}30`
                          }}
                        >
                          {article.category}
                        </span>
                      </div>
                      
                      <h3 className="font-display text-2xl text-text-primary tracking-tight mb-4 group-hover:text-white transition-colors">
                        {article.title}
                      </h3>
                      
                      <p className="font-body text-sm text-muted leading-relaxed mb-8 flex-grow">
                        {article.excerpt.slice(0, 120)}...
                      </p>
                      
                      <div className="flex items-center gap-3 border-t border-stroke/50 pt-5 mt-auto">
                        <span className="text-xs text-muted font-body">{article.date}</span>
                        <span className="text-xs text-muted font-body">· {article.readTime}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
