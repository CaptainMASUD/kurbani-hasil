"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Calculator, 
  Receipt, 
  Zap, 
  BarChart3, 
  Printer, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Lock,
  Database
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function KurbaniHasilLandingPage() {
  // Sandbox Interactive Calculator States
  const [animalType, setAnimalType] = useState('cow');
  const [testPrice, setTestPrice] = useState(220000);
  
  const rates = { cow: 0.05, goat: 0.04, buffalo: 0.05 };
  const calculatedHasil = Math.round(testPrice * rates[animalType]);
  const calculatedTotal = Number(testPrice) + calculatedHasil;

  const handleDemoTrigger = () => {
    toast.success("সফটওয়্যার ডেমো অ্যাকাউন্ট প্রস্তুত! সম্পূর্ণ অ্যাক্সেস পেতে সাইন-ইন করুন।");
  };

  return (
    <div className="bg-[#fcfbf7] text-slate-900 min-h-screen selection:bg-emerald-600 selection:text-white antialiased">
      <Toaster position="top-center" />

      {/* 1. TOP ANNOUNCEMENT RIBBON */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-stone-950 text-white text-center py-2.5 px-4 text-xs font-semibold tracking-wide flex justify-center items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>কোরবানির পশুর হাটের হাসিল আদায় ডিজিটালাইজড করুন। নতুন ইজারাদার সংস্করণ উন্মুক্ত!</span>
      </div>

      {/* 2. NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-[#fcfbf7]/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              হা
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 block">KURBANI HASIL</span>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block -mt-1">Smart Haat Management</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-stone-600">
            <a href="#features" className="hover:text-emerald-800 transition">বৈশিষ্ট্যসমূহ</a>
            <a href="#why-us" className="hover:text-emerald-800 transition">আমরা কেন সেরা</a>
            <a href="#sandbox" className="hover:text-emerald-800 transition">লাইভ টেস্ট কাউন্টার</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleDemoTrigger}
              className="text-xs sm:text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2.5 rounded-xl transition"
            >
              ফ্রি ডেমো দেখুন
            </button>
            <button className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-800/10 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>কাউন্টার লগইন</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. GRAPHICAL MARKETING BANNER (REPOSITIONED BELOW NAVBAR) */}
      <div className="w-full bg-[#1e272e] overflow-hidden flex justify-center border-b border-stone-200">
        <div className="w-full max-w-7xl relative aspect-[1024/240] sm:aspect-[1024/180] md:aspect-[1024/140] lg:aspect-[1024/110]">
          <Image 
            src="https://www.techetron.com/wp-content/uploads/2021/07/qurbanidarazhat-1024x538.png"
            alt="Qurbani Digital Haat Banner"
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />
          {/* Subtle branding overlay accentuating automation capabilities */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-black/40 flex items-center px-4 sm:px-8">
            <div className="bg-emerald-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-500/30 text-white text-[10px] sm:text-xs font-bold tracking-wide shadow-lg max-w-[200px] sm:max-w-none">
              🚀 পশুর হাট অটোমেশন রেডি ২০২৬ সংস্করণ
            </div>
          </div>
        </div>
      </div>

      {/* 4. HERO MARKETING SECTION */}
      <header className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-600/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full py-1.5 px-3.5 text-xs font-bold text-emerald-800">
          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> হাটের অর্থনৈতিক লিক বা চুরি বন্ধের একমাত্র সমাধান
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          পশুর হাটের হাসিল আদায় হোক <br />
          <span className="bg-gradient-to-r from-emerald-700 to-amber-600 bg-clip-text text-transparent">১০০% ডিজিটাল ও স্বচ্ছ</span>
        </h1>

        <p className="text-stone-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
          ঐতিহ্যবাহী কোরবানির পশুর হাটের হিসাব নিকাশ এখন একটিমাত্র সফটওয়্যারে। জাল রশিদ ও ক্যাশ চুরির ঝুঁকি এড়িয়ে স্বয়ংক্রিয় রেট কনফিগারেশনে দ্রুত কাউন্টার রশিদ জেনারেট করুন।
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a href="#sandbox" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-800/20 flex items-center gap-2">
            লাইভ কাউন্টার ডেমো টেস্ট করুন <ArrowRight className="w-4 h-4" />
          </a>
          <button 
            onClick={handleDemoTrigger}
            className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-sm px-6 py-4 rounded-xl transition shadow-sm"
          >
            কথা বলুন সেলস টিমের সাথে
          </button>
        </div>
      </header>

      {/* 5. VALUE PROPOSITION STATS */}
      <section className="bg-white border-y border-stone-200/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono block">০%</span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-1 block">ক্যাশ হিসাবের গরমিল ঝুঁকি</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">৩ সেকেন্ড</span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-1 block">প্রতিটি রশিদ জেনারেশন টাইম</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">১০০%</span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-1 block">রিয়েল-টাইম ক্লাউড ডাটা সিঙ্ক</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono block">১টি</span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide mt-1 block">সেন্ট্রাল অ্যাডমিন ড্যাশবোর্ড</span>
          </div>
        </div>
      </section>

      {/* 6. FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">হাটের জটিল বিলিং সমাধান এখন হাতের মুঠোয়</h2>
          <p className="text-stone-500 text-sm max-w-xl mx-auto">ইজারাদার এবং কাউন্টার স্টাফদের কথা মাথায় রেখে অত্যন্ত সহজ ইন্টারফেসে তৈরি এই সফটওয়্যার</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-emerald-600/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">কনফিগ্যারেবল হাসিল রেট</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              পশুর ধরন অনুযায়ী হাসিল রেট (যেমন গরু ৫%, ছাগল ৪%) ব্যাকএন্ড থেকে যেকোনো সময় পরিবর্তন করা সম্ভব। অপারেটরদের ম্যানুয়ালি হিসাব করার কোনো প্রয়োজন নেই।
            </p>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-emerald-600/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ইনস্ট্যান্ট প্রিন্ট ও গেট পাস</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              যেকোনো থার্মাল বা মিনি পস প্রিন্টারের সাথে সামঞ্জস্যপূর্ণ। এন্ট্রি সেভ করার সাথে সাথেই ক্রেতার জন্য বারকোডসহ অফিশিয়াল গেট পাস মেমো প্রিন্ট আউট হয়ে যাবে।
            </p>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-emerald-600/30 transition">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">লাইভ কালেকশন ট্র্যাকিং</h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              ইজারাদার বা মালিকপক্ষ ঘরে বসেই মোবাইল ফোনের মাধ্যমে লাইভ দেখতে পারবেন কোন কাউন্টার থেকে মিনিটে কত টাকা আদায় হচ্ছে এবং মোট কতটি পশু বিক্রি হয়েছে।
            </p>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE US SECTION */}
      <section id="why-us" className="bg-white border-y border-stone-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">এনালগ টোকেন ও খাতার দিন শেষ! আপনার হাটকে করুন স্মার্ট</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              সনাতন পদ্ধতিতে হাতের লেখায় হাসিল কাটলে যেমন লম্বা লাইনের সৃষ্টি হয়, ঠিক তেমনি কত টাকা আদায় হলো তার সঠিক কোনো সেন্ট্রাল হিসাব থাকে না। আমাদের ডিজিটাল ক্লাউড ডাটাবেস প্রতিটি পয়সার নিখুঁত ট্র্যাকিং নিশ্চিত করে।
            </p>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>অপারেটরদের ক্যাশ আত্মসাৎ বা ভুল হিসাব করার সুযোগ বন্ধ।</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>জাল রশিদ চক্র সম্পূর্ণ নির্মূল হবে বারকোড ভেরিফিকেশনে।</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>অফলাইন ব্যাকআপ সিস্টেম (ইন্টারনেট সাময়িক চলে গেলেও কাজ সচল থাকবে)।</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-900 to-slate-950 p-8 rounded-2xl border border-stone-800 shadow-2xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] opacity-10 text-9xl font-bold">৳</div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              <Database className="w-3 h-3" /> Secure Cloud Backup
            </div>
            <h3 className="text-xl font-bold">ইজারাদার সেন্ট্রাল অ্যাডমিন প্যানেল</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              একটি সিঙ্গেল স্ক্রিন থেকেই আপনার হাটের ২০টি বুথ বা কাউন্টারের লাইভ আদায় পরিস্থিতি তদারকি করুন। যেকোনো মুহূর্তের কালেকশন রিপোর্ট ডাউনলোড করুন এক ক্লিকে।
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
              <span className="text-stone-400">আজকের মোট কালেকশন লাইভ:</span>
              <span className="font-mono font-black text-base text-emerald-400">৳ ৪,৮৫,২৫০.০০</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE SANDBOX TEST COUNTER */}
      <section id="sandbox" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Live Simulator</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">সفتওয়্যারটি কিভাবে কাজ করে নিজে পরীক্ষা করুন</h2>
          <p className="text-stone-500 text-sm max-w-xl mx-auto">নিচের ইনপুটে কাল্পনিক পশুর দাম পরিবর্তন করে লাইভ রশিদের হিসাব ব্রেকডাউনটি দেখুন</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          <div className="lg:col-span-6 bg-white border border-stone-200 p-6 rounded-2xl shadow-xl space-y-5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Calculator className="w-4 h-4 text-emerald-800" /> অপারেটর স্ক্রিন সিমুলেটর
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">পশুর ধরন নির্বাচন</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cow', 'goat', 'buffalo'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnimalType(type)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                        animalType === type 
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm' 
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {type === 'cow' ? 'গরু (5%)' : type === 'goat' ? 'ছাগল (4%)' : 'মহিষ (5%)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">পশুর বিক্রয়মূল্য (টাকা)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 font-bold text-stone-400 text-sm">৳</span>
                  <input 
                    type="number" 
                    value={testPrice}
                    onChange={(e) => setTestPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base font-mono font-black text-slate-800 focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden text-xs">
            <div className="bg-stone-950 p-4 text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-amber-500" /> গ্রাহক কপি রশিদ প্রিভিউ</span>
              <span className="text-[10px] text-emerald-400 font-mono">ID: DEMO-7732</span>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="border-b border-dashed border-stone-200 pb-3 space-y-1">
                <p className="font-bold text-slate-800">ক্রেতা: সাধারণ কোরবানি ক্রেতা</p>
                <p className="text-stone-400 text-[10px]">তারিখ: ১৯ মে ২০২৬ | কাউন্টার-০২</p>
              </div>

              <div className="space-y-2 text-[11px] font-medium text-stone-600">
                <div className="flex justify-between">
                  <span>পশুর মূল্য:</span>
                  <span className="font-mono text-slate-900 font-bold">৳ {Number(testPrice || 0).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>নির্ধারিত হাসিল ফি ({(rates[animalType] * 100)}%):</span>
                  <span className="font-mono">৳ {calculatedHasil.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between bg-emerald-800 text-white p-2 rounded-lg font-black text-sm mt-3">
                  <span>সর্বমোট প্রদেয় ক্যাশ:</span>
                  <span className="font-mono">৳ {calculatedTotal.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER CALL TO ACTION */}
      <section className="bg-gradient-to-br from-stone-950 to-slate-950 text-white py-16 px-4 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">এই কোরবানির হাটে আপনার রাজস্বের শতভাগ নিশ্চিত করুন</h2>
          <p className="text-stone-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            বিলম্ব না করে আজই আপনার হাটের জন্য কাস্টমাইজড সফটওয়্যার মডিউল এবং পস প্রিন্টার কনফিগারেশন অর্ডার করুন। 
          </p>
          <button 
            onClick={handleDemoTrigger}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition shadow-lg shadow-amber-600/20 inline-flex items-center gap-2"
          >
            ফ্রি ট্রায়াল অ্যাকাউন্ট এক্টিভেট করুন <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="bg-stone-950 text-stone-600 text-xs text-center py-6 border-t border-stone-900">
        <p>© 2026 Kurbani Hasil Automation Platform. Engineered for absolute secure market management.</p>
      </footer>
    </div>
  );
}