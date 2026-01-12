export default async () => {
  const config = {
    // Meta Pixel Configuration
    metaPixelId: process.env.META_PIXEL_ID || "",
    headerCodeBlock: process.env.HEADER_HTML || "",
    capiEnabled: process.env.CAPI_ENABLED === "true",
    
    // MailerLite Configuration
    mailerLiteApiKeyPresent: !!process.env.MAILERLITE_API_KEY,
    mailerLiteGroupId: process.env.MAILERLITE_GROUP_ID || "",
    
    // Integration settings (optional; can also be stored in Admin)
    wistiaEmbedCode: process.env.WISTIA_EMBED_CODE || "",
    calComBookingSlug: process.env.CAL_COM_BOOKING_SLUG || "",
    
    // Thumbnail URL for global control
    homeThumbnailUrl: process.env.HOME_THUMBNAIL_URL || "",
    
    // Version / metadata
    version: "1.0.0",
  };

  return new Response(JSON.stringify(config), {
    headers: { "Content-Type": "application/json" },
  });
};