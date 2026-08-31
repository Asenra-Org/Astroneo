import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ArrowLeft, User, RefreshCw, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getAllArticles, getArticleBySlug, getRelatedArticles } from '@/lib/blog';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} | Astroneo`,
    description: article.excerpt,
    authors: [{ name: 'Karan Patil', url: 'https://astroneo.space/about#author' }],
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url: `https://astroneo.space/blog/${slug}`,
      publishedTime: article.date,
      modifiedTime: article.updated,
      authors: ['Karan Patil'],
      images: [{ url: `https://astroneo.space${article.image}` }],
    },
    alternates: {
      canonical: `https://astroneo.space/blog/${slug}`,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const related = await getRelatedArticles(article);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: `https://astroneo.space${article.image}`,
    datePublished: article.date,
    dateModified: article.updated,
    wordCount: article.wordCount,
    author: {
      '@type': 'Person',
      name: 'Karan Patil',
      url: 'https://astroneo.space/about#author',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Astroneo',
      logo: {
        '@type': 'ImageObject',
        url: 'https://astroneo.space/icon-192.png',
      },
    },
    citation: article.sources.map((source) => source.url),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://astroneo.space/blog/${slug}`,
    },
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="pt-32 pb-24 min-h-screen bg-bg relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent-gradient opacity-[0.02] blur-[100px] pointer-events-none" />

        <div className="container max-w-4xl relative z-10">
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-muted hover:text-text-primary transition-colors text-sm font-body w-max"
            >
              <ArrowLeft size={16} />
              <span>Back to Blog</span>
            </Link>
          </div>

          <article className="space-y-8">
            <header className="space-y-4">
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-accent/20 border border-accent/40 text-accent backdrop-blur-md w-fit inline-block">
                {article.category}
              </span>
              <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-text-primary tracking-tight leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs md:text-sm text-muted font-body border-y border-white/5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stroke flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    <User size={13} className="text-white/60" />
                  </div>
                  <span>
                    By{' '}
                    <Link
                      href="/about#author"
                      className="text-text-primary font-medium hover:underline"
                    >
                      Karan Patil
                    </Link>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} aria-hidden="true" />
                  <span>Published {formatDate(article.date)}</span>
                </div>
                {article.updated !== article.date && (
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={13} aria-hidden="true" />
                    <span>Updated {formatDate(article.updated)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock size={13} aria-hidden="true" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </header>

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

            <div className="liquid-glass p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.02] shadow-lg">
              <h2 className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
                In short
              </h2>
              <p className="text-text-primary/95 text-sm md:text-base leading-relaxed italic font-body">
                {article.excerpt}
              </p>
            </div>

            <div className="font-body text-text-primary/90 leading-relaxed text-base md:text-lg max-w-none pt-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: (props) => <h2 className="font-display text-2xl md:text-3xl text-text-primary tracking-tight mt-12 mb-6 border-b border-white/5 pb-2" {...props} />,
                  h3: (props) => <h3 className="font-display text-xl md:text-2xl text-text-primary tracking-tight mt-8 mb-4" {...props} />,
                  p: (props) => <p className="mb-6 leading-relaxed" {...props} />,
                  ul: (props) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                  ol: (props) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                  li: (props) => <li className="pl-1" {...props} />,
                  blockquote: (props) => <blockquote className="border-l-4 border-accent bg-white/[0.02] p-4 pl-6 rounded-r-2xl mb-6 italic" {...props} />,
                  code: (props) => <code className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono" {...props} />,
                  table: (props) => <div className="overflow-x-auto mb-8"><table className="w-full text-left border-collapse border border-white/10 rounded-xl overflow-hidden" {...props} /></div>,
                  thead: (props) => <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-muted font-semibold border-b border-white/10" {...props} />,
                  tbody: (props) => <tbody className="divide-y divide-white/5" {...props} />,
                  th: (props) => <th className="p-4 font-semibold text-sm" {...props} />,
                  td: (props) => <td className="p-4 text-sm text-text-primary/80" {...props} />,
                  a: ({ href, ...props }) => {
                    // Internal links stay in-tab and pass link equity; external ones don't.
                    const isInternal = typeof href === 'string' && href.startsWith('/');
                    return isInternal ? (
                      <Link href={href} className="text-accent hover:underline transition-colors" {...props} />
                    ) : (
                      <a
                        href={href}
                        className="text-accent hover:underline transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    );
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>

            {/* Sources — every factual claim above should be checkable. */}
            <section className="border-t border-stroke pt-8 mt-4" aria-labelledby="sources-heading">
              <h2
                id="sources-heading"
                className="text-xs text-muted font-body uppercase tracking-widest mb-4"
              >
                Sources and further reading
              </h2>
              <ul className="space-y-3">
                {article.sources.map((source) => (
                  <li key={source.url} className="font-body text-sm leading-relaxed">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-primary/90 hover:text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60 transition-colors"
                    >
                      {source.title}
                    </a>
                    <span className="text-muted"> — {source.publisher}</span>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          {related.length > 0 && (
            <section className="border-t border-stroke pt-10 mt-14" aria-labelledby="related-heading">
              <h2
                id="related-heading"
                className="font-display text-2xl text-text-primary mb-6"
              >
                Read next
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="liquid-glass rounded-2xl p-5 group hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-[10px] text-muted font-body uppercase tracking-widest">
                      {item.category}
                    </span>
                    <h3 className="font-display text-lg text-text-primary mt-2 mb-3 leading-snug">
                      {item.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted font-body group-hover:text-text-primary transition-colors">
                      {item.readTime}
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
