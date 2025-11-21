'use client'; // Add if using Next.js App Router

import React from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, Cpu, BarChart3 } from 'lucide-react'; // Using Lucide icons (modern alternative)

gsap.registerPlugin(ScrollTrigger);

export default function Steps() {
  useGSAP(() => {
    const steps = ['.step-1', '.step-2', '.step-3'];

    gsap.fromTo(
      steps,
      {
        y: 120,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.3,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.steps-section',
          start: 'top 75%',
          end: 'top 35%',
          scrub: 2,
          // markers: true, // Remove in production
        },
      }
    );
  }, []);

  const stepsData = [
    {
      step: 'Step 1',
      icon: <FileText className="w-12 h-12" />,
      title: 'Upload Scan',
    },
    {
      step: 'Step 2',
      icon: <Cpu className="w-12 h-12" />,
      title: 'AI Analysis',
    },
    {
      step: 'Step 3',
      icon: <BarChart3 className="w-12 h-12" />,
      title: 'Get Results',
    },
  ];

  return (
    <section className="py-10 bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          How It Works
        </h2>
        <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
      </div>

      {/* Steps Grid */}
      <div className="steps-section container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {stepsData.map((item, index) => (
            <div
              key={index}
              className={`step-${index + 1} text-center opacity-0 transform translate-y-32`}
            >
              <div className="mb-6">
                <span className="text-xl font-bold text-indigo-600 block mb-2">
                  {item.step}
                </span>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mb-6">
                  {item.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}