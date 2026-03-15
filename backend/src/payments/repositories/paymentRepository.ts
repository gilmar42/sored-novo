import Payment from '../../models/Payment';
import PaymentEvent from '../../models/PaymentEvent';

class PaymentRepository {
  async createPayment(data: any) {
    const payment = new Payment(data);
    return await payment.save();
  }

  async findPaymentById(id: string) {
    return await Payment.findById(id);
  }

  async findPaymentByOrderId(orderId: string) {
    return await Payment.findOne({ orderId });
  }

  async updatePayment(id: string, data: any) {
    return await Payment.findByIdAndUpdate(id, data, { new: true });
  }

  async createPaymentEvent(data: any) {
    const event = new PaymentEvent(data);
    return await event.save();
  }
}

export default new PaymentRepository();