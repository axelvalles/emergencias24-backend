// src/webhook/dto/whatsapp-webhook.dto.ts

// --- Tipos Base (igual que antes) ---
interface Profile {
  name: string;
}
interface Contact {
  profile: Profile;
  wa_id: string;
}
interface TextMessage {
  body: string;
}
interface Metadata {
  display_phone_number: string;
  phone_number_id: string;
}

// --- Tipos de Mensajes ---
interface Message {
  from: string;
  id: string;
  timestamp: string;
  text: TextMessage;
  type: 'text';
}

// --- Tipos de Estados ---
interface Status {
  id: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  recipient_id: string;
  conversation?: { id: string; origin: { type: string } };
  pricing?: { billable: boolean; pricing_model: string; category: string };
}

// --- UNIONES DISCRIMINADAS (LA PARTE CLAVE) ---

// Tipo base para el objeto 'value'
interface BaseValue {
  messaging_product: 'whatsapp';
  metadata: Metadata;
}

// Tipo específico para cuando llega un mensaje
export interface IncomingMessageValue extends BaseValue {
  contacts: Contact[];
  messages: Message[];
  statuses?: never; // Asegura que 'statuses' no exista en este tipo
}

// Tipo específico para cuando llega una notificación de estado
interface StatusUpdateValue extends BaseValue {
  statuses: Status[];
  messages?: never; // Asegura que 'messages' no exista en este tipo
}

// El tipo 'Value' ahora puede ser una de las dos formas
export type WebhookValue = IncomingMessageValue | StatusUpdateValue;

// --- Interfaces Principales (actualizadas) ---
interface Change {
  value: WebhookValue;
  field: 'messages';
}

interface Entry {
  id: string;
  changes: Change[];
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Entry[];
}
