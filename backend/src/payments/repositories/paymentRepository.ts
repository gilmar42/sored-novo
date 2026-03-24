import prisma from '../../lib/prisma';

class PaymentRepository {
  async createPayment(data: any) {
    return prisma.payment.create({ data });
  }

  async findPaymentById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  }

  async findPaymentByOrderId(orderId: string) {
    return prisma.payment.findFirst({ where: { orderId } });
  }

  async updatePayment(id: string, data: any) {
    return prisma.payment.update({ where: { id }, data });
  }

  async createPaymentEvent(data: any) {
    return prisma.paymentEvent.create({ data });
  }
}

export default new PaymentRepository();
