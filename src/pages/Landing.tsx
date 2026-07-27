import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AdvancedHeroScene from '../components/AdvancedHeroScene';
import Layout from '../components/Layout';
import { HandCoins, Zap, ShieldCheck, Leaf } from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 pt-16 pb-28 lg:pt-24 lg:pb-36">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
           <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              
              {/* Text Content */}
              <motion.div 
                className="flex-1 text-center lg:text-left z-10 pt-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                 <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold tracking-widest uppercase mb-10 shadow-xs border border-blue-200">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                    Live in the Philippines
                 </motion.div>
                 
                 <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight font-display mb-10">
                    Your Ride. <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Your Price.</span> <br />
                    Your Choice.
                 </motion.h1>
                 
                 <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-12 leading-relaxed">
                    Experience urban mobility on your terms. Passengers propose a fare, drivers place competitive bids, and you choose the best match. Built for transparency, safety, and fairness.
                 </motion.p>
                 
                 <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6">
                    <Link to="/signup?role=passenger" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-600/30 text-lg flex justify-center items-center">
                       Ride with FareGo
                    </Link>
                    <Link to="/signup?role=driver" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 font-bold rounded-full hover:bg-slate-50 transition-all shadow-md hover:shadow-lg text-lg flex justify-center items-center">
                       Drive & Earn
                    </Link>
                 </motion.div>
              </motion.div>

              {/* 3D Visual Space */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 1, delay: 0.3 }}
                 className="flex-1 w-full flex justify-center items-center relative mt-16 lg:mt-0"
                 id="car-canvas-container"
              >
                 {/* Decorative background blur to ground the 3D element */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-400/10 rounded-full blur-[80px] pointer-events-none"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                 
                 <div className="relative w-full max-w-2xl z-10 transform hover:scale-[1.01] transition-transform duration-700">
                    <AdvancedHeroScene />
                 </div>
              </motion.div>

           </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 lg:py-40 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6 }}
               className="text-center mb-24"
            >
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 font-display mb-8 tracking-tight">Why choose FareGo?</h2>
               <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                 We're reimagining the ride-hailing experience by giving control back to riders and drivers. A fair marketplace built on choice.
               </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
               {/* Feature 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.5, delay: 0.1 }}
                 className="bg-slate-50/50 rounded-xl p-12 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group cursor-default h-full flex flex-col"
               >
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                     <HandCoins className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display tracking-tight">P2P Bidding</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                     Set your own fare. Drivers bid on your request, ensuring true market rates and absolute transparency.
                  </p>
               </motion.div>

               {/* Feature 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.5, delay: 0.2 }}
                 className="bg-slate-50/50 rounded-xl p-12 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-500 group cursor-default h-full flex flex-col"
               >
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                     <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display tracking-tight">Smart-Match</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                     Our AI-driven algorithm connects passengers and drivers instantly, optimizing for efficiency and shared routes.
                  </p>
               </motion.div>

               {/* Feature 3 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.5, delay: 0.3 }}
                 className="bg-slate-50/50 rounded-xl p-12 border border-slate-100 hover:border-rose-200 hover:bg-white hover:shadow-2xl hover:shadow-rose-900/5 transition-all duration-500 group cursor-default h-full flex flex-col"
               >
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                     <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display tracking-tight">Female Safety</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                     Exclusive safety options allowing female riders to strictly match with female drivers for ultimate peace of mind.
                  </p>
               </motion.div>

               {/* Feature 4 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.5, delay: 0.4 }}
                 className="bg-slate-50/50 rounded-xl p-12 border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 group cursor-default h-full flex flex-col"
               >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                     <Leaf className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display tracking-tight">Eco-Drive</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                     Request low-emission or EV vehicles specifically to reduce your carbon footprint and support sustainability.
                  </p>
               </motion.div>
            </div>
        </div>
      </section>
    </Layout>
  );
}
