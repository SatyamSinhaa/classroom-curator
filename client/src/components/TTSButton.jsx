import { useState, useRef, useEffect } from 'react';

// Global audio tracking to ensure only one plays at a time
let currentAudio = null;
let setStopCurrent = null;

const API_BASE_URL = 'http://localhost:8000';

const TTSButton = ({ text }) => {
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (playing && audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [playing]);

    const handlePlay = async (e) => {
        e.stopPropagation(); // Prevent triggering parent click events

        if (playing) {
            // Stop logic
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlaying(false);
            return;
        }

        // Stop currently playing if any
        if (currentAudio) {
            currentAudio.pause();
            if (setStopCurrent) setStopCurrent(false);
        }

        setLoading(true);
        try {
            // Get settings from local storage
            let voice = 'en-US-AriaNeural';
            let rateStr = '+0%';
            let pitchStr = '+0Hz';

            try {
                const saved = localStorage.getItem('tts_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    if (settings.voice) voice = settings.voice;
                    if (settings.rate) {
                        const ratePercent = Math.round((settings.rate - 1) * 100);
                        rateStr = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
                    }
                    if (settings.pitch) {
                        // Future implementation for pitch if needed
                    }
                }
            } catch (e) {
                console.error("Error reading TTS settings", e);
            }

            const response = await fetch(`${API_BASE_URL}/api/tts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice, rate: rateStr, pitch: pitchStr }),
            });

            if (!response.ok) throw new Error('TTS failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => {
                setPlaying(false);
                if (currentAudio === audio) {
                    currentAudio = null;
                    setStopCurrent = null;
                }
                URL.revokeObjectURL(url); // Cleanup memory
            };

            audioRef.current = audio;
            currentAudio = audio;
            // We need to capture the setPlaying function of this instance
            const mySetPlaying = setPlaying;
            setStopCurrent = (val) => mySetPlaying(val);

            await audio.play();
            setPlaying(true);
        } catch (err) {
            console.error(err);
            alert("Failed to play audio");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePlay}
            disabled={loading}
            className={`p-1.5 rounded-full transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-1 ${playing
                ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-500'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-500'
                }`}
            title={playing ? "Stop reading" : "Read aloud"}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : playing ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            )}
        </button>
    );
};

export default TTSButton;
