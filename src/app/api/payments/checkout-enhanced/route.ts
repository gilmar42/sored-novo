import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = 'http://localhost:3001';
    const body = await request.json();
    
    // Criar preferência com parâmetros forçados
    const response = await fetch(`${backendUrl}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData || { error: 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Se for pagamento com cartão, retornar URL modificada com mais parâmetros
    if (body.paymentMethod === 'credit_card' && data.initPoint) {
      const baseUrl = data.initPoint;
      const separator = baseUrl.includes('?') ? '&' : '?';
      
      // Parâmetros adicionais para forçar comportamento específico
      const enhancedUrl = `${baseUrl}${separator}installments=1&disable_coupon=true&exclude_payment_type=atm,ticket,debit_card,bank_transfer&binary_mode=false&wallet=mercadopago&force_checkout_pro=true`;
      
      return NextResponse.json({
        ...data,
        initPoint: enhancedUrl,
        enhancedCheckout: true
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
