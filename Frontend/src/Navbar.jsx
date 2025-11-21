import React from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
function Navbar() {
    var tl = gsap.timeline()
    useGSAP(()=>{
        
        tl.from('.svg , .nav a , .logo ',{
            y:-40,
            duration:1,
            delay:0.5,
            opacity:0,
            stagger:0.15,
            ease:'power2.out'
        })

       
    },[])
  return (
    <header className="text-gray-600 body-font bg-base header shadow-lg  ">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <Link to="/" className="flex items-center text-gray-900 mb-4 md:mb-0 gap-2">
       
          <svg
            height="40"
            width="40"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg" className="svg"
          >
            <circle cx="256" cy="256" r="256" fill="#21D0C3" />
            <path d="M338.6 110.8c-64.2-13.9-205.7-12.8-258.3 42c-71.9 84.4-48.7 278.8-3.5 318.2s102 47.2 146.9 52.2c44.9 4.9 109.1-70.2 109.1-70.2s67.2-17.5 87.2-46.5c20-28.9 62-74.5 88.2-91.6 26.2-17.2-84.4-71.8-169.5-39.4L338.6 110.8z" fill="#FF5B62" />
          </svg>
          <span className="text-xl font-bold logo">Hepatoscan</span>
        </Link>

    
        <nav className="md:ml-auto nav flex flex-wrap items-center md:gap-7 text-base justify-center">
          <Link to="/" className="mr-5 hover:text-gray-900">Home</Link>
          <Link to="/form" className="mr-5 hover:text-gray-900">Form</Link>
          <Link to="/results" className="mr-5 hover:text-gray-900">Results</Link>
          <Link to="/" className="mr-5 hover:text-gray-900">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
