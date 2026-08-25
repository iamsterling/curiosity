export const sanitizeTerminalText = (value: string): string =>
  Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/gu, "�"))
    .slice(0, 160)
    .join("");

export const sanitizeConversationText = (value: string): string =>
  value.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/gu, "�");
