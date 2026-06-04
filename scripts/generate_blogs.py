import json
import os
import shutil

blogs_path = os.path.join(os.getcwd(), 'public', 'data', 'blogs.json')
with open(blogs_path, 'r', encoding='utf-8') as f:
    blogs = json.load(f)

images_dir = os.path.join(os.getcwd(), 'public', 'images')
os.makedirs(images_dir, exist_ok=True)

brain_dir = os.path.join(os.path.expanduser('~'), '.gemini', 'antigravity', 'brain', '3f70d9fd-af48-4269-963e-596aca4a88d8')
src_images = [
    'm87_cover_1780555382481.png',
    'cygnus_x1_cover_1780555396818.png',
    'media__1780513619970.png',
    'sagittarius_a_cover_1780555161696.png',
    'ton_618_cover_1780555410730.png'
]

for i, img in enumerate(src_images):
    src = os.path.join(brain_dir, img)
    dst = os.path.join(images_dir, f'blog-{i+1}.jpg')
    if os.path.exists(src):
        shutil.copy2(src, dst)
    else:
        print(f"Warning: Source image {src} does not exist.")

images = [f'/images/blog-{i+1}.jpg' for i in range(len(src_images))]

# assign images to existing blogs
for i, blog in enumerate(blogs):
    if 'image' not in blog or not blog['image']:
        blog['image'] = images[i % len(images)]

