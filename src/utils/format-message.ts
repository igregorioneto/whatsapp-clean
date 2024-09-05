export function formatMessage(message: string) {
  const maxLength = 20;
  if (message.length > maxLength) {
    return `...${message.slice(-maxLength)}`;
  }
  return message;
}