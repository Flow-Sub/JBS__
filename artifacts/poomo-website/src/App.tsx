import { useEffect } from 'react';

const WHATSAPP_NUMBER_DISPLAY = '0300 1766258';
const WHATSAPP_LINK = 'https://wa.me/923001766258';
const ROUTE_TO_SECTION: Record<string, string> = {
  '/about-us': 'about',
  '/service': 'services',
  '/project': 'projects',
  '/blogs': 'blogs',
  '/team': 'team',
  '/contact': 'contact',
};

function App() {
  useEffect(() => {
    // Re-initialize Webflow after React mounts
    if ((window as any).Webflow) {
      (window as any).Webflow.destroy();
      (window as any).Webflow.ready();
      (window as any).Webflow.require('ix2').init();
    }

    const sectionId = ROUTE_TO_SECTION[window.location.pathname];
    if (sectionId) {
      const hash = `#${sectionId}`;
      window.history.replaceState(null, '', hash);
      requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
      });
    }
  }, []);

  return (
    <WhatsAppFloatingButton />
  );
}

function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat on WhatsApp at ${WHATSAPP_NUMBER_DISPLAY}`}
      title={`WhatsApp ${WHATSAPP_NUMBER_DISPLAY}`}
      style={{
        position: 'fixed',
        right: '22px',
        bottom: '22px',
        zIndex: 9999,
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        background: '#25d366',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.28)',
        textDecoration: 'none',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
        event.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.34)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0) scale(1)';
        event.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.28)';
      }}
    >
      <svg
        aria-hidden="true"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M16.02 3.2C9.09 3.2 3.45 8.72 3.45 15.51c0 2.29.65 4.52 1.89 6.46L3.2 28.8l7.04-2.06a12.77 12.77 0 0 0 5.78 1.41c6.93 0 12.57-5.52 12.57-12.31S22.95 3.2 16.02 3.2Zm0 22.84c-1.86 0-3.66-.48-5.27-1.39l-.38-.22-4.18 1.22 1.25-4.05-.25-.41a10.2 10.2 0 0 1-1.62-5.52c0-5.62 4.69-10.2 10.45-10.2s10.45 4.58 10.45 10.2-4.69 10.37-10.45 10.37Zm5.74-7.64c-.31-.15-1.85-.9-2.14-1-.29-.11-.5-.15-.71.15-.21.31-.82 1-.99 1.21-.18.2-.36.23-.67.08-.31-.15-1.31-.47-2.49-1.51-.92-.8-1.54-1.79-1.72-2.1-.18-.31-.02-.47.14-.62.14-.14.31-.36.47-.54.15-.18.21-.31.31-.51.1-.2.05-.38-.03-.54-.08-.15-.71-1.67-.97-2.29-.26-.6-.52-.52-.71-.53h-.61c-.21 0-.54.08-.82.38-.28.31-1.07 1.03-1.07 2.5s1.1 2.9 1.25 3.1c.15.2 2.16 3.23 5.23 4.53.73.31 1.3.5 1.75.64.74.23 1.41.2 1.94.12.59-.09 1.85-.74 2.11-1.45.26-.72.26-1.33.18-1.45-.08-.13-.28-.2-.6-.36Z" />
      </svg>
    </a>
  );
}

export default App;
