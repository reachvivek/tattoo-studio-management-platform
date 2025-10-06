"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityType = exports.LeadStatus = void 0;
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["CONVERTED"] = "converted";
    LeadStatus["REJECTED"] = "rejected";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["EMAIL_SENT"] = "email_sent";
    ActivityType["WHATSAPP_SENT"] = "whatsapp_sent";
    ActivityType["STATUS_CHANGED"] = "status_changed";
    ActivityType["NOTE_ADDED"] = "note_added";
    ActivityType["LEAD_CREATED"] = "lead_created";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
//# sourceMappingURL=lead.model.js.map