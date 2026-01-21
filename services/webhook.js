
export const sendWebhook = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
       throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Webhook execution failed:', error);
    throw error;
  }
};
