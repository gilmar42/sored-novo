import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const backendUrl = 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/payments/pix/qrcode/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData || { error: 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying PIX QR Code to backend:', error);
    return NextResponse.json(
      { error: 'Failed to get PIX QR Code' },
      { status: 500 }
    );
  }
}
