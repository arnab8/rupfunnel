/**
 * Netlify Function: MailerLite Subscriber Integration
 * 
 * This function accepts POST requests to add subscribers to MailerLite
 * with custom fields for UTM tracking and designation.
 * 
 * IMPORTANT: Set the MAILERLITE_API_KEY environment variable in:
 * Netlify Dashboard → Site Settings → Environment Variables
 * 
 * Get your API key from: https://dashboard.mailerlite.com/integrations/api
 */

exports.handler = async (event) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      }),
    };
  }

  // Get API key from environment variable
  const apiKey = process.env.MAILERLITE_API_KEY;

  if (!apiKey) {
    console.error('MAILERLITE_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server configuration error. MailerLite API key not configured.' 
      }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);

    // Validate required fields
    const { fullName, phone, email, designation, utmCampaign, utmContent, tags, groupId } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Email is required' 
        }),
      };
    }

    if (!fullName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Full name is required' 
        }),
      };
    }

    // Prepare subscriber data for MailerLite API v2
    // Docs: https://developers.mailerlite.com/docs/subscribers
    const subscriberData = {
      email: email.toLowerCase().trim(),
      name: fullName.trim(),
      fields: {
        phone: phone || '',
        designation: designation || '',
        utm_campaign: utmCampaign || '',
        utm_content: utmContent || '',
      },
    };

    // Add subscriber to MailerLite
    const subscriberResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(subscriberData),
    });

    const subscriberResult = await subscriberResponse.json();

    if (!subscriberResponse.ok) {
      console.error('MailerLite subscriber error:', subscriberResult);
      return {
        statusCode: subscriberResponse.status,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: subscriberResult.message || 'Failed to add subscriber to MailerLite' 
        }),
      };
    }

    const subscriberId = subscriberResult.data?.id;

    // Add subscriber to group if groupId is provided
    if (groupId && subscriberId) {
      try {
        const groupResponse = await fetch(
          `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${groupId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );

        if (!groupResponse.ok) {
          console.warn('Failed to add subscriber to group:', await groupResponse.text());
        }
      } catch (groupError) {
        console.warn('Error adding subscriber to group:', groupError);
        // Don't fail the whole request if group assignment fails
      }
    }

    // Assign tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0 && subscriberId) {
      for (const tagName of tags) {
        try {
          // First, find or create the tag
          // MailerLite API requires tag ID, so we need to search for it first
          const tagSearchResponse = await fetch(
            `https://connect.mailerlite.com/api/groups?filter[name]=${encodeURIComponent(tagName)}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            }
          );

          // If tag search fails, we'll try to assign by name using the upsert approach
          // by adding to a group (MailerLite treats groups as tags in some contexts)
          
          // Assign tag to subscriber
          await fetch(
            `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                groups: [tagName], // This will create the group/tag if it doesn't exist
              }),
            }
          );
        } catch (tagError) {
          console.warn(`Error assigning tag "${tagName}":`, tagError);
          // Continue with other tags even if one fails
        }
      }
    }

    console.log('Subscriber added successfully:', subscriberResult.data?.email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Subscriber added successfully',
        subscriberId: subscriberId,
      }),
    };

  } catch (error) {
    console.error('Function error:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
      };
    }

    // Handle network errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error. Please try again later.' 
      }),
    };
  }
};
