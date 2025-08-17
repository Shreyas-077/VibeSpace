import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const FilterAdmin = () => {
    const [stats, setStats] = useState(null);
    const [config, setConfig] = useState({
        strictMode: false,
        toxicityThreshold: 0.7,
        sentimentThreshold: -3,
        filterMode: 'asterisk',
        enableAIAnalysis: true
    });
    const [testText, setTestText] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [customWords, setCustomWords] = useState('');
    const [wordType, setWordType] = useState('profanity');
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchFilteredMessages();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axiosInstance.get('/api/filter/stats');
            setStats(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch filter statistics');
        }
    };

    const fetchFilteredMessages = async () => {
        try {
            const response = await axiosInstance.get('/api/filter/messages?limit=10');
            setFilteredMessages(response.data.data.messages);
        } catch (error) {
            toast.error('Failed to fetch filtered messages');
        }
    };

    const updateConfig = async () => {
        try {
            setLoading(true);
            await axiosInstance.put('/api/filter/config', config);
            toast.success('Configuration updated successfully');
            fetchStats();
        } catch (error) {
            toast.error('Failed to update configuration');
        } finally {
            setLoading(false);
        }
    };

    const testFilter = async () => {
        if (!testText.trim()) {
            toast.error('Please enter text to test');
            return;
        }

        try {
            setLoading(true);
            const response = await axiosInstance.post('/api/filter/test', { text: testText });
            setTestResult(response.data);
        } catch (error) {
            toast.error('Failed to test filter');
        } finally {
            setLoading(false);
        }
    };

    const addCustomWords = async () => {
        if (!customWords.trim()) {
            toast.error('Please enter words to add');
            return;
        }

        try {
            setLoading(true);
            const words = customWords.split(',').map(word => word.trim()).filter(word => word);
            await axiosInstance.post('/api/filter/words', { words, type: wordType });
            toast.success(`Added ${words.length} words to ${wordType}`);
            setCustomWords('');
            fetchStats();
        } catch (error) {
            toast.error('Failed to add custom words');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'severe': return 'text-red-600 bg-red-100';
            case 'moderate': return 'text-orange-600 bg-orange-100';
            case 'mild': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-green-600 bg-green-100';
        }
    };

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">AI Profanity Filter Admin</h1>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-base-100 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Total Messages</h3>
                            <p className="text-3xl font-bold text-primary">{stats.database.totalMessages}</p>
                        </div>
                        <div className="bg-base-100 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Filtered Messages</h3>
                            <p className="text-3xl font-bold text-warning">{stats.database.filteredMessages}</p>
                        </div>
                        <div className="bg-base-100 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Filter Rate</h3>
                            <p className="text-3xl font-bold text-info">{stats.database.filterRate}</p>
                        </div>
                        <div className="bg-base-100 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-2">Custom Words</h3>
                            <p className="text-3xl font-bold text-secondary">{stats.basic.customWords}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Configuration */}
                    <div className="bg-base-100 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Filter Configuration</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer">
                                    <span className="label-text">Strict Mode</span>
                                    <input 
                                        type="checkbox" 
                                        className="toggle toggle-primary" 
                                        checked={config.strictMode}
                                        onChange={(e) => setConfig({...config, strictMode: e.target.checked})}
                                    />
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer">
                                    <span className="label-text">Enable AI Analysis</span>
                                    <input 
                                        type="checkbox" 
                                        className="toggle toggle-primary" 
                                        checked={config.enableAIAnalysis}
                                        onChange={(e) => setConfig({...config, enableAIAnalysis: e.target.checked})}
                                    />
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Toxicity Threshold</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.1"
                                    className="range range-primary" 
                                    value={config.toxicityThreshold}
                                    onChange={(e) => setConfig({...config, toxicityThreshold: parseFloat(e.target.value)})}
                                />
                                <div className="text-sm text-gray-500">{config.toxicityThreshold}</div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Filter Mode</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value={config.filterMode}
                                    onChange={(e) => setConfig({...config, filterMode: e.target.value})}
                                >
                                    <option value="asterisk">Replace with asterisks</option>
                                    <option value="replace">Replace with alternatives</option>
                                    <option value="block">Block messages</option>
                                    <option value="warn">Warn only</option>
                                </select>
                            </div>

                            <button 
                                className="btn btn-primary w-full"
                                onClick={updateConfig}
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Update Configuration'}
                            </button>
                        </div>
                    </div>

                    {/* Test Filter */}
                    <div className="bg-base-100 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Test Filter</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Test Text</span>
                                </label>
                                <textarea 
                                    className="textarea textarea-bordered h-24"
                                    placeholder="Enter text to test the filter..."
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                />
                            </div>

                            <button 
                                className="btn btn-primary w-full"
                                onClick={testFilter}
                                disabled={loading}
                            >
                                {loading ? 'Testing...' : 'Test Filter'}
                            </button>

                            {testResult && (
                                <div className="bg-base-200 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">Test Results:</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Original:</strong> {testResult.originalText}</div>
                                        <div><strong>Filtered:</strong> {testResult.result.filteredText}</div>
                                        <div><strong>Was Filtered:</strong> {testResult.result.wasFiltered ? 'Yes' : 'No'}</div>
                                        <div><strong>Blocked:</strong> {testResult.result.blocked ? 'Yes' : 'No'}</div>
                                        <div><strong>Severity:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded text-xs ${getSeverityColor(testResult.result.analysis.severity)}`}>
                                                {testResult.result.analysis.severity}
                                            </span>
                                        </div>
                                        <div><strong>Risk Score:</strong> {(testResult.result.analysis.riskScore * 100).toFixed(1)}%</div>
                                        <div><strong>Confidence:</strong> {(testResult.result.analysis.confidence * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Words */}
                    <div className="bg-base-100 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Manage Custom Words</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Word Type</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value={wordType}
                                    onChange={(e) => setWordType(e.target.value)}
                                >
                                    <option value="profanity">Profanity (will be filtered)</option>
                                    <option value="whitelist">Whitelist (will not be filtered)</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Words (comma-separated)</span>
                                </label>
                                <textarea 
                                    className="textarea textarea-bordered h-24"
                                    placeholder="Enter words separated by commas..."
                                    value={customWords}
                                    onChange={(e) => setCustomWords(e.target.value)}
                                />
                            </div>

                            <button 
                                className="btn btn-secondary w-full"
                                onClick={addCustomWords}
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Words'}
                            </button>
                        </div>
                    </div>

                    {/* Recent Filtered Messages */}
                    <div className="bg-base-100 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Recent Filtered Messages</h2>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {filteredMessages.map((message) => (
                                <div key={message._id} className="border border-base-300 p-3 rounded">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(message.filterAnalysis?.severity)}`}>
                                            {message.filterAnalysis?.severity || 'unknown'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(message.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <div><strong>Filtered:</strong> {message.text}</div>
                                        {message.filterAnalysis?.originalText && (
                                            <div className="text-gray-500">
                                                <strong>Original:</strong> {message.filterAnalysis.originalText}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterAdmin;
