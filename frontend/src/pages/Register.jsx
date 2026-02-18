import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'learner'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Username or email might already be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-20 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl shadow-gray-200/50 p-12 border border-gray-200/60">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-blue-500/20" role="img" aria-label="LMS Platform Logo">L</div>
                    <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Create Associate Profile</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Join our global enterprise learning ecosystem</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="first_name">Given Name</label>
                        <input
                            id="first_name"
                            name="first_name"
                            type="text"
                            value={formData.first_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 focus:bg-white outline-none transition-all text-sm"
                            placeholder="John"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="last_name">Surname</label>
                        <input
                            id="last_name"
                            name="last_name"
                            type="text"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 focus:bg-white outline-none transition-all text-sm"
                            placeholder="Doe"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="username">Network Identity</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 focus:bg-white outline-none transition-all text-sm"
                            placeholder="johndoe.ext"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="email">Corporate Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 focus:bg-white outline-none transition-all text-sm"
                            placeholder="john.doe@enterprise.com"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="password">Security Protocol</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 focus:bg-white outline-none transition-all text-sm placeholder:text-gray-300"
                            placeholder="••••••••"
                        />
                        {formData.password && formData.password.length < 8 && (
                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tight">Security Note: Recommend 8+ characters</p>
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Access Privilege</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'learner' })}
                                className={`py-3.5 rounded-lg font-bold border transition-all text-sm ${formData.role === 'learner' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-200'}`}
                            >
                                LEARNER
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'manager' })}
                                className={`py-3.5 rounded-lg font-bold border transition-all text-sm ${formData.role === 'manager' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-900'}`}
                            >
                                MANAGER
                            </button>
                        </div>
                    </div>
                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? 'Committing network profile...' : 'Finalize Registration'}
                        </button>
                        <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                            Already authenticated? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In Instead</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
