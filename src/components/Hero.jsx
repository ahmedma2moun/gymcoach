import './Hero.css';

const Hero = () => {
    return (
        <section id="home" className="hero">
            <div className="hero-overlay"></div>
            <div className="container hero-content">
                <h1>
                    UNLEASH YOUR <br />
                    <span className="text-outline">POTENTIAL</span>
                </h1>
                <p className="hero-subtitle">
                    Join the elite fitness community. Professional trainers,
                    state-of-the-art equipment, and a vibe that drives results.
                </p>
                <div className="hero-btns">
                    <a href="#join" className="btn btn-primary">Start Free Trial</a>
                    <a href="#about" className="btn btn-outline">Learn More</a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
