import { BookOpen, Clock, Eye, MapPin, CalendarDays } from 'lucide-react';
import type { StarArticle } from '@/lib/starArticles';
import { readingMinutes } from '@/lib/starArticles';

interface StarArticleBodyProps {
  article: StarArticle;
  objectName: string;
}

/**
 * Renders the long-form editorial content for a curated celestial object: the
 * narrative sections, practical observing notes, and the sources every factual
 * claim can be checked against.
 */
export default function StarArticleBody({ article, objectName }: StarArticleBodyProps) {
  const minutes = readingMinutes(article);
  const reviewed = new Date(article.reviewed).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section
      className="mt-20 border-t border-stroke pt-12"
      aria-labelledby="about-heading"
    >
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-xs text-muted font-body uppercase tracking-widest">
          <span className="inline-flex items-center gap-2">
            <BookOpen size={13} aria-hidden="true" />
            In depth
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock size={13} aria-hidden="true" />
            {minutes} min read
          </span>
          <span className="inline-flex items-center gap-2 normal-case tracking-normal">
            <CalendarDays size={13} aria-hidden="true" />
            Facts last checked {reviewed}
          </span>
        </div>

        <h2
          id="about-heading"
          className="font-display text-3xl md:text-4xl text-text-primary tracking-tight mb-5"
        >
          About {objectName}
        </h2>

        <p className="font-body text-lg text-text-primary/90 leading-relaxed mb-12">
          {article.summary}
        </p>

        {article.sections.map((section) => (
          <div key={section.heading} className="mb-11">
            <h3 className="font-display text-2xl text-text-primary mb-4">{section.heading}</h3>
            {section.body.split('\n\n').map((paragraph, i) => (
              <p key={i} className="font-body text-muted leading-[1.8] mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        ))}

        {article.observing && (
          <div className="liquid-glass rounded-3xl p-7 md:p-8 mb-12">
            <h3 className="font-display text-2xl text-text-primary mb-6">
              How to see it yourself
            </h3>
            <dl className="space-y-5">
              <div className="flex gap-4">
                <CalendarDays size={17} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted font-body uppercase tracking-widest mb-1">
                    Best time of year
                  </dt>
                  <dd className="font-body text-text-primary/90 leading-relaxed">
                    {article.observing.bestMonths}
                  </dd>
                </div>
              </div>
              <div className="flex gap-4">
                <Eye size={17} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted font-body uppercase tracking-widest mb-1">
                    Equipment needed
                  </dt>
                  <dd className="font-body text-text-primary/90 leading-relaxed">
                    {article.observing.difficulty}
                  </dd>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin size={17} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted font-body uppercase tracking-widest mb-1">
                    Finding it
                  </dt>
                  <dd className="font-body text-text-primary/90 leading-relaxed">
                    {article.observing.howToFind}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        )}

        <div className="border-t border-stroke pt-7">
          <h3 className="text-xs text-muted font-body uppercase tracking-widest mb-4">
            Sources
          </h3>
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
        </div>
      </div>
    </section>
  );
}
