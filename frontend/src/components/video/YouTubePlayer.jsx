import React, { useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = ({
    url,
    onPlay,
    onPause,
    onEnded,
    onProgress,
    onDuration,
    onRateChange
}) => {
    const playerRef = useRef(null);
    const progressInterval = useRef(null);

    // Get Video ID from URL
    const getVideoId = (url) => {
        if (!url) return null;
        try {
            // Handle standard youtube links
            if (url.includes('youtu.be')) return url.split('/').pop().split('?')[0];
            const urlObj = new URL(url);
            return urlObj.searchParams.get('v');
        } catch (e) { return null; }
    };
    const videoId = getVideoId(url);

    const onPlayerReady = (event) => {
        playerRef.current = event.target;
        const duration = event.target.getDuration();
        onDuration(duration);
    };

    const onPlayerStateChange = (event) => {
        // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        const player = event.target;
        const state = event.data;

        if (state === 1) { // Playing
            onPlay();
            // Start polling for progress
            if (progressInterval.current) clearInterval(progressInterval.current);
            progressInterval.current = setInterval(() => {
                const currentTime = player.getCurrentTime();
                onProgress(currentTime);
            }, 1000);
        } else if (state === 2) { // Paused
            onPause();
            if (progressInterval.current) clearInterval(progressInterval.current);
        } else if (state === 0) { // Ended
            onEnded && onEnded();
            if (progressInterval.current) clearInterval(progressInterval.current);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, []);

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0
        },
    };

    if (!videoId) {
        return <div className="text-white flex items-center justify-center h-full">Invalid YouTube URL</div>;
    }

    return (
        <div className="w-full h-full bg-black">
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
};

export default YouTubePlayer;
