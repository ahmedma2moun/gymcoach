import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">

                <div className="footer-col">
                    <a href="#" className="logo">
                        GYM<span className="text-primary">X</span>
                    </a>
                    <p className="footer-desc">
                        Transform your body and mind with the best equipment and trainers in the city.
                        Join the revolution today.
                    </p>
                </div>

                <div className="footer-col">
                    <h4>Quick Links</h4>
                    <ul className="footer-links">
                        <li><a href="#home">Home</a></li>
                        <li><a href="#programs">Programs</a></li>
                        <li><a href="#membership">Membership</a></li>
                        <li><a href="#about">About Us</a></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Contact</h4>
                    <ul className="footer-links">
                        <li>123 Fitness Blvd, Gym City</li>
                        <li>(555) 123-4567</li>
                        <li>info@gymx.com</li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Newsletter</h4>
                    <p>Subscribe for latest updates and offers.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Your Email" />
                        <button type="submit" className="btn btn-primary">Subscribe</button>
                    </form>
                </div>

            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} GymX. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
