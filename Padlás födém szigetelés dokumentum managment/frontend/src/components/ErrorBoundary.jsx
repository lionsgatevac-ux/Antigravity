import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
                    <h1>Sajnáljuk, hiba történt.</h1>
                    <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '5px', marginTop: '20px' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Oldal frissítése
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '20px', marginLeft: '10px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Vissza a főoldalra
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
