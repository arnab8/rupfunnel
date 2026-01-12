/**
 * Netlify Function: Update MailerLite Subscriber Tag
 * 
 * This function updates a subscriber's group assignment in MailerLite.
 * Used to transition subscribers from "Lead" to "Application" after booking.
 * 
 * IMPORTANT: Set the MAILERLITE_API_KEY environment variable in:
 * Netlify Dashboard → Site Settings → Environment Variables
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
    const { email, removeFromGroup, addToGroup } = body;

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

    // Get subscriber ID by email
    let subscriberId = null;
    try {
      const subscriberResponse = await fetch(
        `https://connect.mailerlite.com/api/subscribers/${email.toLowerCase().trim()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (subscriberResponse.ok) {
        const subscriberData = await subscriberResponse.json();
        subscriberId = subscriberData.data?.id;
      } else if (subscriberResponse.status !== 404) {
        console.error('Error fetching subscriber:', subscriberResponse.status);
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error);
    }

    if (!subscriberId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Subscriber not found' 
        }),
      };
    }

    // Remove subscriber from old group if specified
    if (removeFromGroup) {
      try {
        // Fetch all groups to find the one matching the group name
        const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        const groupsData = await groupsResponse.json();
        const removeGroup = groupsData.data?.find(g => g.name.toLowerCase() === removeFromGroup.toLowerCase());

        if (removeGroup) {
          const removeResponse = await fetch(
            `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${removeGroup.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            }
          );

          if (removeResponse.ok) {
            console.log(`Subscriber removed from group: ${removeFromGroup}`);
          } else {
            const errorText = await removeResponse.text();
            console.warn(`Failed to remove from group '${removeFromGroup}':`, removeResponse.status, errorText);
          }
        }
      } catch (error) {
        console.warn(`Error removing from group '${removeFromGroup}':`, error);
      }
    }

    // Add subscriber to new group if specified
    if (addToGroup) {
      try {
        // Fetch all groups to find the one matching the group name
        const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        const groupsData = await groupsResponse.json();
        const addGroup = groupsData.data?.find(g => g.name.toLowerCase() === addToGroup.toLowerCase());

        if (addGroup) {
          const addResponse = await fetch(
            `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${addGroup.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
            }
          );

          if (addResponse.ok) {
            console.log(`Subscriber added to group: ${addToGroup}`);
          } else {
            const errorText = await addResponse.text();
            console.warn(`Failed to add to group '${addToGroup}':`, addResponse.status, errorText);
          }
        } else {
          console.warn(`Group '${addToGroup}' not found in MailerLite. Create a group with this name in your MailerLite account.`);
        }
      } catch (error) {
        console.warn(`Error adding to group '${addToGroup}':`, error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Subscriber tag updated successfully',
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

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred' 
      }),
    };
  }
};
