import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' });

async function run() {
  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{
          title: "Test",
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 100
        }],
        back_urls: {
          success: "https://example.com/success",
          failure: "https://example.com/failure",
          pending: "https://example.com/pending"
        },
        auto_return: "approved"
      } as any
    });
    console.log("Success:", result.id);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
