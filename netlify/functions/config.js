export default async () => {
  const config = {
    headerHtml: process.env.HEADER_HTML || "",
    fbPixelId: process.env.FB_PIXEL_ID || "",
    capiEnabled: process.env.CAPI_ENABLED === "true",
    mailerLiteApiKeyPresent: !!process.env.MAILERLITE_API_KEY,
  };

  return new Response(JSON.stringify(config), {
    headers: { "Content-Type": "application/json" },
  });
};