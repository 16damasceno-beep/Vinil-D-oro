
import { User, Listing, CatalogItem } from "../types";

/**
 * MOCK NOTIFICATION SERVICE
 * Since we don't have a backend, this simulates sending emails and WhatsApp messages.
 */

export const sendSaleNotification = (seller: User, buyer: User, listing: Listing, catalogItem: CatalogItem) => {
  const message = `Olá ${seller.name}, você vendeu o item "${catalogItem.title}" por R$ ${listing.price.toFixed(2)}! Acesse a plataforma para enviar.`;
  
  console.log(`--- [MOCK EMAIL] Enviado para ${seller.email} ---`);
  console.log(`Assunto: Nova Venda!`);
  console.log(`Corpo: ${message}`);

  console.log(`--- [MOCK WHATSAPP] Enviado para ${seller.phone} ---`);
  console.log(`Mensagem: ${message}`);
};

export const sendReservationRequestNotification = (seller: User, buyer: User, listing: Listing, catalogItem: CatalogItem, reservationId: string) => {
  const approveLink = `https://vinildoro.com/reservations/approve/${reservationId}`;
  const rejectLink = `https://vinildoro.com/reservations/reject/${reservationId}`;
  
  const emailBody = `
    Olá ${seller.name},
    ${buyer.name} solicitou a reserva do item "${catalogItem.title}".
    
    Para ACEITAR a reserva, clique aqui: ${approveLink}
    Para RECUSAR, clique aqui: ${rejectLink}
    
    Ou acesse suas notificações na plataforma.
  `;

  const whatsappMessage = `Vinil D'oro: Nova solicitação de reserva para "${catalogItem.title}". Acesse o site para aceitar ou recusar.`;

  console.log(`--- [MOCK EMAIL] Enviado para ${seller.email} ---`);
  console.log(`Assunto: Solicitação de Reserva`);
  console.log(`Corpo: ${emailBody}`);

  console.log(`--- [MOCK WHATSAPP] Enviado para ${seller.phone} ---`);
  console.log(`Mensagem: ${whatsappMessage}`);
};

export const sendReservationDecisionNotification = (buyer: User, seller: User, catalogItem: CatalogItem, approved: boolean) => {
  const status = approved ? "APROVADA" : "RECUSADA";
  const message = `Sua reserva para "${catalogItem.title}" foi ${status} pelo vendedor.`;
  
  console.log(`--- [MOCK EMAIL/WHATSAPP] Enviado para Comprador (${buyer.email}) ---`);
  console.log(message);
};

export const sendPasswordResetEmail = (user: User) => {
  // Simulate a token generation
  const mockToken = Math.random().toString(36).substring(7);
  // Construct the internal link (HashRouter format)
  const resetLink = `${window.location.origin}${window.location.pathname}#/reset-password?email=${encodeURIComponent(user.email)}&token=${mockToken}`;

  const emailBody = `
    Olá ${user.name},
    
    Recebemos uma solicitação para redefinir sua senha no Vinil D'oro.
    Clique no link abaixo para criar uma nova senha:
    
    ${resetLink}
    
    Se você não solicitou isso, ignore este e-mail.
  `;

  console.log(`--- [MOCK EMAIL] Enviado para ${user.email} ---`);
  console.log(`Assunto: Redefinição de Senha`);
  console.log(`Corpo: ${emailBody}`);
  
  // For usability in this demo environment, we alert the user to look at the console or just click the link we provide in alert
  alert(`(Simulação) E-mail de recuperação enviado para ${user.email}.\n\nPara testar, copie este link (também disponível no Console):\n\n${resetLink}`);
};