new_blogs = [
    {
        'slug': 'the-kessler-syndrome',
        'title': 'The Kessler Syndrome: Are We Trapping Ourselves on Earth?',
        'date': '2025-06-15',
        'readTime': '7 min read',
        'category': 'Deep Dives',
        'featured': False,
        'excerpt': 'Space junk is accumulating at an alarming rate. What happens if a chain reaction of collisions destroys our orbital infrastructure?',
        'content': '''
## The Problem in Orbit

Since the dawn of the Space Age, humanity has launched thousands of rockets, satellites, and probes. Many of these objects, or their discarded stages, remain in orbit. Today, there are over 30,000 pieces of trackable space debris larger than a softball, and millions of smaller pieces.

## The Chain Reaction

In 1978, NASA scientist Donald Kessler proposed a terrifying scenario. As the density of space junk in Low Earth Orbit (LEO) increases, the likelihood of collisions rises. A single collision between two large satellites can produce thousands of new fragments. These fragments can then strike other satellites, creating a runaway chain reaction of destruction.

## Trapped on Earth

If the Kessler Syndrome reaches a tipping point, Low Earth Orbit could become impassable. We would lose GPS, weather satellites, satellite internet, and the ability to safely launch humans into space. Humanity could effectively trap itself on Earth for generations until the debris naturally de-orbits.
''',
        'image': images[0]
    },
    {
        'slug': 'james-webb-vs-hubble',
        'title': 'JWST vs Hubble: What is the Difference?',
        'date': '2025-06-12',
        'readTime': '6 min read',
        'category': 'Education',
        'featured': False,
        'excerpt': 'Both are revolutionary space telescopes, but they see the universe in completely different ways. Here is how JWST and Hubble compare.',
        'content': '''
## A Difference in Vision

The Hubble Space Telescope observes the universe primarily in visible and ultraviolet light. It shows us the cosmos much as our own eyes would see it if they were infinitely more sensitive.

In contrast, the James Webb Space Telescope (JWST) is designed to see in the infrared. Infrared light can pass through dense clouds of cosmic dust that block visible light. This allows JWST to peer into stellar nurseries and see the birth of stars that are hidden from Hubble.

## Looking Back in Time

Because the universe is expanding, light from the earliest galaxies is stretched as it travels through space. By the time it reaches Earth, the visible light has been stretched into infrared light—a phenomenon called cosmological redshift. JWSTs infrared sensors allow it to see these ancient galaxies, looking further back in time than Hubble ever could.
''',
        'image': images[1]
    },
    {
        'slug': 'terraforming-mars',
        'title': 'Can We Actually Terraform Mars?',
        'date': '2025-06-10',
        'readTime': '10 min read',
        'category': 'Space Exploration',
        'featured': True,
        'excerpt': 'Transforming the Red Planet into a second Earth is a staple of science fiction. But is it scientifically possible?',
        'content': '''
## The Challenge

Mars is currently a frozen, irradiated desert. Its atmosphere is less than 1% as thick as Earths, and it lacks a global magnetic field to protect against solar radiation. To terraform Mars, we would need to thicken the atmosphere, raise the temperature, and introduce a biosphere.

## Warming the Planet

The first step is to release greenhouse gases. Some scientists have proposed detonating nuclear weapons over the Martian poles to vaporize the dry ice (frozen CO2) trapped there. This could trigger a runaway greenhouse effect, warming the planet and melting subsurface water ice.

## The Magnetic Problem

Even if we could create a breathable atmosphere, the solar wind would gradually strip it away because Mars has no magnetic field. Proposed solutions include building a massive magnetic shield at the Mars L1 Lagrange point to deflect the solar wind, allowing the atmosphere to regenerate naturally.
''',
        'image': images[2]
    },
    {
        'slug': 'what-are-exoplanets',
        'title': 'Exoplanets: Worlds Beyond Our Solar System',
        'date': '2025-06-08',
        'readTime': '8 min read',
        'category': 'Education',
        'featured': False,
        'excerpt': 'We have discovered over 5,000 planets orbiting other stars. What are these strange new worlds like?',
        'content': '''
## The Discovery Explosion

For most of human history, we only knew of the planets in our own solar system. That changed in 1995 with the discovery of 51 Pegasi b, the first confirmed exoplanet orbiting a sun-like star. Since then, the Kepler and TESS space telescopes have discovered thousands more.

## Strange New Worlds

Exoplanets come in a bizarre variety of types that don't exist in our solar system:
- **Hot Jupiters:** Gas giants orbiting extremely close to their host stars, with temperatures hot enough to melt iron.
- **Super-Earths:** Rocky planets larger than Earth but smaller than Neptune.
- **Water Worlds:** Planets covered entirely by deep oceans.

## The Search for Earth 2.0

The ultimate goal of exoplanet hunting is to find a rocky planet in the "habitable zone" of its star—the region where temperatures allow liquid water to exist on the surface. While we have found several candidates, we are still searching for a true Earth twin.
''',
        'image': images[3]
    },
    {
        'slug': 'the-speed-of-light',
        'title': 'Why Cant We Travel Faster Than Light?',
        'date': '2025-06-05',
        'readTime': '9 min read',
        'category': 'Deep Dives',
        'featured': False,
        'excerpt': 'The universal speed limit is 299,792 kilometers per second. Why does the universe enforce this strict limit?',
        'content': '''
## Einsteins Revelation

According to Albert Einstein's theory of Special Relativity, the speed of light in a vacuum (c) is constant and independent of the observer. As an object with mass accelerates, its relativistic mass increases. As it approaches the speed of light, its mass approaches infinity.

## Infinite Energy

Because an object's mass approaches infinity, the energy required to accelerate it further also approaches infinity. Therefore, it would take an infinite amount of energy to accelerate any object with mass to the speed of light. Since infinite energy is impossible, nothing with mass can ever reach or exceed c.

## Time Dilation

As you move faster, time slows down for you relative to a stationary observer. If you were to somehow travel at the speed of light, time would stop completely. If you traveled faster than light, time would theoretically run backward, violating the fundamental principle of causality (cause and effect).
''',
        'image': images[4]
    },
    {
        'slug': 'dark-energy-expansion',
        'title': 'Dark Energy and the Accelerating Universe',
        'date': '2025-06-02',
        'readTime': '8 min read',
        'category': 'Deep Dives',
        'featured': False,
        'excerpt': 'The expansion of the universe isnt slowing down; its speeding up. Dark energy is the mysterious force driving this acceleration.',
        'content': '''
## The Shocking Discovery

In the late 1990s, astronomers measuring the distance to distant supernovas expected to find that the expansion of the universe was slowing down due to gravity. Instead, they discovered the exact opposite: the expansion is accelerating.

## What is Dark Energy?

To explain this acceleration, scientists hypothesized a mysterious, repulsive force that permeates all of space, which they called **Dark Energy**. It makes up roughly 68% of the total energy density of the universe.

## The Big Rip

If dark energy continues to accelerate the expansion of the universe, it could eventually overcome all gravitational and electromagnetic forces. In a scenario known as the "Big Rip," galaxies, stars, planets, and eventually atoms themselves would be torn apart by the accelerating expansion of space.
''',
        'image': images[0]
    },
    {
        'slug': 'the-oort-cloud',
        'title': 'The Oort Cloud: The Edge of the Solar System',
        'date': '2025-05-31',
        'readTime': '6 min read',
        'category': 'Education',
        'featured': False,
        'excerpt': 'A vast, spherical shell of icy debris surrounds our solar system. Welcome to the Oort Cloud, the birthplace of comets.',
        'content': '''
## The Outer Limits

Beyond the orbits of Neptune and Pluto lies the Kuiper Belt, but even further out is the Oort Cloud. It is a theoretical, spherical shell of icy objects that surrounds the entire solar system, extending up to a light-year away from the Sun.

## The Source of Long-Period Comets

Astronomer Jan Oort proposed the existence of this cloud in 1950 to explain the origins of long-period comets—comets with orbits that take thousands or millions of years to complete. Occasionally, the gravitational pull of a passing star or molecular cloud nudges one of these icy bodies out of the Oort Cloud and sends it plunging toward the inner solar system.
''',
        'image': images[1]
    },
    {
        'slug': 'the-goldilocks-zone',
        'title': 'The Goldilocks Zone: Where Life Can Thrive',
        'date': '2025-05-28',
        'readTime': '7 min read',
        'category': 'Space Exploration',
        'featured': False,
        'excerpt': 'Not too hot, not too cold. The Habitable Zone is the sweet spot around a star where liquid water can exist on a planets surface.',
        'content': '''
## The Crucial Ingredient

Life as we know it requires liquid water. Therefore, astrobiologists looking for extraterrestrial life focus on planets that could potentially support oceans, lakes, and rivers on their surface.

## The Habitable Zone

The "Goldilocks Zone" (or Habitable Zone) is the region around a star where the temperature is just right—not so hot that water boils away into steam, and not so cold that it freezes solid.

## Moving Boundaries

The location and size of the habitable zone depend on the size and temperature of the host star. For a hot, bright O-type star, the habitable zone is very far away. For a cool, dim M-type red dwarf, the habitable zone is much closer in. As a star ages and becomes brighter, its habitable zone gradually moves outward.
''',
        'image': images[2]
    },
    {
        'slug': 'what-is-a-pulsar',
        'title': 'Pulsars: The Cosmic Clocks',
        'date': '2025-05-25',
        'readTime': '8 min read',
        'category': 'Education',
        'featured': False,
        'excerpt': 'Rapidly spinning neutron stars emit beams of radiation that sweep across space like a lighthouse. These are pulsars.',
        'content': '''
## LGM-1

In 1967, Jocelyn Bell Burnell discovered a strange radio signal pulsing with incredible regularity—every 1.337 seconds. The pulses were so precise that astronomers jokingly named the source "LGM-1" for "Little Green Men." However, they soon realized the source was completely natural.

## The Cosmic Lighthouse

Pulsars are highly magnetized, rapidly rotating neutron stars. They emit beams of electromagnetic radiation from their magnetic poles. If the magnetic axis is not aligned with the rotation axis, these beams sweep through space as the star spins. If Earth lies in the path of the beam, we detect a pulse of radiation every time the beam sweeps past us.
''',
        'image': images[3]
    },
    {
        'slug': 'the-andromeda-collision',
        'title': 'The Andromeda Collision: Our Galaxys Ultimate Fate',
        'date': '2025-05-22',
        'readTime': '9 min read',
        'category': 'Deep Dives',
        'featured': False,
        'excerpt': 'In 4.5 billion years, the Milky Way will collide with the Andromeda Galaxy. What will happen to Earth?',
        'content': '''
## The Inevitable Crash

The Andromeda Galaxy is currently 2.5 million light-years away, but it is hurtling toward the Milky Way at 110 kilometers per second. In about 4.5 billion years, the two massive spiral galaxies will collide.

## A Ghostly Collision

While "collision" sounds violent, the distance between individual stars is so vast that very few, if any, stars will actually hit each other. Instead, the galaxies will pass through one another like ghosts. However, their immense gravitational fields will interact violently, pulling both galaxies out of shape and scattering stars into long, sweeping "tidal tails."

## Milkomeda

The two galaxies will eventually swing back together and merge, forming a single, giant elliptical galaxy that astronomers have nicknamed "Milkomeda." During the merger, clouds of gas will compress, triggering a massive burst of new star formation.
''',
        'image': images[4]
    }
]

existing_slugs = {b['slug'] for b in blogs}
for nb in new_blogs:
    if nb['slug'] not in existing_slugs:
        blogs.append(nb)

with open(blogs_path, 'w', encoding='utf-8') as f:
    json.dump(blogs, f, indent=2)

print('Updated blogs.json successfully.')
