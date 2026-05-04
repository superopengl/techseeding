import React, { useEffect } from "react";
import { Typography } from "antd";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { setPageTitle } from "../utils/setPageTitle";

const { Title, Paragraph, Text } = Typography;

const section = {
  marginBottom: 32,
};

const sectionTitle = {
  fontFamily: "'Baloo 2', cursive",
  color: "#2d3748",
  marginBottom: 8,
};

export function TermsOfUsePage() {
  useEffect(() => { setPageTitle("Terms of Use"); }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/"><Logo size={56} style={{ marginInline: "auto" }} /></Link>
        </div>

        <Title
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: 40,
            color: "#2d3748",
            marginBottom: 8,
          }}
        >
          Terms of Use
        </Title>
        <Text style={{ color: "#718096", fontSize: 14 }}>
          Last updated: 4 May 2026
        </Text>

        <div style={{ marginTop: 40 }}>
          <div style={section}>
            <Title level={3} style={sectionTitle}>
              1. Acceptance of Terms
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              By accessing or using KidPlayAI ("the Platform"), operated by
              Techseeding PTY LTD (ABN 35631597450 / ACN 631597450), you agree
              to be bound by these Terms of Use. If you are under 18, your
              parent or guardian must agree to these terms on your behalf. If you
              do not agree to these terms, please do not use the Platform.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              2. About KidPlayAI
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI is an AI-powered craft making platform designed for children
              aged 8–12. Students describe craft ideas in natural language, and an
              AI assistant (powered by the DeepSeek language model running through the open-source OpenCode agent) generates HTML, CSS,
              and JavaScript code to create playable browser crafts. The Platform
              is intended for educational and creative purposes.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              3. Account and Access
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Access to KidPlayAI requires administrator approval. To request
              access, students provide their first name and receive a one-time
              code upon approval. You agree to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>Provide accurate information when requesting access</li>
              <li>Not share your access credentials with others</li>
              <li>
                Not attempt to access another student's sandbox or session
              </li>
              <li>Notify an administrator if you suspect unauthorised access</li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We reserve the right to suspend or revoke access at any time and
              for any reason.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              4. Login Methods and Approval Etiquette
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI offers two ways to sign in:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                <strong>Name-and-approval (in-class):</strong> a student enters
                their first name and waits for an administrator (typically a
                teacher) to approve the request. This method is encouraged
                during scheduled class time, as it gives the teacher a
                seamless way to onboard, supervise, and manage the whole
                class in a single session.
              </li>
              <li>
                <strong>Email login (after class / self-service):</strong>{" "}
                outside of class hours, the email-based login is the
                preferred method. It is fully self-service, does not depend
                on a third party being online, and is the recommended way to
                access the Platform from home.
              </li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Teachers and other administrators are not obligated to approve
              login requests in real time outside of scheduled class time or
              business hours. Repeatedly contacting (or "spamming") a teacher
              off-hours via any channel — phone, messaging app, email, or in
              person — to chase a pending login approval is not permitted, and
              we ask that students respect their teacher's personal time. If a
              name-and-approval request remains pending outside of class,
              please use the email login instead.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              5. Sessions, Devices, and Logout
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We encourage students to use their own personal devices to
              access KidPlayAI. To make that experience seamless, the
              Platform may issue long-lived authentication sessions so that
              you don't need to sign in repeatedly between visits. This
              convenience is intended for personal devices that you control.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              When using KidPlayAI on a public, shared, or borrowed device —
              for example, a school computer, a library terminal, or a
              friend's tablet — you should log out immediately after each
              session by tapping your avatar and selecting <strong>Logout</strong>.
              Failing to log out on a shared device may allow the next user
              to access your account, sandboxes, conversations, and crafts.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              You acknowledge and agree that:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                The choice to remain logged in on any given device is yours,
                and you accept the security risks of that choice.
              </li>
              <li>
                It is your responsibility to log out promptly whenever you
                finish using a device that is not exclusively yours.
              </li>
              <li>
                Techseeding PTY LTD accepts no responsibility for
                unauthorised access, account compromise, lost work, or any
                other consequences arising from a failure to log out on a
                shared or public device.
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              6. Screen Time and User Wellbeing
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI is intentionally designed without built-in screen-time
              controls or session limits. The Platform does not track,
              restrict, or warn about how long a student spends using it.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Students, parents, and guardians are responsible for managing
              their own (or their child's) screen time, posture, breaks, and
              overall device usage in line with what is healthy and
              age-appropriate. We strongly recommend that an adult sets
              reasonable session limits, encourages regular breaks, and
              supervises the student's overall device use.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              If you experience any physical or emotional discomfort while
              using KidPlayAI — including but not limited to eye strain,
              headaches, fatigue, motion sickness, repetitive-strain
              symptoms, or distress caused by AI-generated content — you
              should stop using the Platform immediately and seek
              appropriate help (a parent or guardian, medical professional,
              school counsellor, or another trusted adult). To the maximum
              extent permitted by law, Techseeding PTY LTD accepts no
              responsibility for any such discomfort, or for consequences
              arising from extended or otherwise unmanaged use of the
              Platform.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              7. Acceptable Use
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              When using KidPlayAI, you agree not to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Use the Platform for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Attempt to bypass sandbox restrictions, access files outside your
                designated folder, or manipulate the AI to perform restricted
                actions
              </li>
              <li>
                Submit content that is harmful, abusive, threatening, obscene, or
                otherwise inappropriate for a children's platform
              </li>
              <li>
                Attempt to overload, disrupt, or interfere with the Platform or
                its infrastructure
              </li>
              <li>
                Use the AI assistant to generate content unrelated to craft
                creation (e.g., homework, personal information gathering)
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract the source
                code of the Platform
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              8. Account Ownership and Sharing
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI accounts are personal. The AI terminal, your
              sandbox(es), and any crafts associated with them may only be
              used by the registered account holder — in most cases a paying
              subscriber, or an invited guest of an active subscription. You
              agree not to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Share your login credentials, sandbox URL, or active session
                with anyone outside your immediate household
              </li>
              <li>
                Allow another person to operate the AI terminal on your behalf
              </li>
              <li>
                Use a single account as a shared resource for multiple
                students, classmates, or third parties
              </li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              A student account may create an unlimited number of sandboxes
              for personal use; however, those sandboxes must be operated by
              the account owner only. If we detect that an account is being
              shared or otherwise used by anyone other than its registered
              owner, we reserve the right to suspend or permanently terminate
              the account and to recover any costs reasonably attributable to
              the unauthorised use (see Section 9).
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              9. Fair Use, Resource Limits, and Service Charges
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Individual sandboxes do not currently carry a hard cap on LLM
              tokens, compute, or storage. Instead, a reasonable fair-use
              quota is monitored across each account. We reserve the right to
              charge for usage that materially exceeds reasonable limits,
              calculated based on the LLM model and infrastructure consumed
              at the time of use. Where applicable, we will make best efforts
              to notify you before such charges are applied.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Malicious or abusive usage — including but not limited to
              scripted or automated abuse, deliberate attempts to exhaust
              LLM tokens, bypassing sandbox restrictions, or otherwise
              overconsuming server infrastructure (CPU, memory, disk,
              database, network, or LLM tokens) — may result in:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Immediate suspension or permanent termination of your account
              </li>
              <li>
                A demand for repayment of all costs caused by such usage,
                including LLM token fees paid to upstream providers; compute,
                storage, network, and database charges incurred on cloud
                infrastructure; and reasonable administrative and
                investigation costs
              </li>
              <li>
                Legal action to recover the above amounts where voluntary
                repayment is not made
              </li>
            </ul>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              By continuing to use KidPlayAI, you agree to be financially
              responsible for any costs reasonably attributable to abuse or
              unauthorised use of your account.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              10. AI-Generated Content
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Crafts and code created through KidPlayAI are generated by an AI
              assistant based on user prompts. You acknowledge that:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                AI-generated content may not always be accurate, complete, or
                free of errors
              </li>
              <li>
                The AI operates within a restricted sandbox and may not fulfil
                all requests
              </li>
              <li>
                We do not guarantee that generated crafts will work perfectly on
                all devices or browsers
              </li>
              <li>
                Administrators may review AI interactions for safety and quality
                assurance
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              11. Intellectual Property
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Platform:</strong> The KidPlayAI platform, its design,
              branding, and underlying technology are the property of Techseeding
              PTY LTD and are protected by intellectual property laws.
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              <strong>Student-Created Crafts:</strong> Crafts created by students
              using KidPlayAI are owned by the student (or their parent/guardian).
              However, by using the Platform you grant Techseeding PTY LTD a
              non-exclusive, royalty-free licence to store, display, and host
              your crafts as part of the service, and to showcase anonymised
              examples for promotional purposes.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              12. Privacy
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Your use of KidPlayAI is also governed by our{" "}
              <a
                href="/privacy_policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#43b88c", fontWeight: 600 }}
              >
                Privacy Policy
              </a>
              , which describes how we collect, use, and protect your
              information. By using the Platform, you consent to the practices
              described in the Privacy Policy.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              13. Disclaimers
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              KidPlayAI is provided on an "as is" and "as available" basis. To the
              maximum extent permitted by Australian law, Techseeding PTY LTD
              disclaims all warranties, express or implied, including but not
              limited to:
            </Paragraph>
            <ul style={{ color: "#4a5568", lineHeight: 2.2, paddingLeft: 24 }}>
              <li>
                Fitness for a particular purpose or merchantability
              </li>
              <li>
                Uninterrupted or error-free operation of the Platform
              </li>
              <li>
                Accuracy or reliability of AI-generated content
              </li>
              <li>
                Security of data beyond our reasonable technical measures
              </li>
            </ul>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              14. Limitation of Liability
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              To the maximum extent permitted by law, Techseeding PTY LTD shall
              not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising out of or related to your use of
              KidPlayAI. Our total liability for any claim arising from the use of
              the Platform shall not exceed the amount you have paid to us (if
              any) in the twelve months preceding the claim.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              15. Termination
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We may suspend or terminate your access to KidPlayAI at any time,
              with or without cause, and with or without notice. Upon
              termination, your right to use the Platform ceases immediately.
              Sandbox data and craft files associated with your session may be
              deleted following termination.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              16. Governing Law
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              These Terms of Use are governed by and construed in accordance with
              the laws of Australia. Any disputes arising from these terms shall
              be subject to the exclusive jurisdiction of the courts of
              Australia.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              17. Changes to These Terms
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              We may update these Terms of Use from time to time. Changes will
              be posted on this page with an updated "Last updated" date.
              Continued use of KidPlayAI after changes constitutes acceptance of the
              revised terms.
            </Paragraph>
          </div>

          <div style={section}>
            <Title level={3} style={sectionTitle}>
              18. Contact Us
            </Title>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              If you have questions about these Terms of Use, please contact:
            </Paragraph>
            <Paragraph style={{ color: "#4a5568", lineHeight: 1.8 }}>
              Techseeding PTY LTD
              <br />
              ABN: 35631597450 / ACN: 631597450
              <br />
              Website: https://kidplayai.techseeding.com.au
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
