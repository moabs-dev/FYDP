'use client';

import React from 'react';
import Lottie from 'lottie-react';
import animation from './ani.json';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '.hero-title',
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.2 }
    )
      .fromTo(
        '.hero-desc',
        { x: -80, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: -0.4 }
      )
      .fromTo(
        '.hero-button',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
        '-=0.5'
      );
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 md:py-24">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="max-w-xl">
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Revolutionizing the Fight
              <span className="block text-indigo-600">Against Liver Cancer</span>
            </h1>

            <p className="hero-desc mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              Liver cancer is deadly and often silent until it's too late. Our AI detects it early — using advanced imaging analysis — giving patients a fighting chance.
            </p>

            <div className="mt-10">
              <button
                onClick={() => navigate('/form')}
                className="hero-button group inline-flex items-center gap-3 bg-indigo-600 text-white font-medium px-7 py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Upload Scan Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right: Lottie Animation */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-md lg:max-w-lg drop-shadow-2xl">
              <Lottie 
                animationData={animation} 
                loop={true} 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Optional subtle wave background */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  );
}