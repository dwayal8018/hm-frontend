/**
 * Generates a stable machine fingerprint based on browser and hardware properties.
 * This is NOT a canvas fingerprint (those change with browser updates).
 * It uses properties that remain constant unless the user changes their hardware.
 *
 * Properties used:
 * - Screen resolution & color depth
 * - Hardware concurrency (CPU cores)
 * - Device memory (if available)
 * - Platform (Win32, Linux, etc.)
 * - Timezone offset
 * - Language
 * - WebGL renderer (GPU identifier)
 *
 * The result is a SHA-256 hash stored in localStorage so it's consistent across sessions.
 * If someone copies the DB but runs on different hardware, the fingerprint won't match.
 */

const MACHINE_ID_KEY = 'hm_machine_id';

export async function getMachineId(): Promise<string> {
  // Check if already generated and stored
  const stored = localStorage.getItem(MACHINE_ID_KEY);
  if (stored) return stored;

  // Generate from hardware properties
  const raw = collectFingerprint();
  const hash = await sha256(raw);

  localStorage.setItem(MACHINE_ID_KEY, hash);
  return hash;
}

function collectFingerprint(): string {
  const parts: string[] = [];

  // Screen
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Hardware
  parts.push(`cores:${navigator.hardwareConcurrency || 0}`);
  parts.push(`mem:${(navigator as any).deviceMemory || 'unknown'}`);

  // Platform
  parts.push(`plat:${navigator.platform}`);

  // Timezone
  parts.push(`tz:${new Date().getTimezoneOffset()}`);

  // Language
  parts.push(`lang:${navigator.language}`);

  // WebGL GPU renderer — very hardware-specific
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        parts.push(`gpu:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
      }
    }
  } catch {
    parts.push('gpu:unknown');
  }

  return parts.join('|');
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
