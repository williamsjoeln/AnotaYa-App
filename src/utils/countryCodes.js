/**
 * Lista de códigos de país y utilidades de WhatsApp para AnotaYa
 */

export const COUNTRY_CODES = [
  // Latinoamérica
  { code: '593', name: 'Ecuador', flag: '🇪🇨', placeholder: '099 123 4567' },
  { code: '57', name: 'Colombia', flag: '🇨🇴', placeholder: '300 123 4567' },
  { code: '51', name: 'Perú', flag: '🇵🇪', placeholder: '987 654 321' },
  { code: '52', name: 'México', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { code: '54', name: 'Argentina', flag: '🇦🇷', placeholder: '9 11 1234 5678' },
  { code: '56', name: 'Chile', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { code: '58', name: 'Venezuela', flag: '🇻🇪', placeholder: '412 123 4567' },
  { code: '591', name: 'Bolivia', flag: '🇧🇴', placeholder: '7123 4567' },
  { code: '502', name: 'Guatemala', flag: '🇬🇹', placeholder: '5123 4567' },
  { code: '506', name: 'Costa Rica', flag: '🇨🇷', placeholder: '8123 4567' },
  { code: '507', name: 'Panamá', flag: '🇵🇦', placeholder: '6123 4567' },
  { code: '598', name: 'Uruguay', flag: '🇺🇾', placeholder: '099 123 456' },
  { code: '595', name: 'Paraguay', flag: '🇵🇾', placeholder: '981 123 456' },
  { code: '503', name: 'El Salvador', flag: '🇸🇻', placeholder: '7123 4567' },
  { code: '504', name: 'Honduras', flag: '🇭🇳', placeholder: '9123 4567' },
  { code: '505', name: 'Nicaragua', flag: '🇳🇮', placeholder: '8123 4567' },
  { code: '1809', name: 'Rep. Dominicana', flag: '🇩🇴', placeholder: '809 123 4567' },
  { code: '55', name: 'Brasil', flag: '🇧🇷', placeholder: '11 91234 5678' },
  
  // Norteamérica & Europa
  { code: '1', name: 'Estados Unidos / Canadá / PR', flag: '🇺🇸', placeholder: '555 123 4567' },
  { code: '34', name: 'España', flag: '🇪🇸', placeholder: '612 345 678' },
  { code: '39', name: 'Italia', flag: '🇮🇹', placeholder: '320 123 4567' },
  { code: '33', name: 'Francia', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { code: '49', name: 'Alemania', flag: '🇩🇪', placeholder: '151 12345678' },
  { code: '44', name: 'Reino Unido', flag: '🇬🇧', placeholder: '7911 123456' }
];

/**
 * Limpia y normaliza un número de teléfono a formato internacional E.164
 * Evita conflictos si el usuario ingresó el código de país o si puso el 0 inicial (ej: 099...)
 */
export function cleanWhatsAppPhone(phone, defaultCode = '593') {
  if (!phone) return '';
  let str = String(phone).trim();

  // Si el usuario ya comenzó con un '+', respetar el número internacional exacto que puso
  if (str.startsWith('+')) {
    return str.replace(/[^\d]/g, '');
  }

  // Quitar espacios, guiones, paréntesis o cualquier carácter no numérico
  str = str.replace(/[^\d]/g, '');
  if (!str) return '';

  // En Ecuador y la mayoría de países de LatAm, los números locales móviles inician con '0' (ej. 0991234567).
  // Para el formato internacional de WhatsApp se remueve ese '0' antes de concatenar el código.
  if (str.startsWith('0')) {
    str = str.replace(/^0+/, '');
  }

  // Si el número ya empieza con el código de país seleccionado (ej. 593...), no duplicarlo
  if (str.startsWith(defaultCode)) {
    return str;
  }

  return defaultCode + str;
}

/**
 * Genera el texto del mensaje pre-redactado para WhatsApp
 */
export function getWhatsAppMessage(debt) {
  const person = debt.personName ? debt.personName.trim() : 'amigo/a';
  const reason = debt.note ? debt.note.trim() : 'concepto pendiente';

  // Calcular monto restante
  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, (debt.amount || 0) - totalPaid);

  if (debt.type === 'they_owe_me') {
    if (totalPaid > 0 && remaining > 0) {
      return `Hola ${person}, ¿cómo estás? Te escribo para dejarte un cordial recordatorio: tu saldo pendiente actual es de $${remaining.toFixed(2)} (de un total de $${debt.amount.toFixed(2)}) por concepto de "${reason}". ¡Muchas gracias! 🤝`;
    }
    return `Hola ${person}, ¿cómo estás? Te escribo para dejarte un cordial recordatorio del monto pendiente de $${remaining.toFixed(2)} por concepto de "${reason}". ¡Muchas gracias! 🤝`;
  }

  // Si yo debo (para enviar comprobante o compromiso de pago)
  return `Hola ${person}, te comparto este mensaje para registrar nuestro compromiso de pago de $${remaining.toFixed(2)} por concepto de "${reason}". ¡Saludos! 🤝`;
}

/**
 * Abre la app de WhatsApp de forma nativa o en web
 */
export function openWhatsApp(debt) {
  const cleanPhone = cleanWhatsAppPhone(debt.phone, debt.countryCode || '593');
  const message = getWhatsAppMessage(debt);
  const encodedText = encodeURIComponent(message);

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Protocolo nativo de WhatsApp
    const nativeUrl = cleanPhone 
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    const link = document.createElement('a');
    link.href = nativeUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 200);
  } else {
    // En Desktop / Laptop, abrir WhatsApp Web
    const webUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}
