import Tesseract from 'tesseract.js';

/**
 * Preprocesa la imagen en un Canvas HTML5 optimizado para OCR:
 * - Escala la imagen a resolución óptima (1600px máx) para máxima nitidez de letras pequeñas.
 * - Convierte a escala de grises.
 * - Aplica estiramiento dinámico de histograma (Dynamic Contrast Stretch) para eliminar sombras
 *   sin borrar tinta tenue de papel térmico.
 */
function preprocessImage(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        } else if (width < 900 && height < 900) {
          const factor = Math.min(1200 / width, 1200 / height);
          width = Math.round(width * factor);
          height = Math.round(height * factor);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          const len = data.length;

          const hist = new Uint32Array(256);
          const grayValues = new Uint8Array(len / 4);

          for (let i = 0, g = 0; i < len; i += 4, g++) {
            const gray = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
            grayValues[g] = gray;
            hist[gray]++;
          }

          const totalPixels = len / 4;
          let count = 0;
          let minVal = 0;
          let maxVal = 255;

          const p5 = totalPixels * 0.05;
          const p95 = totalPixels * 0.95;

          for (let i = 0; i < 256; i++) {
            count += hist[i];
            if (minVal === 0 && count >= p5) minVal = i;
            if (count >= p95) {
              maxVal = i;
              break;
            }
          }

          if (maxVal <= minVal) maxVal = 255;
          const range = maxVal - minVal;

          for (let i = 0, g = 0; i < len; i += 4, g++) {
            const val = grayValues[g];
            let stretched = 0;
            if (val > maxVal) {
              stretched = 255;
            } else if (val < minVal) {
              stretched = 0;
            } else {
              stretched = Math.round(((val - minVal) / range) * 255);
            }

            data[i] = stretched;
            data[i + 1] = stretched;
            data[i + 2] = stretched;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.90));
        } catch {
          resolve(canvas.toDataURL('image/jpeg', 0.90));
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Limpia y extrae un número monetario válido desde un fragmento de texto.
 * Soporta montos con 2 decimales (10.00), 3 decimales (10.000), 1 decimal (10.0) y enteros (10).
 */
function extractCleanNumber(str, isTotalLine = false) {
  if (!str) return null;

  // Limpiar espacios entre dígitos y separadores: ej '15 . 50' o '15 , 50' -> '15.50'
  let cleaned = str.replace(/(\d)\s*[.,']\s*(\d{1,3})\b/g, '$1.$2');
  
  // Reemplazar OCR 'O' o 'o' por 0 cuando están en contexto numérico: ej '15.O0' -> '15.00'
  cleaned = cleaned.replace(/(\d\.)[oO]/g, '$10').replace(/[oO](\d)/g, '0$1');

  // Buscar montos monetarios
  const matches = cleaned.matchAll(/(?:\$|USD|US\$)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,'][0-9]{1,3})|[0-9]{1,4}(?:[.,'][0-9]{1,3})?)\b/gi);

  const found = [];
  for (const m of matches) {
    let raw = m[1];
    if (raw.includes(',') && raw.includes('.')) {
      if (raw.indexOf(',') < raw.indexOf('.')) {
        raw = raw.replace(/,/g, '');
      } else {
        raw = raw.replace(/\./g, '').replace(',', '.');
      }
    } else {
      raw = raw.replace(/[',]/g, '.');
    }

    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0.05 && val < 50000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027) {
      found.push(val);
    }
  }

  // Si no encontró con decimales y es una línea explícita de TOTAL, buscar número entero (ej: "TOTAL: 10" o "TOTAL US$ 10")
  if (found.length === 0 && isTotalLine) {
    const intMatch = cleaned.match(/(?:TOTAL|PAGAR|USD|US\$|\$)\s*:?\s*([0-9]{1,4})\b/i);
    if (intMatch) {
      const intVal = parseFloat(intMatch[1]);
      if (!isNaN(intVal) && intVal > 0.5 && intVal < 5000 && intVal !== 2024 && intVal !== 2025 && intVal !== 2026) {
        return intVal;
      }
    }
  }

  return found.length > 0 ? found[found.length - 1] : null;
}

/**
 * Motor de extracción de TOTAL:
 * Jerarquía inteligente de 2 niveles:
 * 1. Alta prioridad: 'TOTAL A PAGAR', 'VALOR TOTAL', 'TOTAL NETO', 'NETO A PAGAR', 'TOTAL USD'
 *    (Ignorando estrictamente secciones informativas de gasolina como "Sin Subsidio").
 * 2. Prioridad general: 'TOTAL' y sus variaciones.
 */
function parseReceiptData(ocrResult) {
  const fullText = (ocrResult.data && ocrResult.data.text) ? ocrResult.data.text : '';
  const linesObj = (ocrResult.data && ocrResult.data.lines) ? ocrResult.data.lines : [];

  const rawLines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detectar posible nombre del negocio (primeras 5 líneas no vacías)
  let businessName = '';
  for (let i = 0; i < Math.min(6, rawLines.length); i++) {
    const line = rawLines[i];
    if (!/ruc|c\.i|cedula|fecha|hora|tel|telf|factura|autoriz|ticket|orden|clave/i.test(line) && line.length > 3 && line.length < 40) {
      businessName = line;
      break;
    }
  }

  // Patrones prohibidos que NUNCA representan el gran total a pagar
  const forbiddenPatterns = /(?:subsidio|informativo|turno|fecha|prod\b|cant\b|precio\b|galones?|gal\b|litros?|lt\b|dispensador|manguera|placa|km|kilometraje|art[ií]culos?|items?|productos?|unidades?|cant(?:idad)?|piezas?|descuento|desc\b|base\s+0%|base\s+12%|base\s+15%|sub\s*total)/i;

  // 1. MÁXIMA PRIORIDAD: Frases explícitas de total final de factura
  const highPriorityKeywords = [
    /\btotal\s+a\s+pagar\b/i,
    /\bvalor\s+total\b/i,
    /\bmonto\s+total\b/i,
    /\bneto\s+a\s+pagar\b/i,
    /\bimporte\s+total\b/i,
    /\btotal\s+factura\b/i,
    /\btotal\s+pagar\b/i,
    /\btotal\s+usd\b/i,
    /\btotal\s+venta\b/i,
    /\bvalor\s+a\s+cobrar\b/i
  ];

  // 2. PRIORIDAD GENERAL: Cualquier palabra TOTAL
  const generalKeywords = [
    /\bt\s*o\s*t\s*a\s*l\b/i,
    /\bt\s*0\s*t\s*a\s*l\b/i,
    /\bt\s*o\s*t\s*a\s*1\b/i,
    /\ba\s+pagar\b/i
  ];

  let detectedTotal = null;
  let detectionSource = '';

  // Función auxiliar de búsqueda para una lista de keywords
  const searchInLines = (keywords, sourcePrefix) => {
    // A) Búsqueda en objetos de líneas si tienen bounding box
    if (linesObj.length > 0) {
      for (let i = linesObj.length - 1; i >= 0; i--) {
        const lineItem = linesObj[i];
        const text = (lineItem.text || '').trim();

        if (forbiddenPatterns.test(text)) continue;

        if (keywords.some(rgx => rgx.test(text))) {
          // Misma línea
          const sameVal = extractCleanNumber(text, true);
          if (sameVal !== null) {
            return { total: sameVal, source: `${sourcePrefix}_same_line` };
          }

          // Columna horizontal con Bounding Box
          if (lineItem.bbox) {
            const itemY = (lineItem.bbox.y0 + lineItem.bbox.y1) / 2;
            const h = Math.max(16, lineItem.bbox.y1 - lineItem.bbox.y0);

            for (let j = 0; j < linesObj.length; j++) {
              if (i === j) continue;
              const other = linesObj[j];
              const otherText = (other.text || '').trim();
              if (/efectivo|cambio|vuelto|tarjeta|recibido/i.test(otherText)) continue;

              if (other.bbox) {
                const otherY = (other.bbox.y0 + other.bbox.y1) / 2;
                if (Math.abs(itemY - otherY) <= h * 1.3) {
                  const horizVal = extractCleanNumber(otherText, true);
                  if (horizVal !== null) {
                    return { total: horizVal, source: `${sourcePrefix}_spatial_col` };
                  }
                }
              }
            }
          }

          // Siguiente línea
          if (i + 1 < linesObj.length) {
            const nextText = (linesObj[i + 1].text || '').trim();
            if (!/efectivo|cambio|vuelto|recibido|tarjeta|visa|master/i.test(nextText)) {
              const nextVal = extractCleanNumber(nextText, true);
              if (nextVal !== null) {
                return { total: nextVal, source: `${sourcePrefix}_next_line` };
              }
            }
          }
        }
      }
    }

    // B) Búsqueda en texto plano
    for (let i = rawLines.length - 1; i >= 0; i--) {
      const line = rawLines[i];
      if (forbiddenPatterns.test(line)) continue;

      if (keywords.some(rgx => rgx.test(line))) {
        const sameVal = extractCleanNumber(line, true);
        if (sameVal !== null) {
          return { total: sameVal, source: `${sourcePrefix}_plain_same` };
        }

        if (i + 1 < rawLines.length) {
          const nextLine = rawLines[i + 1];
          if (!/efectivo|cambio|vuelto|recibido|tarjeta|forma\s+de\s+pago/i.test(nextLine)) {
            const nextVal = extractCleanNumber(nextLine, true);
            if (nextVal !== null) {
              return { total: nextVal, source: `${sourcePrefix}_plain_next` };
            }
          }
        }

        if (i + 2 < rawLines.length) {
          const mid = rawLines[i + 1].trim();
          if (/^[\$:USDUS\$\-]+$/i.test(mid)) {
            const val2 = extractCleanNumber(rawLines[i + 2], true);
            if (val2 !== null) {
              return { total: val2, source: `${sourcePrefix}_plain_line2` };
            }
          }
        }
      }
    }

    return null;
  };

  // PASO 1: Probar primero con frases de Alta Prioridad ("TOTAL A PAGAR", etc.)
  const highResult = searchInLines(highPriorityKeywords, 'total_a_pagar');
  if (highResult) {
    detectedTotal = highResult.total;
    detectionSource = highResult.source;
  }

  // PASO 2: Probar con frases generales de TOTAL
  if (detectedTotal === null) {
    const genResult = searchInLines(generalKeywords, 'total_general');
    if (genResult) {
      detectedTotal = genResult.total;
      detectionSource = genResult.source;
    }
  }

  // PASO 3: Fallback de seguridad al final del ticket
  if (detectedTotal === null) {
    const bottomLines = rawLines.slice(Math.max(0, rawLines.length - 10));
    for (let i = bottomLines.length - 1; i >= 0; i--) {
      const line = bottomLines[i];
      if (/efectivo|cambio|vuelto|recibido|visa|mastercard|dinero|tarjeta/i.test(line)) continue;
      if (forbiddenPatterns.test(line) && !/sub\s*total/i.test(line)) continue;

      const val = extractCleanNumber(line);
      if (val !== null) {
        detectedTotal = val;
        detectionSource = 'bottom_fallback';
        break;
      }
    }
  }

  // Detección automática de categoría según palabras clave
  const lowerFull = fullText.toLowerCase();
  let suggestedCat = 'shopping';

  if (/farmacia|medicin|salud|droga|receta|pastilla|fybeca|sana\s*sana|cruz\s*azul|medicity/i.test(lowerFull)) {
    suggestedCat = 'health';
  } else if (/supermaxi|t[ií]a\b|comisariato|mercado|viveres|panaderia|pan|leche|fruta|despensa|arroz|aceite|santa\s*mar[ií]a|coral|aki\b/i.test(lowerFull)) {
    suggestedCat = 'food';
  } else if (/restaurante|almuerzo|comida|pollo|hamburguesa|pizza|cafe|cafeteria|asadero|kfc|mcdonald|sweet\s*&\s*coffee/i.test(lowerFull)) {
    suggestedCat = 'food';
  } else if (/gasolina|gasolinera|combustible|estacion|primax|petro|terpel|diesel|super|extra|etanol|atimasa/i.test(lowerFull)) {
    suggestedCat = 'transport';
  } else if (/luz|agua|internet|cnt|claro|movistar|cnel|plan|emaap|telefon/i.test(lowerFull)) {
    suggestedCat = 'services';
  } else if (/de\s*prati|marathon|etafashion|rm\b|ropa|calzado|zapatos/i.test(lowerFull)) {
    suggestedCat = 'shopping';
  }

  return {
    amount: detectedTotal ? detectedTotal.toFixed(2) : '',
    note: businessName ? `Compra en ${businessName}` : 'Ticket escaneado',
    suggestedCategory: suggestedCat,
    rawText: fullText,
    source: detectionSource
  };
}

/**
 * Escanea un archivo de imagen con Tesseract OCR optimizado
 */
export async function scanReceiptWithOCR(imageFile, onProgress) {
  try {
    if (onProgress) onProgress('Optimizando imagen y contraste...');
    const processedDataUrl = await preprocessImage(imageFile);

    if (onProgress) onProgress('Buscando TOTAL en el ticket...');
    
    let result = null;
    try {
      result = await Tesseract.recognize(
        processedDataUrl,
        'spa',
        {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              const pct = Math.round(m.progress * 100);
              onProgress(`Leyendo TOTAL... ${pct}%`);
            }
          }
        }
      );
    } catch {
      result = await Tesseract.recognize(
        processedDataUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              const pct = Math.round(m.progress * 100);
              onProgress(`Leyendo TOTAL... ${pct}%`);
            }
          }
        }
      );
    }

    const extracted = parseReceiptData(result);
    return {
      success: Boolean(extracted.amount),
      data: extracted,
      error: null
    };
  } catch (err) {
    console.error('OCR Error:', err);
    return {
      success: false,
      data: null,
      error: 'No se pudo leer el ticket con claridad. Asegúrate de enfocar bien la sección del TOTAL.'
    };
  }
}
