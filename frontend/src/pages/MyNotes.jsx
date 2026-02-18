import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await api.get('/notes/list/');
                setNotes(response.data);
            } catch (error) {
                console.error("Failed to fetch notes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    const handleOpenNote = (note) => {
        // Safe extraction of module ID
        // Supports both flat ID (note.module_id) and nested object usage (note.module)
        let moduleId = note.module_id || note.module;

        // Handle object case if serializer returns nested object
        if (typeof moduleId === 'object' && moduleId !== null) {
            moduleId = moduleId.id;
        }

        console.log("📝 Note Clicked:", note);

        if (!moduleId) {
            console.error("❌ Note Navigation Error: Missing module ID in note object.", note);
            return;
        }

        navigate(`/modules/${moduleId}`);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500">
                Loading your notes...
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="heading-h1 mb-3">Knowledge Journal</h1>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">
                        Click any note to reopen and continue writing.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        onClick={() => handleOpenNote(note)}
                        className="cursor-pointer relative bg-white border border-gray-100 rounded-3xl p-8 shadow-soft hover:shadow-intense transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />

                        <div className="flex items-center justify-between mb-6">
                            <span className="label-caps tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/50">
                                {note.module_title}
                            </span>
                        </div>

                        <p className="text-gray-700 leading-relaxed font-medium italic line-clamp-4">
                            {note.content}
                        </p>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Last Edited
                            </span>
                            <time className="text-[10px] font-bold text-gray-400 uppercase">
                                {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                            </time>
                        </div>
                    </div>
                ))}
            </div>

            {notes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                        No notes yet.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Start a module to begin writing insights.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MyNotes;
