import './Programs.css';

const programsData = [
    {
        title: "Strength Training",
        description: "Build muscle and increase power with our state-of-the-art free weights and machines.",
        icon: "💪"
    },
    {
        title: "Cardio & HIIT",
        description: "Burn calories and improve endurance with high-intensity interval training sessions.",
        icon: "🏃‍♂️"
    },
    {
        title: "Yoga & Flexibility",
        description: "Enhance mobility, balance, and mental focus with expert-led yoga classes.",
        icon: "🧘‍♀️"
    }
];

const Programs = () => {
    return (
        <section id="programs" className="programs">
            <div className="container">
                <h2 className="section-title">Our Programs</h2>
                <div className="programs-grid">
                    {programsData.map((program, index) => (
                        <div className="program-card" key={index}>
                            <div className="program-icon">{program.icon}</div>
                            <h3>{program.title}</h3>
                            <p>{program.description}</p>
                            <a href="#join" className="learn-more">Join Now &rarr;</a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Programs;
