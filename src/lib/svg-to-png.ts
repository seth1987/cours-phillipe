import sharp from 'sharp';

/**
 * Convertit une chaîne SVG en image PNG encodée en base64
 * pour utilisation avec Gemini Vision API
 */
export async function svgToPngBase64(svgString: string): Promise<string> {
  // Nettoyer et préparer le SVG
  let svg = svgString.trim();

  // Ajouter les dimensions si manquantes pour sharp
  if (!svg.includes('width=') && !svg.includes('viewBox=')) {
    svg = svg.replace('<svg', '<svg width="600" height="400"');
  } else if (!svg.includes('width=') && svg.includes('viewBox=')) {
    // Extraire les dimensions du viewBox
    const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/);
    if (viewBoxMatch) {
      const [, , , w, h] = viewBoxMatch[1].split(/\s+/).map(Number);
      if (w && h) {
        svg = svg.replace('<svg', `<svg width="${w}" height="${h}"`);
      }
    }
  }

  // Ajouter xmlns si manquant (requis pour sharp)
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Convertir SVG en PNG avec sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer();

  return pngBuffer.toString('base64');
}

/**
 * Vérifie si une chaîne est un SVG valide
 */
export function isValidSvg(svgString: string): boolean {
  if (!svgString || typeof svgString !== 'string') {
    return false;
  }
  const trimmed = svgString.trim();
  return trimmed.startsWith('<svg') && trimmed.includes('</svg>');
}
