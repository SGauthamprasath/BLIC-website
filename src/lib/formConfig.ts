// src/lib/formConfig.ts

// Google Apps Script Web App URL
export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
// Form submission function
export const submitToGoogleSheets = async (formData: {
  name: string;
  phone: string;
  email: string;
  message: string;
}) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Note: With 'no-cors' mode, we can't read the response
    // We assume success if no error is thrown
    return { success: true };
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};