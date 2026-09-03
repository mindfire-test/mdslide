import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function AgentSection(): React.ReactElement {
  return (
    <section className="py-16 px-6 md:py-24 md:px-10 bg-app-surface border-t border-app-border">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-20">
        
        {/* Left Side: Media Placeholder */}
        <div className="flex-[1.2] w-full order-2 md:order-1">
          <div className="bg-[#0E0E0D] border border-app-border rounded-lg overflow-hidden shadow-lg aspect-video flex items-center justify-center relative group">
            <video 
              src={useBaseUrl('/video/mdslide_ai_ppt_generate.mp4')} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="flex-1 order-1 md:order-2">
          <h2 className="font-mono text-3xl font-medium text-app-text-primary mb-4 flex items-center gap-3">
            🤖 Built for AI Agents
          </h2>
          <p className="text-base leading-relaxed text-app-text-secondary max-w-[480px] mb-6">
            <code>mdslide</code> is specifically designed to be extremely friendly for LLMs and autonomous AI agents to generate high-quality presentations programmatically.
          </p>
          <ul className="text-sm leading-relaxed text-app-text-secondary space-y-4 max-w-[480px]">
            <li className="flex gap-3">
              <span className="text-app-accent">✓</span>
              <span><strong>Self-Documenting:</strong> <code className="bg-app-bg px-1 rounded">mdslide llms</code> dumps token-optimized schema docs.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-app-accent">✓</span>
              <span><strong>Visual Validation:</strong> <code className="bg-app-bg px-1 rounded">mdslide screenshot --json</code> allows headless GUI verification via Vision models.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-app-accent">✓</span>
              <span><strong>Deterministic:</strong> Predictable slide boundaries (<code className="bg-app-bg px-1 rounded">&lt;!&#45;&#45; slide &#45;&#45;&gt;</code>) and forced layouts.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
