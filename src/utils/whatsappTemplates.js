/**
 * Plantillas predeterminadas de WhatsApp para AnotaYa
 */
import { cleanWhatsAppPhone } from './countryCodes';

export const WHATSAPP_TEMPLATES = [
  {
    id: 'friendly',
    title: '🤝 Amistoso / Cortés (Recomendado)',
    desc: 'Un recordatorio cordial, cálido y sin presiones',
    generateText: (debt) => {
      const person = debt.personName ? debt.personName.trim() : 'amigo/a';
      const reason = debt.note ? debt.note.trim() : 'concepto pendiente';
      const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, (debt.amount || 0) - totalPaid);

      if (debt.type === 'they_owe_me') {
        if (totalPaid > 0) {
          return `Hola ${person}, un saludo. Te escribo para recordarte que el saldo pendiente actual es de $${remaining.toFixed(2)} (de un total de $${debt.amount.toFixed(2)}) por concepto de ${reason}. ¡Gracias! 🤝`;
        }
        return `Hola ${person}, un saludo. Te escribo para recordarte el pendiente de $${remaining.toFixed(2)} por concepto de ${reason}. ¡Gracias! 🤝`;
      }
      return `Hola ${person}, te escribo para registrar nuestro compromiso de pago de $${remaining.toFixed(2)} por concepto de ${reason}. ¡Saludos! 🤝`;
    }
  },
  {
    id: 'formal',
    title: '💼 Formal / Profesional',
    desc: 'Ideal para clientes, compañeros de trabajo o negocios',
    generateText: (debt) => {
      const person = debt.personName ? debt.personName.trim() : '';
      const reason = debt.note ? debt.note.trim() : 'concepto pendiente';
      const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, (debt.amount || 0) - totalPaid);

      if (debt.type === 'they_owe_me') {
        return `Estimado/a ${person}, te envío un cordial saludo. Te comparto el recordatorio del saldo pendiente de $${remaining.toFixed(2)} correspondiente a "${reason}". Quedo a tu disposición para coordinar los detalles. Saludos cordiales.`;
      }
      return `Estimado/a ${person}, un cordial saludo. Te comparto la confirmación del saldo pendiente por valor de $${remaining.toFixed(2)} correspondiente a "${reason}". Quedo a tu disposición.`;
    }
  },
  {
    id: 'direct',
    title: '⚡ Rápido y Directo',
    desc: 'Breve y al grano para amigos cercanos',
    generateText: (debt) => {
      const person = debt.personName ? debt.personName.trim() : '';
      const reason = debt.note ? debt.note.trim() : 'pendiente';
      const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, (debt.amount || 0) - totalPaid);

      if (debt.type === 'they_owe_me') {
        return `Hola ${person}, te dejo por aquí el recordatorio del saldo de $${remaining.toFixed(2)} de ${reason}. ¡Quedo atento!`;
      }
      return `Hola ${person}, te dejo el registro de los $${remaining.toFixed(2)} pendientes de ${reason}. ¡Saludos!`;
    }
  },
  {
    id: 'statement',
    title: '📊 Detalle Completo de Cuenta',
    desc: 'Muestra monto original, total abonado y saldo restante',
    generateText: (debt) => {
      const person = debt.personName ? debt.personName.trim() : 'amigo/a';
      const reason = debt.note ? debt.note.trim() : 'concepto pendiente';
      const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, (debt.amount || 0) - totalPaid);

      return `Hola ${person}, un saludo. Te comparto el estado actual de tu cuenta en AnotaYa:
📋 Concepto: ${reason}
💰 Monto Original: $${debt.amount.toFixed(2)}
✅ Abonos Realizados: $${totalPaid.toFixed(2)}
🔴 Saldo Pendiente: $${remaining.toFixed(2)}
¡Muchas gracias por tu atención! 🤝`;
    }
  }
];

export function sendWhatsAppMessage(phone, countryCode, messageText) {
  const cleanPhone = cleanWhatsAppPhone(phone, countryCode || '593');
  const encodedText = encodeURIComponent(messageText);

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
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
    const webUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}
