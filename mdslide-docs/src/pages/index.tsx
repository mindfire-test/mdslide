import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { useColorMode } from '@docusaurus/theme-common';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import InstallSection from '../components/landing/InstallSection';
import DemoWidget from '../components/landing/DemoWidget';
import FeaturesSection from '../components/landing/FeaturesSection';
import CliSection from '../components/landing/CliSection';
import FooterSection from '../components/landing/FooterSection';
import { fetchStars, copyToClipboard } from '../utils';

function useScrollThreshold(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

function useHomepageActive(className = 'homepage-active'): void {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);
}

function useGitHubStarsCount(): string | null {
  const [starsCount, setStarsCount] = useState<string | null>(null);

  useEffect(() => {
    fetchStars()
      .then(setStarsCount)
      .catch((err) => {
        console.warn('Failed to load GitHub stars:', err);
      });
  }, []);

  return starsCount;
}

function useClipboardCopyHelper() {
  return (text: string, setCopied: (val: boolean) => void) => {
    copyToClipboard(text, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
}

function HomepageContent(): ReactNode {
  const { colorMode, setColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const scrolled = useScrollThreshold(10);
  const starsCount = useGitHubStarsCount();
  const handleCopy = useClipboardCopyHelper();
  const [navbarCopied, setNavbarCopied] = useState(false);

  useHomepageActive('homepage-active');

  const handleToggleTheme = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  return (
    <>
      <Navbar
        scrolled={scrolled}
        isDark={isDark}
        starsCount={starsCount}
        navbarCopied={navbarCopied}
        onCopy={handleCopy}
        setNavbarCopied={setNavbarCopied}
        onToggleTheme={handleToggleTheme}
      />
      <HeroSection />
      <InstallSection />
      <DemoWidget isDark={isDark} />
      <FeaturesSection />
      <CliSection />
      <FooterSection />
    </>
  );
}


export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Markdown to HTML, PDF and PPTX compilation CLI tool. Beautiful custom slides in seconds."
      wrapperClassName="bg-app-bg text-app-text-primary min-h-screen relative overflow-x-hidden leading-relaxed text-sm"
    >
      <HomepageContent />
    </Layout>
  );
}
