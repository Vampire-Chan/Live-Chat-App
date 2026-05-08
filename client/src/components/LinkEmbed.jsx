import React, { useState, useEffect } from 'react';
import { ExternalLink, Play, Image as ImageIcon, FileText } from 'lucide-react';

const LinkEmbed = ({ url }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── 1. Static Media Checks (No API needed) ────────────────
  const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
  const isYouTube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);

  if (isImage) {
    return (
      <div style={{ marginTop: '8px', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <img src={url} alt="Shared image" style={{ width: '100%', display: 'block' }} loading="lazy" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div style={{ marginTop: '8px', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <video src={url} controls style={{ width: '100%', display: 'block' }} />
      </div>
    );
  }

  if (isYouTube) {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)[1];
    return (
      <div style={{ marginTop: '8px', maxWidth: '480px', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
    );
  }

  // ── 2. Website Preview (Simple Card) ──────────────────────
  // Note: For a real production app, we would use a backend scraper to get OG tags.
  // For this college project, we'll render a nice clean link card for non-media links.
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        textDecoration: 'none',
        maxWidth: '450px',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url.replace(/^https?:\/\/(www\.)?/, '')}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click to open link</div>
      </div>
    </a>
  );
};

export default LinkEmbed;
