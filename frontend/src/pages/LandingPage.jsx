import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Apple-Inspired Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-11">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                            <div className="w-7 h-7 bg-black rounded flex items-center justify-center text-white font-bold text-sm">L</div>
                        </Link>

                        {/* Center Navigation */}
                        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                            <a href="#features" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Features</a>
                            <Link to="/login" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Learner</Link>
                            <Link to="/login" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Manager</Link>
                            <a href="#about" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">About</a>
                            <a href="#pricing" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Pricing</a>
                            <a href="#support" className="text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Support</a>
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-6">
                            {/* Search Icon */}
                            <button className="hidden md:block text-gray-800 hover:text-gray-600 transition-colors" aria-label="Search">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </button>

                            {user ? (
                                <Link to="/dashboard" className="text-xs text-gray-800 hover:text-blue-600 transition-colors font-normal">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="hidden md:block text-xs text-gray-800 hover:text-gray-600 transition-colors font-normal">Sign In</Link>
                                    <Link to="/register" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-all font-normal">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main>
                <section className="py-24 px-6 text-center bg-white border-b border-slate-200">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            <span className="text-blue-600">LEARNING MANAGEMENT SYSTEM</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                            A streamlined, professional learning management system designed for enterprise teams.
                            Track progress, manage modules, and foster growth with ease.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg">
                                Create Organization Account
                            </Link>
                            <Link to="/login" className="bg-white text-slate-700 border border-slate-300 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
                                View Demo Course
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 px-6 max-w-7xl mx-auto" aria-labelledby="features-heading">
                    <h2 id="features-heading" className="sr-only">Platform Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600" aria-hidden="true">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Module Tracking</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Intuitive module management for learners to follow their curriculum step-by-step.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600" aria-hidden="true">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Manager Insights</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Granular data for managers to oversee team progress and identify areas for intervention.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600" aria-hidden="true">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Study Notes</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Integrated workspace for learners to capture insights directly within the learning environment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dashboard Showcase */}
                <section id="showcase" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                                See Your Platform in Action
                            </h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Experience enterprise-grade dashboards designed for learners and managers
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Learner Dashboard Preview */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">Learner Dashboard</h3>
                                        <p className="text-gray-500 text-sm">Intuitive learning experience</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                                    <div className="space-y-4">
                                        {/* Metrics Preview */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <div className="text-2xl font-bold text-blue-600">75%</div>
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Completion</div>
                                            </div>
                                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                                <div className="text-2xl font-bold text-indigo-600">20</div>
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Total Modules</div>
                                            </div>
                                        </div>
                                        {/* Module Cards Preview */}
                                        <div className="space-y-2">
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-gray-900">Introduction to Python</span>
                                                    <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-bold rounded-full border border-green-100">SYNCHRONIZED</span>
                                                </div>
                                                <div className="h-1 bg-gray-200 rounded-full">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 opacity-70">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-gray-900">Advanced React Patterns</span>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-full border border-blue-100">ACTIVE</span>
                                                </div>
                                                <div className="h-1 bg-gray-200 rounded-full">
                                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Dashboard Preview */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">Manager Dashboard</h3>
                                        <p className="text-gray-500 text-sm">Comprehensive analytics</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                                    <div className="space-y-4">
                                        {/* Global Stats */}
                                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Global Sync</div>
                                            <div className="text-2xl font-bold">82% <span className="text-xs text-green-400">Efficiency</span></div>
                                        </div>
                                        {/* Learner Grid Preview */}
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-gray-500 uppercase">Team Overview</div>
                                            {[
                                                { name: 'John Doe', progress: 85, modules: 17 },
                                                { name: 'Jane Smith', progress: 92, modules: 18 },
                                                { name: 'Mike Wilson', progress: 68, modules: 14 }
                                            ].map((learner, i) => (
                                                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{learner.name}</div>
                                                        <div className="text-xs text-gray-500">{learner.modules} modules</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-green-600">{learner.progress}%</div>
                                                        <div className="text-[9px] text-gray-400 uppercase font-semibold">Progress</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/register" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg">
                                Start Your Free Trial
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm">
                    &copy; 2026 LMS Platform. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
