import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const CircularProgress = ({ value, size = 60, strokeWidth = 4, color = "text-blue-600", trackColor = "text-gray-100" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    className={trackColor}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className="absolute text-xs font-bold text-gray-700">{Math.round(value)}%</span>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        locked: "bg-gray-100 text-gray-400 border-gray-200",
        unlocked: "bg-blue-50 text-blue-600 border-blue-100",
        completed: "bg-green-50 text-green-600 border-green-100",
    };

    const labels = {
        locked: "Locked",
        unlocked: "Unlocked",
        completed: "Completed"
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${styles[status] || styles.locked}`}>
            {labels[status]}
        </span>
    );
};

const LearnerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [progress, setProgress] = useState({});
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // New Aggregated Endpoint
            const response = await api.get('/learner-progress/dashboard/');
            const data = response.data;

            setModules(data.modules);

            // Map progress for compatibility with existing render logic
            const progressMap = {};
            data.modules.forEach(m => {
                progressMap[m.id] = {
                    status: m.status,
                    completion_percent: m.video_percent, // Mapping for circular progress
                    video_percent: m.video_percent,
                    quiz_percent: m.quiz_percent,
                    assignment_percent: m.assignment_percent
                };
            });
            setProgress(progressMap);

            // Map Health
            setHealth({
                score: data.health_score,
                status: data.health_status,
                breakdown: {
                    engagement: data.health_score // Simplified for now
                }
            });

        } catch (error) {
            console.error("Dashboard Sync Failed", error);
            showToast("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    // Derived Stats
    const totalModules = modules.length;
    const completedCount = Object.values(progress).filter(p => p.status === 'completed').length;
    const inProgressCount = Object.values(progress).filter(p => p.status === 'in_progress').length;
    const completionRate = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">LMS Pro <span className="text-gray-400 font-medium">Learning Dashboard</span></h1>
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{user?.username?.[0]}</span>
                    <span className="text-sm font-medium text-gray-600">{user?.username}</span>
                </div>
            </div>

            {/* RESTORED HERO SECTION: Active Stream / Broadcast */}
            {modules.find(m => m.title.startsWith("Broadcast:")) && (
                (() => {
                    const activeStream = modules.find(m => m.title.startsWith("Broadcast:")) || modules[0];
                    return (
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl mb-8">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1 space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-500/30 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        Live Broadcast
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight">{activeStream.title}</h2>
                                    <p className="text-gray-400 max-w-xl">{activeStream.description}</p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            onClick={() => navigate(`/modules/${activeStream.id}`)}
                                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Join Stream
                                        </button>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            {activeStream.duration}m Session
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-80 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50">
                                    {activeStream.video_url?.includes('youtube') ? (
                                        <img src={`https://img.youtube.com/vi/${activeStream.video_url.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt="Stream Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Background FX */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                        </div>
                    );
                })()
            )}

            {/* Top Metrics Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ... Health Card ... */}
                {/* Health Index Card */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Learning Health Index</h2>
                        <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
                            {health?.score >= 80 ? "Great job! Your overall learning performance is strong." :
                                health?.score >= 60 ? "You're doing well, but keep consistent focus." : "Attention needed: Your engagement is dropping."}
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>)}
                        </div>
                    </div>
                    <div className="relative z-10 bg-white p-1 rounded-full shadow-lg">
                        <CircularProgress value={health?.score || 0} size={100} strokeWidth={8} color={health?.score >= 80 ? "text-green-500" : health?.score >= 60 ? "text-yellow-500" : "text-red-500"} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-900">{Math.round(health?.score || 0)}%</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">{health?.status?.replace('_', ' ')}</span>
                        </div>
                    </div>
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>

                {/* Stat Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stats Row 1 */}
                    <div className="col-span-3 grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{Math.round(health?.breakdown?.engagement || 0)}%</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Engagement</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Completion Rate</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{totalModules}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Modules</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row 2 */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">⚡</span>
                        <div>
                            <div className="font-bold text-gray-900">{inProgressCount}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">In Progress</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">⚠️</span>
                        <div>
                            <div className="font-bold text-gray-900">{totalModules - completedCount - inProgressCount}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">Not Started</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">✓</span>
                        <div>
                            <div className="font-bold text-gray-900">{completedCount}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 border-b border-gray-100 pb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md shadow-blue-200">All</button>
                <button className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-full text-xs font-bold transition-colors">In Progress</button>
                <button className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-full text-xs font-bold transition-colors">Completed</button>
            </div>

            {/* Modules Grid */}
            <div className="space-y-10">
                {[1, 2, 3, 4].map(week => {
                    const weekModules = modules.filter(m => m.week === week);
                    if (!weekModules.length) return null;

                    return (
                        <div key={week}>
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Week {week}: Curriculum Stream</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {weekModules.map(module => {
                                    const p = progress[module.id];
                                    const isCompleted = p?.status === 'completed';

                                    // Calculate pseudo-progress for UI if not available
                                    const vidProgress = isCompleted ? 100 : (p?.completion_percent || 0);

                                    return (
                                        <div key={module.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{module.title}</h4>
                                                <StatusBadge status={isCompleted ? 'completed' : 'unlocked'} />
                                            </div>

                                            {/* Granular Circles */}
                                            <div className="flex justify-center gap-6 py-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CircularProgress value={vidProgress} size={50} strokeWidth={4} color="text-blue-500" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Video</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    {module.has_quiz ? (
                                                        module.is_quiz_locked ? (
                                                            <div className="w-[50px] h-[50px] rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                            </div>
                                                        ) : (
                                                            <CircularProgress value={0} size={50} strokeWidth={4} color="text-gray-300" trackColor="text-gray-100" />
                                                        )
                                                    ) : (
                                                        <div className="w-[50px] h-[50px] flex items-center justify-center text-gray-200">--</div>
                                                    )}
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Quiz</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    {module.has_assignment ? (
                                                        module.is_assignment_locked ? (
                                                            <div className="w-[50px] h-[50px] rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                            </div>
                                                        ) : (
                                                            <CircularProgress value={0} size={50} strokeWidth={4} color="text-gray-300" trackColor="text-gray-100" />
                                                        )
                                                    ) : (
                                                        <div className="w-[50px] h-[50px] flex items-center justify-center text-gray-200">--</div>
                                                    )}
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Assig.</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 md:mt-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                    <span className="text-xs font-bold text-gray-500">{isCompleted ? 'Completed' : 'Ready to Start'}</span>
                                                </div>
                                                {isCompleted ? (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">Done</span>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/modules/${module.id}`)}
                                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200"
                                                    >
                                                        {p?.status === 'in_progress' ? 'Resume' : 'Start Lesson'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Hover Effect Background */}
                                            <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LearnerDashboard;
