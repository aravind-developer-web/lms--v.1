import React, { useRef, useEffect } from 'react';

const Html5Player = ({
    src,
    onPlay,
    onPause,
    onEnded,
    onProgress,
    onDuration,
    onRateChange
}) => {
    const videoRef = useRef(null);

    return (
        <video
            ref={videoRef}
            src={src}
            crossOrigin="anonymous"
            className="w-full h-full object-contain bg-black"
            controls
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onTimeUpdate={(e) => onProgress(e.target.currentTime)}
            onLoadedMetadata={(e) => onDuration(e.target.duration)}
            onRateChange={(e) => onRateChange && onRateChange(e.target.playbackRate)}
        />
    );
};

export default Html5Player;
