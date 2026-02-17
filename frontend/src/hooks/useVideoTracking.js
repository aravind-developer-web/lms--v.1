import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

export const useVideoTracking = (moduleId, duration) => {
    // UI State (for display)
    const [engagementScore, setEngagementScore] = useState(0.0);
    const [isLocked, setIsLocked] = useState(true);

    // Telemetry Refs (Source of Truth for API)
    const activeWatchTimeRef = useRef(0);
    const seekCountRef = useRef(0);
    const focusLossRef = useRef(0);
    const playbackRateRef = useRef(1.0);

    // Internal Refs
    const lastTickRef = useRef(Date.now());
    const isPlayingRef = useRef(false);
    const hiddenStartRef = useRef(null);

    // --- 1. Focus Tracking ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                hiddenStartRef.current = Date.now();
                console.log('👁️ Focus Lost');
            } else {
                if (hiddenStartRef.current) {
                    const lostTime = (Date.now() - hiddenStartRef.current) / 1000;
                    focusLossRef.current += lostTime;
                    console.log(`👁️ Focus Regained (Lost: ${lostTime.toFixed(1)}s)`);
                    hiddenStartRef.current = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // --- 2. Active Watch Time Accumulator (Tick) ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlayingRef.current && !document.hidden) {
                const now = Date.now();
                const delta = (now - lastTickRef.current) / 1000;
                if (delta > 0 && delta < 2) { // Sanity check (ignore large jumps/sleep)
                    activeWatchTimeRef.current += delta;
                }
                lastTickRef.current = now;
            } else {
                lastTickRef.current = Date.now();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- 3. Heartbeat (Every 10s) ---
    useEffect(() => {
        if (!moduleId) return;

        const heartbeat = async () => {
            // Don't send heartbeat if duration is invalid (prevent infinite score)
            if (!duration || duration <= 1) return;

            try {
                // Prepare Payload
                const payload = {
                    module_id: moduleId,
                    active_watch_time: activeWatchTimeRef.current,
                    total_duration: duration || 1,
                    seek_count: seekCountRef.current,
                    playback_rate: playbackRateRef.current,
                    focus_loss: focusLossRef.current
                };

                const response = await api.post('/analytics/engagement/heartbeat/', payload);

                if (response.data.score !== undefined) {
                    setEngagementScore(response.data.score);
                    // Update Lock State
                    // Rule: Score >= 0.8 AND Watched >= 80%
                    const watchedPct = activeWatchTimeRef.current / (duration || 1);
                    const unlocked = response.data.score >= 0.8 && watchedPct >= 0.8;
                    setIsLocked(!unlocked);
                }
            } catch (error) {
                console.warn("Heartbeat failed:", error);
            }
        };

        const timer = setInterval(heartbeat, 10000);
        return () => clearInterval(timer);
    }, [moduleId, duration]); // Dependencies are stable now

    // --- Handlers for Player ---
    const handlePlay = useCallback(() => {
        isPlayingRef.current = true;
        lastTickRef.current = Date.now();
    }, []);

    const handlePause = useCallback(() => {
        isPlayingRef.current = false;
    }, []);

    const handleSeek = useCallback(() => {
        seekCountRef.current += 1;
    }, []);

    const handleRateChange = useCallback((rate) => {
        playbackRateRef.current = rate;
    }, []);

    return {
        metrics: {
            engagementScore,
            isLocked,
            activeWatchTime: activeWatchTimeRef.current // Note: This won't trigger re-renders, use with caution for UI
        },
        handlers: { handlePlay, handlePause, handleSeek, handleRateChange }
    };
};
