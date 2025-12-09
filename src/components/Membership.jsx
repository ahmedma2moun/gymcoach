import './Membership.css';

const Membership = () => {
    return (
        <section id="membership" className="membership">
            <div className="container">
                <h2 className="section-title">Membership Plans</h2>
                <div className="pricing-grid">

                    <div className="pricing-card">
                        <h3>Basic</h3>
                        <div className="price">$29<span>/mo</span></div>
                        <ul className="features">
                            <li>✅ Gym Access</li>
                            <li>✅ Locker Room</li>
                            <li>❌ Group Classes</li>
                            <li>❌ Personal Trainer</li>
                        </ul>
                        <a href="#join" className="btn btn-outline">Choose Basic</a>
                    </div>

                    <div className="pricing-card highlighted">
                        <div className="badge">Best Value</div>
                        <h3>Pro</h3>
                        <div className="price">$59<span>/mo</span></div>
                        <ul className="features">
                            <li>✅ Gym Access</li>
                            <li>✅ Locker Room</li>
                            <li>✅ Group Classes</li>
                            <li>✅ 1 Free PT Session</li>
                        </ul>
                        <a href="#join" className="btn btn-primary">Choose Pro</a>
                    </div>

                    <div className="pricing-card">
                        <h3>Elite</h3>
                        <div className="price">$99<span>/mo</span></div>
                        <ul className="features">
                            <li>✅ 24/7 Access</li>
                            <li>✅ Private Locker</li>
                            <li>✅ Unlimited Classes</li>
                            <li>✅ Weekly PT Plan</li>
                        </ul>
                        <a href="#join" className="btn btn-outline">Choose Elite</a>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Membership;
