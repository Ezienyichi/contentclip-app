'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div style={{ background: '#0E0E0E', color: '#E5E2E1', fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'Arial Black, Arial, sans-serif' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </Link>
        <button onClick={() => router.push('/auth')} style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#FAF7FF', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Start Free</button>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 100px' }}>
        <p style={{ fontSize: 12, color: '#8B8AA3', marginBottom: 8 }}>Last updated: May 2026</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, marginBottom: 16 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: '#8B8AA3', marginBottom: 48, lineHeight: 1.7 }}>VangelClip respects your privacy. This policy explains what data we collect, how we use it, and the choices available to you. VangelClip is operated by a company based in Nigeria and this policy is governed by the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act (NDPA) 2023.</p>

        {[
          { title: '1. Information We Collect', body: 'We collect information you provide directly to us, including: account registration details (name, email address, password); payment information processed securely through our payment providers; content you upload or process through our Service; communications you send to us. We also collect certain information automatically when you use the Service, including usage data, device information, IP addresses, and cookie data as described in our Cookie Policy.' },
          { title: '2. How We Use Your Information', body: 'We use the information we collect to: provide, maintain, and improve our Services; process transactions and send related information; send technical notices, updates, security alerts, and support messages; respond to comments and questions; monitor and analyse usage patterns; detect and prevent fraudulent transactions and other illegal activities; personalise and improve your experience.' },
          { title: '3. Information Sharing', body: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with: service providers who assist in our operations (hosting, payment processing, analytics); law enforcement or government agencies when required by law; other parties with your consent. All third-party service providers are required to maintain the confidentiality and security of your information.' },
          { title: '4. Data Storage and Security', body: 'Your data is stored on secure servers. We implement appropriate technical and organisational measures to protect your personal information against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, or access. Video files processed through VangelClip are temporarily stored during processing and automatically deleted within 30 days unless saved to your account.' },
          { title: '5. Data Retention', body: 'We retain your account information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting adminvangelclip@gmail.com. We may retain certain information as required by law or for legitimate business purposes.' },
          { title: '6. Your Rights', body: 'Depending on your location, you may have the right to: access the personal information we hold about you; request correction of inaccurate data; request deletion of your personal data; object to or restrict processing of your data; data portability. To exercise any of these rights, please contact us at adminvangelclip@gmail.com.' },
          { title: '7. Cookies', body: 'We use cookies and similar tracking technologies to improve your experience on our Service. Please see our Cookie Policy at /legal/cookies for detailed information about the cookies we use and how to manage them.' },
          { title: '8. Children\'s Privacy', body: 'VangelClip is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected personal information from a child under 13, we will promptly delete that information.' },
          { title: '9. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.' },
          { title: '10. Contact Us', body: 'If you have questions about this Privacy Policy or our privacy practices, please contact us at adminvangelclip@gmail.com. We are committed to resolving privacy concerns.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>{s.title}</h2>
            <p style={{ fontSize: 15, color: '#8B8AA3', lineHeight: 1.8 }}>{s.body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(70,69,85,0.2)', paddingTop: 32, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: '#8B8AA3' }}>Questions? Contact us at <a href="mailto:adminvangelclip@gmail.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>adminvangelclip@gmail.com</a></p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <Link href="/legal/terms" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/legal/cookies" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Cookie Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
