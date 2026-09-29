"use client";

import Link from "next/link";

const features = [
  ["◎", "Misconception Diagnosis", <>Identify the reasoning behind<br />an incorrect answer</>],
  ["↗", "Adaptive Socratic Help", <>Progress from a probing question<br />to hints and explanations</>],
  ["▤", "Recovery Practice", <>Try a fresh problem to check<br />your understanding</>],
  ["⌁", "Mastery Insights", <>Track learner progress and<br />surface concepts needing help</>],
] as const;

const steps = [
  ["📤", "Ask or Upload", "Type your question or upload a problem"],
  ["🤖", "Get AI Help", "Receive step-by-step explanations"],
  ["☑️", "Practice More", "Solve similar problems and take quizzes"],
  ["📊", "Track Progress", "See your improvement over time"],
] as const;

export default function Home() {
  return (
    <div className="reason-home">
      <section className="reason-hero">
        <div>
          <h1>Reason <span className="reason-gradient">X</span></h1>
          <div className="reason-tag">Your Smart AI Learning Assistant</div>
          <p className="reason-copy">Learn smarter, practice better, solve faster and grow with AI.</p>
          <div className="reason-points"><span>Learn</span><span>Practice</span><span>Solve</span><span>Grow</span></div>
          <Link href="/login" className="reason-btn">Get Started Free →</Link>
        </div>

        <div className="reason-art" aria-hidden="true">
          <div className="reason-float reason-f1">💡</div>
          <div className="reason-float reason-f2">⌘</div>
          <div className="reason-float reason-f3">🎓</div>
          <div className="reason-float reason-f4">▥</div>
          <div className="reason-robot">
            <div className="reason-face">⌣⌣</div>
            <div className="reason-arm reason-arm-left" />
            <div className="reason-arm reason-arm-right" />
            <div className="reason-book" />
          </div>
        </div>
      </section>

      <section className="reason-features" id="features" aria-label="Reason X features">
        {features.map(([icon, title, description]) => (
          <div className="reason-feature" key={title}>
            <div className="reason-ico">{icon}</div>
            <div><h3>{title}</h3><p>{description}</p></div>
          </div>
        ))}
      </section>

      <section className="reason-info" id="about">
        <div className="reason-about-copy">
          <div className="reason-eyebrow">ABOUT</div>
          <h2>Why Reason <span className="reason-gradient">X?</span></h2>
          <p>Reason X is an adaptive learning tutor designed to help students understand why an answer is incorrect, not just mark it wrong. It identifies likely misconceptions, then guides learners through a sequence of questions, hints, and explanations.</p>
          <p>After guidance, students try a fresh recovery question. Their concept mastery and practice history are tracked, while teachers can review class progress and common misconceptions.</p>
          <Link href="/login" className="reason-btn reason-btn-small">Learn More →</Link>
        </div>

        <div className="reason-steps" id="how-it-works">
          <div className="reason-eyebrow">HOW IT WORKS</div>
          <div className="reason-step-grid">
            {steps.map(([icon, title, description], index) => (
              <div className="reason-step" key={title}>
                <div className="reason-step-number">{index + 1}</div>
                <div className="si">{icon}</div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reason-contact" id="contact" aria-labelledby="reason-contact-title">
        <div>
          <div className="reason-eyebrow">CONTACT</div>
          <h2 id="reason-contact-title">Let&apos;s talk about learning.</h2>
          <p>Questions about Reason X or interested in the project? Get in touch.</p>
        </div>
        <a className="reason-contact-link" href="tel:9990099444">
          <span className="reason-contact-icon" aria-hidden="true">☎</span>
          <span><small>Call</small><strong>9990099444</strong></span>
        </a>
        <a className="reason-contact-link" href="mailto:nivethaneloha@gmail.com">
          <span className="reason-contact-icon reason-contact-email-icon" aria-hidden="true">✉</span>
          <span><small>Email</small><strong>nivethaneloha@gmail.com</strong></span>
        </a>
      </section>
    </div>
  );
}
