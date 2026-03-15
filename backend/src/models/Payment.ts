import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: string;
  userId?: mongoose.Types.ObjectId;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pendente' | 'pago' | 'falhou' | 'cancelado';
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  mercadoPagoPaymentId?: string;
  preferenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  orderId: {
    type: String,
    required: [true, 'Order ID é obrigatório']
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0.01, 'Valor deve ser maior que 0']
  },
  currency: {
    type: String,
    required: [true, 'Moeda é obrigatória'],
    default: 'BRL'
  },
  status: {
    type: String,
    enum: ['pendente', 'pago', 'falhou', 'cancelado'],
    default: 'pendente'
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'credit_card', 'debit_card', 'boleto'],
    required: [true, 'Método de pagamento é obrigatório']
  },
  mercadoPagoPaymentId: {
    type: String,
    sparse: true
  },
  preferenceId: {
    type: String,
    required: [true, 'Preference ID é obrigatório']
  }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);