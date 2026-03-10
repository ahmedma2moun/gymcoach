import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`} role="alert" aria-live="polite">
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose} aria-label="Dismiss notification" type="button">
                ✕
            </button>
        </div>
    );
};

export default Toast;
