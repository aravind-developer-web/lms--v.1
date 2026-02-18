import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const CircularProgress = ({ progress, color }) => {
    const size = 44;
    const strokeWidth = 3.5;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const colors = {
        green: { stroke: '#22c55e', bg: '#f0fdf4', text: '#166534' },
        orange: { stroke: '#f97316', bg: '#fff7ed', text: '#9a3412' },
        red: { stroke: '#ef4444', bg: '#fef2f2', text: '#991b1b' }
    };

    const activeColor = colors[color] || colors.red;

    return (
        <div className="relative flex items-center justify-center group/circle" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={activeColor.stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="none"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black leading-none" style={{ color: activeColor.text }}>
                    {Math.round(progress)}
                </span>
                <span className="text-[6px] font-bold uppercase tracking-tighter opacity-40 -mt-0.5" style={{ color: activeColor.text }}>%</span>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover/circle:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                {progress}% Complete
            </div>
        </div>
    );
};

const ManagerDashboard = () => {
    const { toast, showToast, hideToast } = useToast();
    const [learners, setLearners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLearner, setSelectedLearner] = useState(null);
    const [learnerDetails, setLearnerDetails] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, avgProgress: 0 });

    // Stream Upload State
    const [streamTitle, setStreamTitle] = useState('');
    const [streamUrl, setStreamUrl] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(4); // Default to Week 4
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh grid every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/analytics/manager/week-progress/');
            setLearners(res.data);

            const total = res.data.length;
            // For stats, we can still use some heuristic of 'active' if overall > 0 or just show global average
            const active = res.data.filter(l => l.overall > 0).length;
            const avgProgress = res.data.reduce((acc, l) => acc + (l.overall || 0), 0) / (total || 1);

            setStats({ total, active, avgProgress: Math.round(avgProgress) });
        } catch (error) {
            console.error("Telemetry Sync Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStreamUpload = async (e) => {
        e.preventDefault();
        if (!streamTitle || !selectedWeek) return;

        if (!videoFile && !streamUrl) {
            showToast("Please provide a Video File or URL", "error");
            return;
        }

        setUploading(true);
        try {
            let response;
            if (videoFile) {
                // AI Pipeline Upload
                const formData = new FormData();
                formData.append('title', streamTitle);
                formData.append('week', selectedWeek);
                formData.append('video_file', videoFile);

                response = await api.post('/ai/upload/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast(`AI Pipeline Initiated: ${response.data.status || 'Processing...'}`, "success");
            } else {
                // Legacy URL Upload
                response = await api.post('/modules/stream/upload/', {
                    title: streamTitle,
                    url: streamUrl,
                    week: selectedWeek
                });

                if (response.data.status && response.data.status.includes("AI Offline")) {
                    showToast(response.data.status, "warning");
                } else {
                    showToast(response.data.status, "success");
                }
            }

            setStreamTitle('');
            setStreamUrl('');
            setVideoFile(null);
            setSelectedWeek(4);
            fetchData(); // Refresh to see impact
        } catch (error) {
            console.error("Upload Failed", error);
            if (error.code === 'ERR_CANCELED') return; // Ignore aborted
            showToast("Failed to broadcast stream. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleViewDetails = async (learner) => {
        setSelectedLearner(learner);
        setDrawerOpen(true);
        // Reset details while fetching
        setLearnerDetails(null);
        try {
            const res = await api.get(`/analytics/manager/${learner.id}/learner_details/`);
            setLearnerDetails(res.data);
        } catch (e) {
            console.error("Detail Extraction Error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
            <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Initializing Control Tower...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-20">
            {/* Header: Command Center Overview */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-green-500/50 shadow-sm" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Intelligence System Active</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Control Tower</h1>
                    <p className="text-gray-500 font-medium text-sm">Week-wise progression tracking and deep-dive telemetry.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-intense flex flex-col items-start gap-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Sync</span>
                        <span className="text-xl font-bold">{stats.avgProgress}% <span className="text-[10px] text-green-400">Mastery</span></span>
                    </div>
                    <button
                        onClick={() => window.location.href = '/manager/content-edit'}
                        className="btn-ghost bg-gray-900 border border-gray-900 text-white focus:ring-4 focus:ring-gray-200 focus:outline-none rounded-2xl px-5 py-3 font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Content
                    </button>
                    <button
                        onClick={fetchData}
                        aria-label="Refresh Telemetry Grid"
                        className="btn-ghost bg-white border border-gray-200 focus:ring-4 focus:ring-gray-200 focus:outline-none rounded-2xl px-5 py-3 font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                        Refresh Grid
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                {/* Main Telemetry Grid */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-strong overflow-hidden p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Learner</th>
                                <th className="px-6 py-4 text-center">Week 1</th>
                                <th className="px-6 py-4 text-center">Week 2</th>
                                <th className="px-6 py-4 text-center">Week 3</th>
                                <th className="px-6 py-4 text-center">Week 4</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {learners.map((learner) => (
                                <tr
                                    key={learner.id}
                                    onClick={() => handleViewDetails(learner)}
                                    className="group hover:bg-gray-50/80 transition-all cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-mono text-gray-300 text-sm font-bold">#{learner.rank}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 font-bold text-xs border border-gray-200">
                                                {learner.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{learner.name}</div>
                                                <div className="text-[10px] text-gray-500 font-medium">{learner.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <CircularProgress progress={learner.week1.progress} color={learner.week1.color} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <CircularProgress progress={learner.week2.progress} color={learner.week2.color} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <CircularProgress progress={learner.week3.progress} color={learner.week3.color} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <CircularProgress progress={learner.week4.progress} color={learner.week4.color} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Upload Stream & Actions */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 relative z-10">Broadcast Stream</h3>
                        <p className="text-gray-400 text-xs mb-6 relative z-10">Upload a learning vector. System will push to all learner nodes and recalculate global progress.</p>

                        <form onSubmit={handleStreamUpload} className="space-y-4 relative z-10">
                            <div>
                                <label htmlFor="week-select" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Target Week</label>
                                <select
                                    id="week-select"
                                    value={selectedWeek}
                                    onChange={e => setSelectedWeek(Number(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {[1, 2, 3, 4].map(w => (
                                        <option key={w} value={w}>Week {w}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="stream-title" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Stream Title</label>
                                <input
                                    id="stream-title"
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Advanced Neural Patterns"
                                    value={streamTitle}
                                    onChange={e => setStreamTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="stream-url" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Source URL (Optional)</label>
                                <input
                                    id="stream-url"
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://..."
                                    value={streamUrl}
                                    onChange={e => setStreamUrl(e.target.value)}
                                    disabled={!!videoFile}
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                    <span className="px-2 bg-gray-900 text-gray-500">OR UPLOAD FILE</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="video-file" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Video File (AI Processing)</label>
                                <input
                                    id="video-file"
                                    type="file"
                                    accept="video/*"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    onChange={e => setVideoFile(e.target.files[0])}
                                    disabled={!!streamUrl}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {uploading ? 'Broadcasting...' : 'Upload & Sync'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Simplified Learner Detail Drawer */}
            {drawerOpen && selectedLearner && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 p-8 flex flex-col gap-8 transform transition-transform border-l border-gray-100 animate-slide-in-right font-sans">
                    <header className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/30">
                                {selectedLearner.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedLearner.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${selectedLearner.status === 'active' ? 'bg-green-500' :
                                        selectedLearner.status === 'slow' ? 'bg-orange-500' : 'bg-red-500'
                                        }`} />
                                    <span className="text-sm font-medium text-gray-500 capitalize">{selectedLearner.status} Status</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">&times;</button>
                    </header>

                    {!learnerDetails ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-5 rounded-2xl">
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Time Invested</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{selectedLearner.time_invested}</p>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-2xl">
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Global Rank</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">#{selectedLearner.rank}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Detailed Breakdown</h3>

                                <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        <span className="font-bold text-gray-700">Video Consumption</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{selectedLearner.video_score}%</span>
                                </div>

                                <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                        </div>
                                        <span className="font-bold text-gray-700">Quiz Accuracy</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{selectedLearner.quiz_score}%</span>
                                </div>

                                <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <span className="font-bold text-gray-700">Assignments</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{selectedLearner.assignment_score}%</span>
                                </div>
                            </div>

                            {/* Weekly Trend */}
                            {learnerDetails.weekly_mastery && learnerDetails.weekly_mastery.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Engagement Trend (4 Weeks)</h3>
                                    <div className="grid grid-cols-4 gap-2 h-24 items-end">
                                        {learnerDetails.weekly_mastery.map((week, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-2 group">
                                                <div className="w-full bg-blue-100 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-blue-200" style={{ height: `${Math.max(10, week.score)}%` }}>
                                                    <div className="absolute inset-0 bg-blue-500 opacity-20"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500">{week.week}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Module Breakdown */}
                            {learnerDetails.module_breakdown && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Module Performance</h3>
                                    <div className="space-y-3">
                                        {learnerDetails.module_breakdown.map((mod) => (
                                            <div key={mod.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-gray-900 truncate pr-2">{mod.title}</p>
                                                    <p className="text-[10px] text-gray-500">Video: {mod.video_progress}%</p>
                                                </div>
                                                <div className="flex gap-2 text-[10px]">
                                                    <span className={`px-2 py-1 rounded bg-white border ${mod.quiz_score > 70 ? 'text-green-600 border-green-200' : 'text-gray-500 border-gray-200'}`}>
                                                        Quiz: {mod.quiz_score}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded bg-white border ${mod.assignment_status === 'completed' ? 'text-blue-600 border-blue-200' : 'text-orange-500 border-orange-200'}`}>
                                                        {mod.assignment_status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}
            {drawerOpen && <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setDrawerOpen(false)} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
};

export default ManagerDashboard;
