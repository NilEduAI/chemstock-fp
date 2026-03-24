import { supabase } from './supabase';

export const sendLowStockAlert = async (productData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-alert', {
      body: {
        productName: productData.name,
        currentQuantity: productData.quantity,
        minQuantity: productData.minQuantity || productData.min_quantity,
      }
    });

    if (error) throw error;
    console.log('Alerta de stock bajo iniciada vía Edge Function', data);
    return data;
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
  }
};
