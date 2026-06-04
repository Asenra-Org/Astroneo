'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type Blog = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  image?: string;
};

const categoryColors: Record<string, string> = {
  'Deep Dives': '#89AACC',
  'Guides': '#4E85BF',
  'Education': '#9BA5B5',
  'Lists': '#C2D1DF',
  'Equipment': '#6E8B99',
  'Space Exploration': '#A594F9',
  'History': '#E5D9B6',
};

export default function BlogPage() {
  const [articles, setArticles] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/blogs.json')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load blogs', err);
        setLoading(false);
      });
  }, []);

  const featured = articles.find(a => a.featured) || articles[0];
  const rest = articles.filter(a => a !== featured);

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

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {/* Featured article */}
              {featured && (
                <motion.div variants={item} className="mb-8">
                  <Link href={`/blog/${featured.slug}`} className="block group">
                    <div className="liquid-glass rounded-3xl p-8 md:p-12 relative overflow-hidden transition-colors duration-500 group-hover:bg-bg/70">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-accent-gradient opacity-80" />
                      
                      {featured.image && (
                        <div className="w-full h-64 md:h-80 relative mb-8 rounded-xl overflow-hidden shadow-lg border border-stroke/20">
                           <Image src={featured.image} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                           <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent opacity-80 pointer-events-none" />
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-6">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-body font-medium"
                          style={{ 
                            backgroundColor: `${categoryColors[featured.category] || '#9BA5B5'}15`,
                            color: categoryColors[featured.category] || '#9BA5B5',
                            border: `1px solid ${categoryColors[featured.category] || '#9BA5B5'}30`
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
              )}

              {/* Rest of articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article) => (
                  <motion.div variants={item} key={article.slug}>
                    <Link href={`/blog/${article.slug}`} className="block group h-full">
                      <div className="liquid-glass rounded-3xl p-6 md:p-8 h-full flex flex-col transition-colors duration-500 group-hover:bg-bg/70">
                        {article.image && (
                          <div className="w-full h-48 relative mb-6 rounded-xl overflow-hidden shadow-md border border-stroke/20">
                            <Image src={article.image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent opacity-50 pointer-events-none" />
                          </div>
                        )}
                        <div className="mb-5">
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-xs font-body font-medium"
                            style={{ 
                              backgroundColor: `${categoryColors[article.category] || '#9BA5B5'}15`,
                              color: categoryColors[article.category] || '#9BA5B5',
                              border: `1px solid ${categoryColors[article.category] || '#9BA5B5'}30`
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
