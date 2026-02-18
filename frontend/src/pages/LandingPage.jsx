import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">L</div>
                            <span className="font-bold text-slate-900 tracking-tight">LMS Pro</span>
                        </Link>

                        {/* Center Navigation */}
                        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Features</a>
                            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">About</a>
                            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Pricing</a>
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            {user ? (
                                <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                                        Log in
                                    </Link>
                                    <Link to="/register" className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="py-32 px-6 text-center bg-white border-b border-slate-100">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
                            LEARNER MANAGEMENT <br className="hidden md:block" />
                            <span className="text-blue-600">SYSTEM</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
                            A streamlined learning management system designed for high-performance teams.
                            Track progress, manage modules, and foster growth without the clutter.
                        </p>
                        <div className="flex justify-center">
                            <Link to="/register" className="bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
                                Create Organization Account
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {/* Feature 1 */}
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Module Tracking</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Intuitive module management for learners to follow their curriculum step-by-step with clear progress indicators.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mx-auto">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Manager Insights</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Granular data for managers to oversee team progress, identify bottlenecks, and drive interventions effectively.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mx-auto">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Study Notes</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Integrated workspace for learners to capture insights, saved directly within their personal learning environment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">
                            Start Your Free Trial Today
                        </h2>
                        <Link to="/register" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                            Create Organization Account
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm">
                        &copy; 2026 LMS Pro. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">Privacy Policy</a>
                        <a href="#" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
