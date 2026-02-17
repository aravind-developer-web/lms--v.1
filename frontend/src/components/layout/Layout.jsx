import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarLinks = [
        { name: 'Learning Dashboard', path: '/dashboard', roles: ['learner'] },
        { name: 'My Notes', path: '/my-notes', roles: ['learner'] },
        { name: 'Manager View', path: '/dashboard', roles: ['manager', 'admin'] },
    ];

    const filteredLinks = sidebarLinks.filter(link =>
        !link.roles || (user && link.roles.includes(user.role))
    );

    const isManagerLanding = user?.role === 'manager' && location.pathname === '/dashboard';

    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Top Navigation Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/dashboard" className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-soft">L</div>
                                    <span className="text-lg font-bold text-gray-900 tracking-tight">LMS <span className="text-blue-600">Pro</span></span>
                                </Link>
                            </div>
                            <nav className="hidden md:ml-10 md:flex md:space-x-8 items-center">
                                {filteredLinks.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200 ${isActive
                                                ? 'border-blue-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Profile Section */}
                        <div className="flex items-center">
                            {user && (
                                <div className="ml-3 relative">
                                    <div>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            id="user-menu-button"
                                            aria-expanded="false"
                                            aria-haspopup="true"
                                        >
                                            <span className="sr-only">Open user menu</span>
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="ml-3 hidden md:block text-sm font-medium text-gray-700">{user.username}</span>
                                            <svg className="ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <div
                                            className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none animate-fade-in z-50"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                            tabIndex="-1"
                                        >
                                            <div className="px-4 py-3" role="none">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-bold text-gray-900 truncate" role="none">{user.username}</p>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email || 'No email set'}</p>
                                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {user.role}
                                                </div>
                                            </div>
                                            <div className="py-1" role="none">
                                                <Link
                                                    to="/profile"
                                                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    Your Profile
                                                </Link>
                                            </div>
                                            <div className="py-1" role="none">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full group flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    <svg className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                                    </svg>
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
