import Link from 'next/link';

/**
 * Homepage explainer.
 *
 * This replaced a block written for search engines rather than readers — it recited
 * keywords and closed by asserting that the site "is committed to providing
 * high-quality, unique content", which is the kind of self-description quality raters
 * treat as a negative signal. What follows says what the site actually contains, what
 * it does not, and where to start.
 */
export default function SEOContent() {
  return (
    <section className="py-20 bg-bg">
      <div className="container max-w-3xl">
        <h2 className="font-display text-3xl text-text-primary mb-6">What you will find here</h2>
        <div className="font-body text-muted leading-[1.8] space-y-5">
          <p>
            Astroneo is an astronomy reference built around two things: a catalogue of 8,898
            celestial objects with their measured properties, and a set of written guides that
            explain what those measurements mean.
          </p>
          <p>
            The catalogue draws on the HYG database — a compilation of the Hipparcos, Yale Bright
            Star and Gliese catalogues — so coordinates, magnitudes, distances and spectral classes
            are the same values professional astronomers work with. You can{' '}
            <Link href="/explore" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              filter the catalogue
            </Link>{' '}
            by constellation or spectral class, and every object has an interactive 3D model and a
            visibility checker that uses your location to tell you whether it is above the horizon
            right now.
          </p>
          <p>
            Alongside that, a few dozen objects have full written articles — how{' '}
            <Link href="/star/betelgeuse" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              Betelgeuse
            </Link>{' '}
            dimmed in 2019 and why,{' '}
            <Link href="/star/vega" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              why Vega
            </Link>{' '}
            is egg-shaped, what{' '}
            <Link href="/blackhole/m87-star" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              the first photograph of a black hole
            </Link>{' '}
            actually shows. The{' '}
            <Link href="/blog" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              articles
            </Link>{' '}
            cover stellar physics, cosmology and practical observing, including honest advice on{' '}
            <Link href="/blog/first-telescope-guide" className="text-text-primary underline underline-offset-4 decoration-white/25 hover:decoration-white/60">
              buying a first telescope
            </Link>{' '}
            and what you will realistically see through it.
          </p>
          <p>
            Every article lists the sources it draws on. Where something is genuinely unsettled —
            Deneb&rsquo;s distance, how supermassive black holes grew so fast, whether dark energy is
            constant — it says so rather than picking an answer. The remaining catalogue entries are
            reference pages showing measured data, and they are labelled as such.
          </p>
          <p>
            Everything is free, and there is no account required to read any of it.
          </p>
        </div>
      </div>
    </section>
  );
}
