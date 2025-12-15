'use client'

import PhoneMockup from '@/components/PhoneMockup'
import WaitlistForm from '@/components/WaitlistForm'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Home() {
  const { scrollYProgress } = useScroll()

  const purpleY1 = useTransform(scrollYProgress, [0, 1], [0, -300])
  const purpleY2 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const purpleY3 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const purpleOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 0.5, 0.4, 0.3])

  const features = [
    {
      id: 'yearbook',
      image: '/img/Simulator Screenshot - iPhone 17 Pro - yearbook.png',
      title: 'Find your people\non campus.',
      description: 'Discover classmates, study partners, and people who share your interests.',
      imageSide: 'left' as const,
    },
    {
      id: 'events',
      image: '/img/Simulator Screenshot - iPhone 17 Pro - events.png',
      title: 'Discover campus\nevents.',
      description: 'Find and join events happening around campus. Never miss out on what\'s happening.',
      imageSide: 'right' as const,
    },
    {
      id: 'clubs',
      image: '/img/Simulator Screenshot - iPhone 17 Pro - clubs.png',
      title: 'Join clubs and\norganizations.',
      description: 'Connect with clubs, teams, and organizations that match your interests.',
      imageSide: 'left' as const,
    },
    {
      id: 'forum',
      image: '/img/Simulator Screenshot - iPhone 17 Pro - forum.png',
      title: 'Join the\nconversation.',
      description: 'Connect through shared interests, campus events, and meaningful conversations.',
      imageSide: 'right' as const,
    },
    {
      id: 'calendar',
      image: '/img/bonded-calandar.png',
      title: 'Stay organized\nand connected.',
      description: 'Keep track of your schedule, classes, and important campus dates.',
      imageSide: 'left' as const,
    },
    {
      id: 'link-ai',
      image: '/img/Simulator Screenshot - iPhone 17 Pro -linkai.png',
      title: 'Intelligent assistance\nfor connections.',
      description: 'Link AI helps you find the right people and start meaningful conversations.',
      imageSide: 'right' as const,
    },
  ]

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Floating Purple Accent Shapes */}
      <motion.div
        style={{ y: purpleY1, opacity: purpleOpacity }}
        className="fixed top-20 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none z-0"
      />
      <motion.div
        style={{ y: purpleY2 }}
        className="fixed bottom-40 left-10 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none z-0 opacity-50"
      />
      <motion.div
        style={{ y: purpleY3 }}
        className="fixed top-1/2 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl pointer-events-none z-0 opacity-40"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-purple-100/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Bonded</div>
          <div className="flex items-center gap-6">
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#about" className="hover:text-purple-600 transition-colors">About</a>
              <a href="#contact" className="hover:text-purple-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              <a
                href="https://www.linkedin.com/company/getbondedapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/bonded.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 pb-32 z-10">
        {/* Enhanced purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-purple-100/30 to-purple-50/40 pointer-events-none" />
        {/* Additional subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-200/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Phone First on Mobile, Right Side on Desktop */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center lg:justify-end relative z-10 order-1 lg:order-2"
            >
              {/* Purple glow effect */}
              <div className="absolute inset-0 bg-purple-200/30 blur-3xl -z-10 scale-150" />
              <motion.div
                whileInView={{ scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                <PhoneMockup
                  src="/img/Simulator Screenshot - iPhone 17 Pro - drawer.png"
                  alt="Bonded App Drawer"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Form Second on Mobile, Left Side on Desktop */}
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold text-gray-900 mb-8 leading-[1.1] tracking-tight"
              >
                The connection network
                <br />
                for college students.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                <WaitlistForm variant="hero" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-base text-gray-500"
              >
                <span className="text-purple-600 font-medium">Live at University of Rhode Island</span> • Coming to more campuses soon
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {features.map((feature, index) => {
        const isEven = index % 2 === 0
        const bgColor = isEven ? 'bg-gray-50' : 'bg-white'
        const hasPurpleLine = isEven

        return (
          <section
            key={feature.id}
            className={`relative py-32 px-6 ${bgColor} z-10`}
          >
            {/* Purple accent line for even sections */}
            {hasPurpleLine && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              />
            )}

            {/* Enhanced purple gradient overlay for odd sections */}
            {!isEven && (
              <div className={`absolute inset-0 ${
                feature.imageSide === 'right' 
                  ? 'bg-gradient-to-l from-purple-100/30 via-purple-50/15 to-transparent'
                  : 'bg-gradient-to-r from-purple-100/30 via-purple-50/15 to-transparent'
              } pointer-events-none`} />
            )}

            <div className="max-w-7xl mx-auto w-full relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Image Side */}
                <motion.div
                  initial={{ opacity: 0, x: feature.imageSide === 'left' ? -80 : 80, rotateY: feature.imageSide === 'left' ? -15 : 15 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center justify-center ${
                    feature.imageSide === 'left' ? 'lg:justify-start order-2 lg:order-1' : 'lg:justify-end order-2'
                  }`}
                >
                  <div className="relative w-full">
                    {/* Purple glow */}
                    <motion.div
                      whileInView={{ opacity: [0.3, 0.5, 0.3] }}
                      viewport={{ once: true }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                      className="absolute inset-0 bg-purple-200/30 blur-3xl -z-10"
                    />
                    <motion.div
                      whileInView={{ scale: [1, 1.02, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 + 0.5 }}
                    >
                      <PhoneMockup
                        src={feature.image}
                        alt={feature.title}
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Text Side */}
                <motion.div
                  initial={{ opacity: 0, x: feature.imageSide === 'left' ? 80 : -80 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col justify-center ${
                    feature.imageSide === 'left' ? 'order-1 lg:order-2' : 'order-1'
                  }`}
                >
                  <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-gray-900 mb-6 leading-tight whitespace-pre-line"
                  >
                    {feature.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl sm:text-2xl text-gray-600 leading-relaxed"
                  >
                    {feature.description}
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </section>
        )
      })}

      {/* Section: Launch Info */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-gray-50 via-purple-50/40 to-purple-100/20 z-10">
        {/* Enhanced purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/30 via-purple-50/50 to-purple-100/30 pointer-events-none" />
        {/* Additional accent gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-200/10 via-transparent to-purple-200/10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold text-gray-900 mb-8 leading-tight"
            >
              Bonded is launching
              <br />
              at select campuses.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-4 leading-relaxed"
            >
              Currently live at University of Rhode Island
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-gray-500 max-w-3xl mx-auto mb-12"
            >
              Join the waitlist from any school. We&apos;re expanding to campuses with the most interest.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-xl mx-auto"
            >
              <WaitlistForm variant="cta" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-purple-200/30 z-10 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Bonded</div>
            <nav className="flex items-center gap-8 text-sm text-gray-600">
              <a href="#about" className="hover:text-purple-600 transition-colors">About</a>
              <a href="#privacy" className="hover:text-purple-600 transition-colors">Privacy</a>
              <a href="#contact" className="hover:text-purple-600 transition-colors">Contact</a>
              <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                <a
                  href="https://www.linkedin.com/company/getbondedapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/bonded.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </nav>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Bonded. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}


