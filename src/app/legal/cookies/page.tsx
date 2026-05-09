'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CookiesPage() {
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
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, marginBottom: 16 }}>Cookie Policy</h1>
        <p style={{ fontSize: 15, color: '#8B8AA3', marginBottom: 48, lineHeight: 1.7 }}>This Cookie Policy explains how VangelClip uses cookies and similar technologies to recognise you when you visit our website and use our Service.</p>

        {[
          { title: '1. What Are Cookies?', body: 'Cookies are small data files placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work efficiently, to provide reporting information, and to enable certain features or personalisation. We use both first-party cookies (set by VangelClip) and third-party cookies (set by our service partners).' },
          { title: '2. Why We Use Cookies', body: 'We use cookies for several purposes: to keep you logged in to your account; to remember your preferences and settings; to understand how you use our Service so we can improve it; to deliver relevant content and measure the effectiveness of our platform; to protect against fraud and security threats.' },
          { title: '3. Types of Cookies We Use', body: 'Essential cookies: These are necessary for the website to function and cannot be switched off. They are set in response to actions you take, such as logging in. Performance cookies: These allow us to count visits and traffic sources to measure and improve the performance of our Service. Functional cookies: These enable enhanced functionality and personalisation, such as remembering your preferences. Analytics cookies: We use analytics services (including Supabase and Vercel Analytics) to understand how users interact with our Service.' },
          { title: '4. Third-Party Cookies', body: 'In addition to our own cookies, we may use cookies from third-party services embedded in our platform, including: Supabase (authentication and database services); Vercel (hosting and analytics); Paystack (payment processing). These third parties may use cookies in accordance with their own privacy policies, which we encourage you to review.' },
          { title: '5. Managing Cookies', body: 'Most web browsers allow you to control cookies through their settings preferences. You can typically: view the cookies stored on your device; delete all or specific cookies; block cookies from specific websites; block all cookies. Please note that restricting cookies may impact the functionality of VangelClip. To manage cookies, visit your browser\'s settings or preferences menu.' },
          { title: '6. Cookie Consent', body: 'By continuing to use VangelClip after being presented with our cookie notice, you consent to the use of cookies as described in this policy. You may withdraw your consent at any time by clearing cookies in your browser or adjusting your cookie preferences.' },
          { title: '7. Changes to This Policy', body: 'We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. We will notify you of significant changes by updating the "Last updated" date at the top of this page.' },
          { title: '8. Contact Us', body: 'If you have questions about our use of cookies or this Cookie Policy, please contact us at adminvangelclip@gmail.com.' },
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
            <Link href="/legal/privacy" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
