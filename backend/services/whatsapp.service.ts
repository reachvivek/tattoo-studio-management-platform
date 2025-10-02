export class WhatsAppService {
  async sendWelcomeMessage(phoneNumber: string, name: string): Promise<void> {
    // TODO: Integrate WhatsApp Business API
    console.log(`📱 WhatsApp message would be sent to ${phoneNumber}:`);
    console.log(`Hallo ${name}! 🎉 Herzlichen Glückwunsch! Du hast einen 30% Gutschein gewonnen!`);
  }

  formatPhoneNumber(countryCode: string, number: string): string {
    return `${countryCode}${number.replace(/\D/g, '')}`;
  }
}

export const whatsappService = new WhatsAppService();
