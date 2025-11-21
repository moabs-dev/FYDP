'use client';

import React from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Smile, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Benefits() {
  useGSAP(() => {
    // Animate cards in sequence
    const cards = gsap.utils.toArray('.benefit-card');

    cards.forEach((card, i) => {
      const icon = card.querySelector('.benefit-icon');

      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 80,
          rotateY: 15,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          delay: i * 0.2,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Floating icon animation inside each card
      gsap.to(icon, {
        y: -6,
        repeat: -1,
        yoyo: true,
        duration: 1.8,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
        },
      });
    });
  }, []);

  const benefits = [
    {
      icon: <Activity className="w-10 h-10 text-indigo-600" />,
      title: 'Accurate Liver Detection',
      desc: 'Using advanced AI imaging, Hepatoscan delivers precise and reliable diagnostics — detecting liver anomalies with exceptional accuracy.',
    },
    {
      icon: <Smile className="w-10 h-10 text-indigo-600" />,
      title: 'Easy-to-Use Interface',
      desc: 'Designed for everyone — our clean and intuitive interface makes scanning and viewing results effortless for both patients and clinicians.',
    },
    {
      icon: <Zap className="w-10 h-10 text-indigo-600" />,
      title: 'Fast Results',
      desc: 'AI-powered analysis ensures near-instant insights, empowering early intervention when it matters most.',
    },
  ];

  return (
    <section className="benefits-section py-24 bg-gradient-to-b from-white via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Why <span className="text-indigo-600">Choose</span>{' '}
          <span className="text-purple-600">Hepatoscan</span>?
        </h2>
        <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
      </div>

      {/* Cards */}
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl relative z-10">
        {benefits.map((b, i) => (
          <div
            key={i}
            className="benefit-card bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md hover:shadow-xl transform transition-all duration-500 hover:-translate-y-2"
          >
            <div className="flex flex-col items-center text-center">
              <div className="benefit-icon mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                {b.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {b.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Subtle overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-white opacity-30 pointer-events-none"></div>
    </section>
  );
}
