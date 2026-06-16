import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface BlogArticle {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  excerpt: string;
  content: string;
  image: string;
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const articles: BlogArticle[] = JSON.parse(raw);
    return articles.map((art) => ({
      slug: art.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for blogs:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let article: BlogArticle | null = null;
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const articles: BlogArticle[] = JSON.parse(raw);
    article = articles.find(a => a.slug === slug) || null;
  } catch (error) {
    console.error('Error generating metadata for blog:', error);
  }

  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} | Astroneo Blog`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — Astroneo Blog`,
      description: article.excerpt,
      url: `https://astroneo.space/blog/${slug}`,
      images: [
        {
          url: `https://astroneo.space${article.image}`,
        }
      ]
    },
    alternates: {
      canonical: `https://astroneo.space/blog/${slug}`,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: BlogArticle | null = null;

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const articles: BlogArticle[] = JSON.parse(raw);
    article = articles.find(a => a.slug === slug) || null;
  } catch (error) {
    console.error('Error reading blog posts data:', error);
  }

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: `https://astroneo.space${article.image}`,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Person',
      name: 'Karan Patil',
      url: 'https://astroneo.space/star/karan-patil',
      jobTitle: 'Founder-Class Engineer',
      worksFor: {
        '@type': 'Organization',
        name: 'Asenra'
      }
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astroneo',
      logo: {
        '@type': 'ImageObject',
        url: 'https://astroneo.space/icon-192.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://astroneo.space/blog/${slug}`
    }
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pt-32 pb-24 min-h-screen bg-bg relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent-gradient opacity-[0.02] blur-[100px] pointer-events-none" />

        <div className="container max-w-4xl relative z-10">
          {/* Back button */}
          <div className="mb-8">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-muted hover:text-text-primary transition-colors text-sm font-body w-max"
            >
              <ArrowLeft size={16} />
              <span>Back to Blog</span>
            </Link>
          </div>

          {/* Article Header */}
          <article className="space-y-8">
            <header className="space-y-4">
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-accent/20 border border-accent/40 text-accent backdrop-blur-md w-fit inline-block">
                {article.category}
              </span>
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-text-primary tracking-tight leading-tight">
                {article.title}
              </h1>

              {/* Author & Meta Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs md:text-sm text-muted font-body border-y border-white/5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stroke flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    <User size={13} className="text-white/60" />
                  </div>
                  <span>
                    By <Link href="/star/karan-patil" className="text-text-primary font-medium hover:underline">Karan Patil</Link> (Founder-Class Engineer)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Last updated: {article.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* GEO TL;DR Summary Box */}
            <div className="liquid-glass p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.02] shadow-lg">
              <h4 className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">TL;DR Summary</h4>
              <p className="text-text-primary/95 text-sm md:text-base leading-relaxed italic font-body">
                {article.excerpt}
              </p>
            </div>

            {/* Content Body */}
            <div className="font-body text-text-primary/90 leading-relaxed text-base md:text-lg max-w-none pt-4">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({node, ...props}) => <h2 className="font-display text-2xl md:text-3xl text-text-primary tracking-tight mt-12 mb-6 border-b border-white/5 pb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="font-display text-xl md:text-2xl text-text-primary tracking-tight mt-8 mb-4" {...props} />,
                  p: ({node, ...props}) => <p className="mb-6 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent bg-white/[0.02] p-4 pl-6 rounded-r-2xl mb-6 italic" {...props} />,
                  code: ({node, ...props}) => <code className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono" {...props} />,
                  table: ({node, ...props}) => <div className="overflow-x-auto mb-8"><table className="w-full text-left border-collapse border border-white/10 rounded-xl overflow-hidden" {...props} /></div>,
                  thead: ({node, ...props}) => <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-muted font-semibold border-b border-white/10" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="divide-y divide-white/5" {...props} />,
                  th: ({node, ...props}) => <th className="p-4 font-semibold text-sm" {...props} />,
                  td: ({node, ...props}) => <td className="p-4 text-sm text-text-primary/80" {...props} />,
                  a: ({node, ...props}) => <a className="text-accent hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
