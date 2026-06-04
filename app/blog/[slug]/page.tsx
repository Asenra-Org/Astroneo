import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs/promises';
import path from 'path';

type Blog = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  content: string;
  image?: string;
};

async function getBlogs(): Promise<Blog[]> {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'blogs.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading blogs data:', error);
    return [];
  }
}

export async function generateStaticParams() {
  const articles = await getBlogs();
  return articles.map(article => ({ slug: article.slug }));
}

import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const articles = await getBlogs();
  const article = articles.find(a => a.slug === slug);
  if (!article) return { title: 'Article Not Found' };
  
  return {
    title: `${article.title} | AstroLens Blog`,
    description: article.content ? article.content.slice(0, 160).replace(/[#*\n]/g, ' ').trim() : article.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articles = await getBlogs();
  const article = articles.find(a => a.slug === slug);
  
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-bg">
        <div className="container py-12 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-10 text-sm font-body text-muted">
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            <span>›</span>
            <Link href="/blog" className="hover:text-text-primary transition-colors">Blog</Link>
            <span>›</span>
            <span className="text-text-primary truncate">{article.title}</span>
          </nav>

          {/* Article header */}
          <div className="mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-body font-medium bg-accent/10 border border-accent/20 text-accent mb-6 uppercase tracking-widest">
              {article.category}
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted font-body mb-8">
              <span>AstroLens Blog</span>
              <span>·</span>
              <span>{article.date}</span>
              <span>·</span>
              <span>{article.readTime}</span>
            </div>
            
            {article.image && (
              <div className="w-full h-[40vh] md:h-[50vh] min-h-[300px] relative rounded-3xl overflow-hidden shadow-2xl border border-stroke/30">
                 <Image src={article.image} alt={article.title} fill className="object-cover" priority />
                 <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent pointer-events-none" />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-stroke/50 mb-12" />

          {/* Article content */}
          <article className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ node, ...props }) => <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mt-12 mb-6 tracking-tight" {...props} />,
                h3: ({ node, ...props }) => <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary mt-8 mb-4 tracking-tight" {...props} />,
                p: ({ node, ...props }) => <p className="text-muted font-body text-base md:text-lg leading-relaxed mb-6" {...props} />,
                strong: ({ node, ...props }) => <strong className="text-text-primary font-semibold" {...props} />,
                em: ({ node, ...props }) => <em className="text-text-primary/90 italic" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 mb-6 text-muted font-body text-base md:text-lg leading-relaxed space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-6 text-muted font-body text-base md:text-lg leading-relaxed space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="" {...props} />,
                a: ({ node, ...props }) => <a className="text-accent hover:text-white transition-colors underline underline-offset-4" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-accent/50 pl-6 py-1 my-8 text-text-primary/80 italic font-body text-lg md:text-xl" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="w-full overflow-x-auto my-8 rounded-xl border border-stroke/50 bg-bg/50 backdrop-blur-sm">
                    <table className="w-full text-left text-sm md:text-base font-body border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-stroke/30 text-text-primary font-semibold border-b border-stroke/50" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-stroke/30 text-muted" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-stroke/10 transition-colors" {...props} />,
                th: ({ node, ...props }) => <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap" {...props} />,
                td: ({ node, ...props }) => <td className="px-4 py-3 md:px-6 md:py-4" {...props} />,
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Back link */}
          <div className="mt-20 pt-8 border-t border-stroke/50">
            <Link href="/blog" className="inline-flex items-center gap-2 text-accent hover:text-white transition-colors font-body text-sm">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
