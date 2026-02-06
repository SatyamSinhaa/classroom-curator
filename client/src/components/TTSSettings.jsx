import { useState, useEffect } from 'react';

const VOICES = [
    { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'Female' },
    { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'Male' },
    { id: 'en-US-JennyNeural', name: 'Jenny (US Female)', gender: 'Female' },
    { id: 'en-US-EricNeural', name: 'Eric (US Male)', gender: 'Male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'Female' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male' },
];

const API_BASE_URL = 'http://localhost:8000';

const TTSSettings = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [settings, setSettings] = useState({
        voice: 'en-US-AriaNeural',
        rate: 1.0, // 1.0 = 0%, 1.2 = +20%
        pitch: 1.0 // not implementing pitch UI yet, but keeping structure
    });

    useEffect(() => {
        const saved = localStorage.getItem('tts_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse TTS settings", e);
            }
        }
    }, []);

    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('tts_settings', JSON.stringify(newSettings));
    };

    const handlePreview = async () => {
        if (previewLoading) return;
        setPreviewLoading(true);
        try {
            let rateStr = '+0%';
            if (settings.rate) {
                const ratePercent = Math.round((settings.rate - 1) * 100);
                rateStr = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
            }

            const response = await fetch(`${API_BASE_URL}/api/tts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: "Hello, this is a distinct voice for your lesson plans.",
                    voice: settings.voice,
                    rate: rateStr
                }),
            });

            if (!response.ok) throw new Error('Preview failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => URL.revokeObjectURL(url);
            await audio.play();
        } catch (err) {
            console.error("Preview failed", err);
        } finally {
            setPreviewLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
                title="Voice Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Configure Voice</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full m-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Voice Settings</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                    >
                        &times;
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Voice Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Voice
                        </label>
                        <select
                            value={settings.voice}
                            onChange={(e) => saveSettings({ ...settings, voice: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {VOICES.map(voice => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Speed Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Speed
                            </label>
                            <span className="text-sm text-gray-500 font-medium">
                                {settings.rate}x
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={settings.rate}
                            onChange={(e) => saveSettings({ ...settings, rate: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="relative w-full h-4 text-xs text-gray-400 mt-1">
                            <span className="absolute left-0">0.5x</span>
                            <span className="absolute left-1/3 transform -translate-x-1/2">1.0x</span>
                            <span className="absolute right-0">2.0x</span>
                        </div>
                    </div>

                    {/* Preview Button */}
                    <div>
                        <button
                            onClick={handlePreview}
                            disabled={previewLoading}
                            className="w-full flex items-center justify-center space-x-2 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                        >
                            {previewLoading ? (
                                <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            )}
                            <span>Listen to Preview</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TTSSettings;
