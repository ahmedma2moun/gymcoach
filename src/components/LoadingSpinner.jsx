const LoadingSpinner = ({ overlay = false }) => {
    if (overlay) {
        return (
            <div className="spinner-overlay" aria-label="Loading" role="status">
                <div className="spinner"></div>
            </div>
        );
    }

    return <div className="spinner" aria-label="Loading" role="status"></div>;
};

export default LoadingSpinner;
