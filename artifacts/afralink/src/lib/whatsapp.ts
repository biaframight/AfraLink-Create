export function getWhatsAppUrl(phone: string, text: string) {
  // Remove leading zero if present and ensure it starts with 234
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "234" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("234")) {
    cleanPhone = "234" + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
