import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentEvent extends Document {
  paymentId: mongoose.Types.ObjectId;
  eventType: string;
  payload: any;
  processed: boolean;
  createdAt: Date;
}

const PaymentEventSchema: Schema = new Schema({
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment ID é obrigatório']
  },
  eventType: {
    type: String,
    required: [true, 'Tipo de evento é obrigatório']
  },
  payload: {
    type: Schema.Types.Mixed,
    required: [true, 'Payload é obrigatório']
  },
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.PaymentEvent || mongoose.model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);
