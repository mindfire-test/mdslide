import React from 'react';
import { FEATURES } from '../../constants/landing';

export default function FeaturesSection(): React.ReactElement {
  return (
    <section className="py-20 px-10 bg-app-surface border-t border-app-border">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, index) => (
            <div
              key={index}
              className="bg-app-bg border border-app-border rounded-lg p-6 flex flex-col items-start gap-4 transition-all duration-200 hover:border-app-accent hover:-translate-y-0.5"
            >
              {feat.icon}
              <h3 className="font-mono text-base font-medium text-app-text-primary m-0">
                {feat.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-app-text-secondary m-0">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
