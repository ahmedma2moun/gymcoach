import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <a href="#" className="logo">
                    GYM<span className="text-primary">X</span>
                </a>

                <div className="menu-icon" onClick={toggleMenu}>
                    <div className={isOpen ? "bar open" : "bar"}></div>
                    <div className={isOpen ? "bar open" : "bar"}></div>
                    <div className={isOpen ? "bar open" : "bar"}></div>
                </div>

                <ul className={isOpen ? "nav-links active" : "nav-links"}>
                    <li><a href="#home" onClick={() => setIsOpen(false)}>Home</a></li>
                    <li><a href="#programs" onClick={() => setIsOpen(false)}>Programs</a></li>
                    <li><a href="#membership" onClick={() => setIsOpen(false)}>Membership</a></li>
                    <li><a href="#about" onClick={() => setIsOpen(false)}>About</a></li>
                    <li><a href="#join" className="btn btn-primary btn-glow" onClick={() => setIsOpen(false)}>Join Now</a></li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
