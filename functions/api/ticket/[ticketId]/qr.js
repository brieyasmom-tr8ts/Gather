import QRCode from 'qrcode';

export async function onRequestGet(context) {
  const { params } = context;
  const { ticketId } = params;

  try {
    const svg = await QRCode.toString(ticketId, {
      type: 'svg',
      width: 200,
      margin: 2,
      color: {
        dark: '#1A1A2E',
        light: '#FFFFFF',
      },
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('QR generation error:', err);
    // Fallback: return a simple placeholder SVG
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f3f4f6"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="#6b7280">QR Code</text>
      <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#9ca3af">${ticketId.substring(0, 8)}</text>
    </svg>`;

    return new Response(fallbackSvg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
