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

    // Handle tags as groups in MailerLite v2
    // If "Lead" tag is provided, add subscriber to the Lead group
    if (tags && Array.isArray(tags) && subscriberId) {
      for (const tag of tags) {
        // Fetch all groups to find the one matching the tag name
        try {
          const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          const groupsData = await groupsResponse.json();
          const matchingGroup = groupsData.data?.find(g => g.name.toLowerCase() === tag.toLowerCase());

          if (matchingGroup) {
            // Add subscriber to the matching group
            const tagGroupResponse = await fetch(
              `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${matchingGroup.id}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
              }
            );

            if (!tagGroupResponse.ok) {
              const errorText = await tagGroupResponse.text();
              console.warn(`Failed to add subscriber to tag group '${tag}':`, tagGroupResponse.status, errorText);
            } else {
              console.log(`Subscriber added to tag group: ${tag}`);
            }
          } else {
            console.warn(`Tag group '${tag}' not found in MailerLite. Create a group with this name in your MailerLite account.`);
          }
        } catch (tagError) {
          console.warn(`Error processing tag '${tag}':`, tagError);
        }
      }
    }

    // Add subscriber to main group if groupId is provided
    // In MailerLite, groups are the primary segmentation mechanism
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
          const errorText = await groupResponse.text();
          console.warn('Failed to add subscriber to group:', groupResponse.status, errorText);
          // Don't fail the whole request, but log it for debugging
        } else {
          console.log('Subscriber added to group:', groupId);
        }
      } catch (groupError) {
        console.warn('Error adding subscriber to group:', groupError);
        // Don't fail the whole request if group assignment fails
      }
    }

    // Note: In MailerLite v2, "tags" are custom groups. If you want to segment by tags,
    // create those as separate groups in your MailerLite account and pass the groupId here.
    // The "tags" array parameter is informational; if you need to add subscribers to multiple
    // groups, pass multiple groupIds in the request (this would require a schema change).
    // For now, we only support one groupId per subscription.
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      console.log('Tags provided:', tags.join(', '), '— Note: Use groupId for proper segmentation in MailerLite v2');
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
