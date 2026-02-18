import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const AssignmentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [existingSubmissions, setExistingSubmissions] = useState([]);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [moduleRes, submissionRes] = await Promise.all([
                    api.get(`/modules/${id}/`),
                    api.get(`/assignments/modules/${id}/submissions/`).catch(() => ({ data: [] }))
                ]);
                setModule(moduleRes.data);
                setExistingSubmissions(submissionRes.data);
            } catch (error) {
                console.error("Failed to fetch assignment data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!submissionContent.trim()) return;

        try {
            setSubmitting(true);
            await api.post(`/assignments/modules/${id}/submit/`, {
                content: submissionContent
            });
            setSuccess(true);

            // Push Progress Update
            await api.post('/learner-progress/assignment/', {
                module_id: id,
                submitted: true
            }).catch(err => console.error("Progress push failed", err));
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading assignment...</div>;
    if (!module || !module.assignment_prompt) return <div className="p-8 text-center text-red-500">No assignment instructions found for this module.</div>;

    if (success || existingSubmissions.length > 0) {
        const latestSubmission = success ? { content: submissionContent, submitted_at: new Date() } : existingSubmissions[0];
        return (
            <div className="max-w-3xl mx-auto py-20 px-4 text-center">
                <div className="bg-white border border-slate-200 rounded-lg p-12 shadow-lg">
                    <div className="text-3xl font-bold text-green-600 mb-4">Submission Received</div>
                    <p className="text-slate-600 mb-8 italic">"Your work has been submitted and is currently being reviewed."</p>
                    <div className="bg-slate-50 p-6 rounded border border-slate-200 text-left mb-8">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{latestSubmission.content}</p>
                    </div>
                    <button onClick={() => navigate(`/modules/${id}`)} className="bg-blue-600 text-white px-8 py-2 rounded font-semibold hover:bg-blue-700">
                        Back to Module
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10">
                <button onClick={() => navigate(`/modules/${id}`)} className="text-sm text-slate-500 hover:text-slate-900 mb-4">
                    &larr; Back to Module
                </button>
                <h1 className="text-3xl font-bold text-slate-900">Assignment: {module.title}</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-4">Instructions</h3>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {module.assignment_prompt}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-700">
                            Your Submission
                        </div>
                        <textarea
                            value={submissionContent}
                            onChange={(e) => setSubmissionContent(e.target.value)}
                            placeholder="Type your assignment response here..."
                            className="w-full h-80 p-6 focus:outline-none text-slate-800 text-lg leading-relaxed placeholder:text-slate-300"
                            disabled={submitting}
                        />
                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !submissionContent.trim()}
                                className="bg-blue-600 text-white px-8 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssignmentPage;
