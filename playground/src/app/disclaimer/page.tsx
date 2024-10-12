import React from 'react';
import PageContentWrapper from "@/components/PageContentWrapper";

const DisclaimerPage: React.FC = () => {
  return (
    <PageContentWrapper>
      <div className="w-2/3 mx-auto text-justify leading-loose text-sm">
        <h1 className="text-xl font-medium mb-6">GLAM GUI Beta Disclaimer</h1>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p>
            We welcome you to <strong>GLAM's unaudited, experimental beta version of our crypto wallet web application, GLAM GUI ("GLAM GUI")</strong>. By accessing or using GLAM GUI, you acknowledge that you have read, understood, and agree to be bound by this disclaimer. If you do not agree, please refrain from using the application.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2. Active Development Notice</h2>
          <p>
            GLAM GUI is currently under <strong>active development</strong>. Features may change without notice, and <strong>breaking changes</strong> could occur. The software may not function as intended.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3. Use at Your Own Risk</h2>
          <ul className="list-disc pl-6">
            <li>GLAM GUI is provided on an "<strong>as is</strong>" and "<strong>as available</strong>" basis <strong>without warranties of any kind</strong>, either express or implied.</li>
            <li><strong>You assume all risks</strong> associated with using GLAM GUI.</li>
            <li>We <strong>strongly recommend</strong> not storing significant amounts of cryptoassets on the platform during the beta phase.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4. Risk Acknowledgment</h2>
          <ul className="list-disc pl-6">
            <li><strong>Security Risks:</strong> The software may contain bugs, errors, or security vulnerabilities that could lead to unauthorized access, data breaches, or other security incidents.</li>
            <li><strong>Financial Risks:</strong> There is a potential for <strong>partial or total loss of cryptoassets</strong> due to software issues or security breaches.</li>
            <li><strong>Operational Risks:</strong> GLAM GUI may experience interruptions, delays, or errors.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">5. Limitation of Liability</h2>
          <p>
            GLAM <strong>shall not be liable</strong> for any direct, indirect, incidental, consequential, or exemplary damages arising from the use or inability to use GLAM GUI. This includes, but is not limited to, loss of cryptoassets, data loss, or security breaches.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6. No Warranties</h2>
          <p>
            GLAM makes <strong>no warranties or representations</strong> about the accuracy or completeness of GLAM GUI's content or the content of any services linked to the app. We do not warrant that:
          </p>
          <ul className="list-disc pl-6">
            <li>GLAM GUI will meet your requirements.</li>
            <li>GLAM GUI will be uninterrupted, timely, secure, or error-free.</li>
            <li>Any errors or defects will be corrected.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7. User Responsibility</h2>
          <ul className="list-disc pl-6">
            <li><strong>Security Measures:</strong> You are responsible for safeguarding your private keys, passwords, and any other security credentials. GLAM does not have access to your private keys or passwords.</li>
            <li><strong>Due Diligence:</strong> Exercise caution and conduct your own due diligence before making any decisions based on the information provided by GLAM GUI.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">8. Legal Jurisdiction</h2>
          <p>
            This disclaimer is governed by and construed in accordance with the laws of <strong>Switzerland</strong>. Any disputes arising out of or in connection with this disclaimer shall be subject to the exclusive jurisdiction of the courts of Switzerland.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">9. Contact Information</h2>
          <p>
            For inquiries or to report issues, please contact us at:
          </p>
          <ul className="list-disc pl-6">
            <li><strong>Email:</strong> hello@glam.systems</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">10. Privacy Notice</h2>
          <p className="mb-2">
            GLAM GUI may collect certain non-personal usage data to improve our services, perform bug fixes, and enhance user experience. This may include information such as:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Device Information:</strong> Type of device, operating system, browser type, and version.</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, time and date of access, and other diagnostic data.</li>
            <li><strong>Error Reports:</strong> Crash reports and performance data to help us identify and fix issues.</li>
          </ul>
          <p className="mb-2">
            We may utilize third-party analytics services such as Google Analytics, Umami, Mixpanel, or PostHog to collect and analyze this data.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Third-Party Services:</strong> These services may use cookies or similar tracking technologies to collect and analyze information about your use of GLAM GUI. The data collected is generally aggregated and anonymized.</li>
          </ul>
          <p className="font-semibold mb-2">Personal Data:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>No Collection of Personal Identifiable Information (PII):</strong> We do not collect or store any personal data that can be used to identify you without your explicit consent.</li>
          </ul>
          <p>
            A formal <strong>Privacy Policy</strong> detailing our data collection, use, and storage practices will be provided in future updates. By using GLAM GUI, you consent to the collection and use of information as outlined above.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">11. Updates to This Disclaimer</h2>
          <p>
            We may update this disclaimer from time to time. <strong>Continued use</strong> of GLAM GUI constitutes your acceptance of any changes. Please review this disclaimer periodically for updates.
          </p>
        </section>
      </div>
    </PageContentWrapper>);
};

export default DisclaimerPage;
