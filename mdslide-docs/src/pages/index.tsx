import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { useColorMode } from '@docusaurus/theme-common';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DemoWidget from '../components/landing/DemoWidget';
import FeaturesSection from '../components/landing/FeaturesSection';
import CliSection from '../components/landing/CliSection';
import FooterSection from '../components/landing/FooterSection';
import { fetchStars, copyToClipboard } from '../utils';

function HomepageContent(): ReactNode {
  const { colorMode, setColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [scrolled, setScrolled] = useState(false);
  const [starsCount, setStarsCount] = useState('1');
  const [navbarCopied, setNavbarCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.add('homepage-active');
    return () => {
      document.body.classList.remove('homepage-active');
    };
  }, []);

  useEffect(() => {
    fetchStars()
      .then(setStarsCount)
      .catch(() => { });
  }, []);

  const handleCopy = (text: string, setCopied: (val: boolean) => void) => {
    copyToClipboard(text, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

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
