import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!employeeId.trim()) {
            setError('Please enter your Employee ID');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onLogin(employeeId.trim());
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Failed to load license data. Please check your Employee ID and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setEmployeeId(e.target.value);
        if (error) setError(''); // Clear error when user starts typing
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>License Center</h2>
                    <p>Enter your Employee ID to access your software licenses</p>
                </div>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="employeeId">Employee ID</label>
                        <input
                            type="text"
                            id="employeeId"
                            value={employeeId}
                            onChange={handleInputChange}
                            placeholder="e.g. 00654321"
                            className={error ? 'error' : ''}
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && <span className="error-message">{error}</span>}
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button" 
                        disabled={isLoading || !employeeId.trim()}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Loading Licenses...
                            </>
                        ) : (
                            'Access License Center'
                        )}
                    </button>
                </form>

                <div className="login-help">
                    <p>
                        <strong>Need help?</strong><br />
                        You can find your Employee ID on your Employee Card.
                    </p>
                </div>
            </div>
        </div>
    );
};
