'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, marginBottom: 16 }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: '#8B8AA3', marginBottom: 48, lineHeight: 1.7 }}>Please read these terms carefully before using VangelClip. By accessing or using our services, you agree to be bound by these terms. VangelClip is operated by a company incorporated and based in Nigeria.</p>

        {[
          { title: '1. Acceptance of Terms', body: 'By accessing or using VangelClip ("Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations of the Federal Republic of Nigeria. If you do not agree with any of these terms, you are prohibited from using or accessing this Service. These Terms are governed by and construed in accordance with the laws of Nigeria, and any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.' },
          { title: '2. Description of Service', body: 'VangelClip is an AI-powered video clipping platform that allows users to extract short clips from long-form video content. We provide tools for caption generation, clip editing, scheduling, and content distribution. The Service is intended for creators, educators, gospel ministers, and organisations producing original content.' },
          { title: '3. User Accounts', body: 'To access certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. VangelClip reserves the right to suspend or terminate accounts that violate these terms.' },
          { title: '4. Content and Intellectual Property', body: 'You retain all ownership rights to the original content you upload or process through VangelClip. By using our Service, you grant VangelClip a limited, non-exclusive licence to process, store, and display your content solely for the purpose of providing the Service. You represent and warrant that you own or have the necessary rights to all content you submit, and that your use does not infringe any third-party intellectual property rights.' },
          { title: '5. Acceptable Use', body: 'You agree not to use the Service to upload, generate, or distribute content that: (a) infringes intellectual property rights; (b) contains hate speech, violence, or discriminatory material; (c) violates any applicable law or regulation; (d) constitutes spam or unsolicited communications; (e) contains malware, viruses, or harmful code. VangelClip reserves the right to remove content that violates these guidelines.' },
          { title: '6. Credits and Payments', body: 'Certain features require the use of credits, which are purchased via a subscription plan. Credits reset monthly and unused credits do not roll over to the next period. Payments are processed securely. Refunds are available within 7 days of purchase if no credits have been used during that billing period. All prices are in USD unless otherwise stated.' },
          { title: '7. Privacy', body: 'Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy at /legal/privacy.' },
          { title: '8. Disclaimers and Limitation of Liability', body: 'The Service is provided on an "as is" and "as available" basis without warranties of any kind. VangelClip does not warrant that the Service will be uninterrupted, error-free, or free from viruses. To the maximum extent permitted by law, VangelClip shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.' },
          { title: '9. Changes to Terms', body: 'VangelClip reserves the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the revised Terms.' },
          { title: '10. Contact Us', body: 'If you have any questions about these Terms, please contact us at adminvangelclip@gmail.com. Our team typically responds within 2 business days.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>{s.title}</h2>
            <p style={{ fontSize: 15, color: '#8B8AA3', lineHeight: 1.8 }}>{s.body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(70,69,85,0.2)', paddingTop: 32, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: '#8B8AA3' }}>Questions? Contact us at <a href="mailto:adminvangelclip@gmail.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>adminvangelclip@gmail.com</a></p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <Link href="/legal/privacy" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/legal/cookies" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Cookie Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
