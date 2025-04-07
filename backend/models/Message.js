const mongoose = require("mongoose");
const crypto = require("crypto");
const { Schema } = mongoose;

// --- Encryption Setup (Ensure secure key management) ---
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || "must-be-32-bytes-long-for-aes256"; // Use a secure 32-byte key from config/env
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString("hex") + ":" + encrypted.toString("hex"); // Store IV with text
    } catch (error) {
        console.error("Encryption failed:", error);
        // Decide on error handling: return null, throw, etc.
        return null;
    }
}

function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) return null; // Basic validation
    try {
        const textParts = text.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encryptedText = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        // Decide on error handling: return placeholder, null, log extensively
        return "[Decryption Error]";
    }
}
// --- End Encryption Setup ---


const messageSchema = new Schema(
  {
    // Link to the parent chat session.
    chatSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true, // Index for fetching messages of a session.
    },
    // The user who sent this specific message.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Encrypted message content.
    content: {
      type: String,
      required: true,
      set: encrypt, // Encrypt on save
      get: decrypt, // Decrypt on fetch
    },
    // Optional read status tracking.
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt. createdAt is the message timestamp.
    // Ensure getters (like decrypt) are applied when converting.
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;