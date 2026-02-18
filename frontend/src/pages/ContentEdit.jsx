import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const ContentEdit = () => {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const [weeksData, setWeeksData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ open: false, moduleId: null, title: '' });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        const url = "http://localhost:8000/api/manager/modules/";
        try {
            const res = await api.get(url);
            setWeeksData(res.data);
        } catch (error) {
            console.error("Failed to fetch modules", error);
            if (error.response?.status === 404) {
                console.error(`404 Not Found at: ${url}`);
            }
            showToast("Failed to load content data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (moduleId, title) => {
        setDeleteModal({ open: true, moduleId, title });
    };

    const confirmDelete = async () => {
        const url = `http://localhost:8000/api/manager/modules/${deleteModal.moduleId}/remove/`;
        try {
            await api.patch(url, { is_active: false });
            showToast("Module removed successfully", "success");
            // Optimistic update or refetch
            fetchModules();
        } catch (error) {
            console.error("Soft delete failed", error);
            if (error.response?.status === 404) {
                console.error(`404 Not Found at: ${url}`);
            }
            showToast("Failed to remove module.", "error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
            <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Loading Management Console...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col gap-10 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/manager')}
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
                    >
                        &larr; Back to Control Tower
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Content Management</h1>
                    <p className="text-gray-500 font-medium text-sm">Manage week-wise learning streams. Changes reflect instantly for learners.</p>
                </div>
            </header>

            {/* Weeks List */}
            <div className="grid gap-12">
                {Object.entries(weeksData).map(([weekLabel, modules]) => (
                    <section key={weekLabel} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-gray-900">{weekLabel}</h2>
                            <div className="flex-1 h-[2px] bg-gray-100 rounded-full" />
                        </div>

                        <div className="grid gap-3">
                            {modules && modules.length > 0 ? (
                                modules.map((mod) => (
                                    <div
                                        key={mod.id}
                                        className={`group bg-white border ${mod.is_active ? 'border-gray-100' : 'border-red-100 bg-red-50/10'} rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-100 transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${mod.is_active ? 'bg-gray-50 text-blue-600' : 'bg-red-50 text-red-400'} rounded-xl flex items-center justify-center font-mono text-sm border border-gray-100 transition-colors`}>
                                                ID{mod.id}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${mod.is_active ? 'text-gray-800' : 'text-gray-400 italic'} text-base`}>{mod.title}</span>
                                                {!mod.is_active && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">Inactive (Removed)</span>}
                                            </div>
                                        </div>

                                        {mod.is_active && (
                                            <button
                                                onClick={() => handleDeleteClick(mod.id, mod.title)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all translate-x-3 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"
                                                title="Remove Module"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 grayscale opacity-60">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No videos available for this week</p>
                                </div>
                            )}
                        </div>
                    </section>
                ))}
            </div>

            <ConfirmDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ ...deleteModal, open: false })}
                onConfirm={confirmDelete}
                title="Remove Video?"
                message={`Are you sure you want to remove "${deleteModal.title}"? Learners will no longer see this module.`}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
};

export default ContentEdit;
