import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Search,
  Layout,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Layers
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Lesson Sculptor",
      description: "Craft bespoke, curriculum-aligned lesson plans in seconds.",
      icon: <BrainCircuit className="w-6 h-6 text-indigo-600" />,
      span: "md:col-span-2",
      bg: "bg-indigo-50",
      content: (
        <div className="mt-6 p-4 rounded-xl bg-white border border-gray-100 shadow-inner font-mono text-xs text-indigo-600/70">
          <div className="flex gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" /></div>
          <div className="animate-pulse">Generating lesson: "Quantum Physics for 8th Grade"...</div>
          <div className="mt-2 text-gray-400">✓ Learning Objectives Defined</div>
          <div className="text-gray-400">✓ Warm-up Activity Created</div>
          <div className="text-indigo-600 font-semibold">⚡ Finalizing Interactive Lab...</div>
        </div>
      )
    },
    {
      title: "Smart Units",
      description: "Structure entire semesters with AI precision.",
      icon: <Layers className="w-6 h-6 text-purple-600" />,
      span: "md:col-span-1",
      bg: "bg-purple-50",
    },
    {
      title: "Deep Research Hub",
      description: "Curated academic universe at your fingertips.",
      icon: <Search className="w-6 h-6 text-pink-600" />,
      span: "md:col-span-1",
      bg: "bg-pink-50",
    },
    {
      title: "Adaptive Assessments",
      description: "Build quizzes that grow with your students.",
      icon: <Layout className="w-6 h-6 text-blue-600" />,
      span: "md:col-span-2",
      bg: "bg-blue-50",
      content: (
        <div className="mt-4 flex gap-4 overflow-hidden mask-fade-right">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-32 p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
              <div className="w-full h-1 bg-gray-100 rounded mb-2" />
              <div className="w-2/3 h-1 bg-gray-100 rounded mb-3" />
              <div className="flex justify-between items-center">
                <div className="w-4 h-4 rounded bg-blue-100" />
                <div className="w-8 h-2 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-indigo-100 overflow-x-hidden font-sans">
      {/* Background Mesh Gradients - Softened for Light Mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-50 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Classroom Curator</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Sign In</button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 pt-10 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Educational Excellence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-gray-900 leading-tight">
            Elevate Teaching with<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Curated Intelligence.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the elite circle of educators using AI to automate planning
            and refocus on student success. Fast, precise, and perfectly aligned.
          </p>

          <div className="flex justify-center mb-24">
            <button
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-gray-900 text-white rounded-2xl text-lg font-bold transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-2xl shadow-gray-200 flex items-center gap-3"
            >
              Start Planning Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Bento Grid Features - Redesigned for Light Mode */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.span} relative p-8 rounded-[2.5rem] bg-white border border-gray-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 group cursor-default`}
              >
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6 font-medium">{feature.description}</p>
                  {feature.content}
                </div>
              </div>
            ))}

            {/* Quick Stats Bento - Light Mode */}
            <div className="md:col-span-3 p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Proven Pedagogical Impact</h3>
                <p className="text-gray-500 font-medium">Reclaiming 10+ hours per week for educators across 15,000+ schools.</p>
              </div>
              <div className="flex gap-16">
                <div className="text-center">
                  <div className="text-4xl font-black text-indigo-600">1M+</div>
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Lessons</div>
                </div>
                <div className="w-px h-12 bg-gray-200 hidden md:block" />
                <div className="text-center">
                  <div className="text-4xl font-black text-purple-600">98%</div>
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner - Keeps Vibrant Blue for Impact */}
        <section className="max-w-7xl mx-auto px-6 mt-32">
          <div className="relative p-12 md:p-24 rounded-[3.5rem] bg-indigo-600 overflow-hidden text-center shadow-3xl shadow-indigo-200">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Focus on students, not spreadsheets.</h2>
              <p className="text-indigo-50 mb-10 text-lg font-medium">Experience the difference of AI-curated excellence for 14 days.</p>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl text-xl font-bold hover:bg-gray-50 hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                Get Started Now
              </button>
              <div className="mt-8 flex items-center justify-center gap-2 text-indigo-100 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Curated for Educators by Experts</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            <span className="font-bold text-gray-900">Classroom Curator AI</span>
          </div>
          <div className="flex gap-10">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support Hub</a>
          </div>
          <p>© 2024 Classroom Curator AI. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .mask-fade-right {
          -webkit-mask-image: linear-gradient(to right, black 70%, transparent 100%);
          mask-image: linear-gradient(to right, black 70%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
