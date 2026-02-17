import React from 'react';
import Html5Player from './Html5Player';
import YouTubePlayer from './YouTubePlayer';

const VideoEngine = ({ module, handlers, onProgress, onDuration }) => {
    // Determine type (Prefer explicit type from backend, fallback to URL detection)
    const isYouTube = module.video_type === 'youtube' ||
        (module.video_url && (module.video_url.includes('youtu.be') || module.video_url.includes('youtube.com')));

    const commonProps = {
        onPlay: handlers.handlePlay,
        onPause: handlers.handlePause,
        onEnded: handlers.handleEnded || (() => { }),
        onProgress: onProgress,
        onDuration: onDuration,
        onRateChange: handlers.handleRateChange
    };

    if (isYouTube) {
        return <YouTubePlayer url={module.video_url} {...commonProps} />;
    }

    return <Html5Player src={module.video_file || module.video_url} {...commonProps} />;
};

export default VideoEngine;
