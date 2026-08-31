import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getAllArticles } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Space Science & Stargazing Blog | Astroneo',
  description: 'Read the latest astronomy guides, telescope reviews, deep space discoveries, and educational articles about the cosmos on Astroneo.',
  alternates: {
    canonical: 'https://astroneo.space/blog',
  },
  openGraph: {
    title: 'Space Science & Stargazing Blog | Astroneo',
    description: 'Read the latest astronomy guides, telescope reviews, deep space discoveries, and educational articles about the cosmos on Astroneo.',
    url: 'https://astroneo.space/blog',
  },
};

export default async function BlogListPage() {
  const articles = await getAllArticles();

  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const regularArticles = articles.filter(a => a.slug !== featuredArticle?.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Astroneo Space Blog',
    description: 'Detailed guides and articles about space exploration, stars, black holes, and stargazing equipment.',
    url: 'https://astroneo.space/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Astroneo',
      logo: {
        '@type': 'ImageObject',
        url: 'https://astroneo.space/icon-192.png'
      }
    },
    blogPost: articles.map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      datePublished: a.date,
      description: a.excerpt,
      url: `https://astroneo.space/blog/${a.slug}`
    }))
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pt-32 pb-24 min-h-screen bg-bg relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent-gradient opacity-[0.03] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent-gradient opacity-[0.03] blur-[100px] pointer-events-none" />

        <div className="container max-w-6xl relative z-10">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h1 className="font-display text-4xl md:text-6xl text-text-primary tracking-tight mb-4 leading-tight">
              Astroneo <span className="text-accent bg-clip-text bg-gradient-to-r from-accent via-white/80 to-accent text-transparent">Blog</span>
            </h1>
            <p className="text-muted font-body text-base md:text-lg">
              Explore educational guides, research summaries, and practical telescope tutorials curated by astronomy enthusiasts.
            </p>
          </div>

          {/* Featured Post */}
          {featuredArticle && (
            <div className="mb-16">
              <div className="liquid-glass p-1.5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/20">
                <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-8 items-center rounded-[22px] overflow-hidden bg-black/40">
                  <div className="relative aspect-[16/10] w-full overflow-hidden group">
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-accent/20 border border-accent/40 text-accent backdrop-blur-md">
                        Featured · {featuredArticle.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 lg:p-10 pr-6 lg:pr-12 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-xs text-muted mb-4 font-body">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {featuredArticle.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {featuredArticle.readTime}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary tracking-tight mb-4 hover:text-accent transition-colors">
                      <Link href={`/blog/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h2>
                    <p className="text-muted font-body text-sm md:text-base leading-relaxed mb-6">
                      {featuredArticle.excerpt}
                    </p>
                    <Link
                      href={`/blog/${featuredArticle.slug}`}
                      className="group/btn inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-accent transition-colors w-fit"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <div 
                key={article.slug}
                className="liquid-glass p-1.5 rounded-3xl border border-white/10 overflow-hidden shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-300 flex flex-col hover:scale-[1.02]"
              >
                <div className="rounded-[22px] overflow-hidden bg-black/40 flex-1 flex flex-col">
                  <div className="relative aspect-[16/10] w-full overflow-hidden group">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-[9px] font-semibold tracking-wider uppercase bg-white/10 border border-white/20 text-text-primary backdrop-blur-md">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[11px] text-muted mb-3 font-body">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {article.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-text-primary tracking-tight mb-3 hover:text-accent transition-colors leading-snug">
                      <Link href={`/blog/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-muted font-body text-xs md:text-sm leading-relaxed mb-6 flex-1">
                      {article.excerpt}
                    </p>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="group/btn inline-flex items-center gap-1.5 text-xs font-semibold text-text-primary hover:text-accent transition-colors w-fit mt-auto"
                    >
                      <span>Read Article</span>
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
