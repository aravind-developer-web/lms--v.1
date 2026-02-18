import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoEngine from '../components/video/VideoEngine';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useVideoTracking } from '../hooks/useVideoTracking';
import Toast from '../components/Toast';

const ModulePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState(0);
    const { toast, showToast, hideToast } = useToast();

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modRes, notesRes] = await Promise.all([
                    api.get(`/modules/${id}/`),
                    api.get(`/notes/module/${id}/`).catch(() => ({ data: { content: '' } }))
                ]);
                setModule(modRes.data);
                setNotes(notesRes.data.content || '');
            } catch (error) {
                console.error("Error fetching module:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Initialize Tracking Hook
    const { metrics, handlers } = useVideoTracking(id, duration);
    const [videoProgress, setVideoProgress] = useState(0);

    // Adapter: VideoEngine emits seconds, UI needs percentage
    const handleProgress = (currentTime) => {
        if (duration > 0) {
            const pct = (currentTime / duration) * 100;
            setVideoProgress(pct);
        }
    };

    // Heartbeat: Send progress every 5s if changed > 2%
    useEffect(() => {
        const interval = setInterval(() => {
            if (duration > 0 && videoProgress > 0) {
                const lastSent = parseFloat(sessionStorage.getItem(`progress_${id}`) || '0');
                if (videoProgress - lastSent >= 2 || videoProgress >= 95) {
                    api.post('/learner-progress/video/', {
                        module_id: id,
                        progress_percent: videoProgress
                    }).then(() => {
                        sessionStorage.setItem(`progress_${id}`, videoProgress);
                        if (videoProgress >= 95) showToast("Progress Saved: Completed!", "success");
                    }).catch(err => console.error("Heartbeat failed", err));
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [id, duration, videoProgress]);

    const handleDuration = (d) => {
        setDuration(d);
    };

    const handleVideoEnd = () => {
        showToast("Video Completed!", "success");
    };

    const handleSaveNotes = async () => {
        try {
            await api.post(`/notes/module/${id}/save/`, { content: notes });
            showToast("Notes saved successfully", "success");
        } catch (error) {
            showToast("Failed to save notes", "error");
        }
    };

    if (loading) return <div className="text-center py-20">Loading Module...</div>;
    if (!module) return <div className="text-center py-20">Module Not Found</div>;

    console.log("📺 Player Debug:", {
        url: module.video_url,
        isLocked: metrics.isLocked,
        duration,
        progress: videoProgress
    });

    // Determine Lock States
    // If backend says locked, we respect it. 
    // BUT we also use local engagement score for immediate feedback.
    const isQuizLocked = (module.is_quiz_locked && metrics.isLocked);
    const isAssignmentLocked = module.is_assignment_locked;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Engagement Score: <span className={metrics.engagementScore >= 0.8 ? "text-green-600" : "text-amber-600"}>
                                {Math.round(metrics.engagementScore * 100)}%
                            </span>
                        </span>
                        {isQuizLocked && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Quiz Locked</span>}
                    </div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-900 font-bold">
                    &larr; Back to Dashboard
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Main Content */}
                <div className="space-y-6">
                    {/* Video Player */}
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative">
                        <VideoEngine
                            module={module}
                            handlers={handlers}
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                            onEnded={handleVideoEnd}
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border transition-all ${!isQuizLocked ? 'bg-blue-50 border-blue-100 cursor-pointer hover:shadow-md' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${!isQuizLocked ? 'text-blue-700' : 'text-gray-500'}`}>Knowledge Check</h3>
                                {isQuizLocked ? (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                )}
                            </div>
                            <button
                                disabled={isQuizLocked}
                                onClick={() => navigate(`/modules/${id}/quiz`)}
                                className={`w-full py-2 rounded-lg text-xs font-bold ${!isQuizLocked ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            >
                                {isQuizLocked ? 'Locked (Watch Video)' : 'Start Quiz'}
                            </button>
                        </div>

                        <div className={`p-4 rounded-xl border transition-all ${!isAssignmentLocked ? 'bg-purple-50 border-purple-100 cursor-pointer hover:shadow-md' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${!isAssignmentLocked ? 'text-purple-700' : 'text-gray-500'}`}>Assignment</h3>
                                {isAssignmentLocked ? (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                )}
                            </div>
                            <button
                                disabled={isAssignmentLocked}
                                onClick={() => navigate(`/modules/${id}/assignment`)}
                                className={`w-full py-2 rounded-lg text-xs font-bold ${!isAssignmentLocked ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            >
                                {isAssignmentLocked ? 'Locked (Pass Quiz)' : 'View Assignment'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Notes & Manual Actions */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                        {/* Manual Override for Legacy Support */}
                        <div className="flex flex-col gap-2">
                            <h3 className="font-bold text-gray-900">Session Controls</h3>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post(`/modules/${id}/complete/`);
                                        showToast("Module marked as complete!", "success");
                                        navigate('/dashboard');
                                    } catch {
                                        showToast("Completion failed", "error");
                                    }
                                }}
                                className="w-full bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Mark as Complete
                            </button>
                            <p className="text-[10px] text-gray-400 text-center">Use this if automatic tracking fails.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-4">Smart Notes</h3>
                        <textarea
                            className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Take notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <button
                            onClick={handleSaveNotes}
                            className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                        >
                            Save Notes
                        </button>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div >
    );
};

export default ModulePlayer;
