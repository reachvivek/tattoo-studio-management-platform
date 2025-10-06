"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
class WhatsAppService {
    async sendWelcomeMessage(phoneNumber, name) {
        // TODO: Integrate WhatsApp Business API
        console.log(`📱 WhatsApp message would be sent to ${phoneNumber}:`);
        console.log(`Hallo ${name}! 🎉 Herzlichen Glückwunsch! Du hast einen 30% Gutschein gewonnen!`);
    }
    formatPhoneNumber(countryCode, number) {
        return `${countryCode}${number.replace(/\D/g, '')}`;
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();
//# sourceMappingURL=whatsapp.service.js.map