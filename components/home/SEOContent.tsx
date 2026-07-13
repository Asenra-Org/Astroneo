export default function SEOContent() {
  return (
    <section className="py-20 bg-bg">
      <div className="container max-w-4xl">
        <h2 className="font-display text-3xl text-text-primary mb-6">About Astroneo: Your Gateway to the Stars</h2>
        <div className="prose prose-invert prose-p:text-muted prose-headings:text-text-primary max-w-none font-body leading-relaxed">
          <p className="mb-4">
            Astroneo is a comprehensive, interactive astronomical database designed for stargazers, students, and space enthusiasts. 
            Our platform provides detailed, accurate information on over 8,800 celestial objects, including main sequence stars, 
            red giants, white dwarfs, planets, and moons. Whether you are looking for the exact right ascension and declination 
            of Polaris, the surface temperature of Betelgeuse, or the distance to the Andromeda Galaxy, Astroneo offers a 
            seamless exploration experience.
          </p>
          <p className="mb-4">
            Unlike traditional star catalogs that only offer raw tabular data, Astroneo transforms astronomical data into 
            interactive 3D visualizations. Our unique rendering engine allows you to visually compare the size, color, and 
            luminosity of different spectral classes (O, B, A, F, G, K, M). By combining data from the Hipparcos catalog 
            with modern web technologies, we make astronomy accessible and engaging for everyone.
          </p>
          <p>
            Explore our curated list of featured stars, use the advanced filtering tools in our Explore section to find 
            stars by constellation or magnitude, or read our educational blog posts to learn more about astrophysics, 
            black holes, and the mysteries of the universe. Astroneo is committed to providing high-quality, unique 
            content that enriches your understanding of the cosmos.
          </p>
        </div>
      </div>
    </section>
  );
}
