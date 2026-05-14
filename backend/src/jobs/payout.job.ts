import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { initiatePayout } from '../lib/stitch';
import { logger } from '../lib/logger';
import { notificationsQueue } from './queues';
import type { PayoutJobData } from './queues';

export function startPayoutWorker() {
  const worker = new Worker<PayoutJobData>(
    'payouts',
    async (job: Job<PayoutJobData>) => {
      const { payoutId } = job.data;

      const payout = await prisma.payout.findUniqueOrThrow({
        where: { id: payoutId },
        include: { farmer: true },
      });

      if (payout.status !== 'PENDING') {
        logger.info({ payoutId }, 'Payout already processed — skipping');
        return;
      }

      await prisma.payout.update({ where: { id: payoutId }, data: { status: 'PROCESSING' } });

      let pspRef: string;
      if (!process.env.STITCH_CLIENT_ID) {
        // Mock mode: no real Stitch credentials — simulate instant settlement
        pspRef = `MOCK-${payout.id.slice(0, 8).toUpperCase()}`;
        logger.info({ payoutId, pspRef }, 'Mock payout (no Stitch credentials)');
      } else {
        pspRef = await initiatePayout({
          reference: payout.id,
          amount: Number(payout.netAmount),
          currency: 'ZAR',
          beneficiaryAccountRef: payout.farmer.bankAccountRef ?? '',
          beneficiaryName: payout.farmer.displayName,
        });
      }

      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'PAID', pspReference: pspRef, paidAt: new Date() },
      });

      if (payout.farmer.id) {
        const user = await prisma.user.findUnique({ where: { id: payout.farmer.userId } });
        if (user?.phone) {
          await notificationsQueue.add('payout_processed', {
            channel: 'whatsapp',
            to: user.phone,
            templateId: 'payout_processed',
            variables: {
              amount: `R${Number(payout.netAmount).toFixed(2)}`,
              reference: pspRef,
            },
          });
        }
      }

      logger.info({ payoutId, pspRef }, 'Payout completed');
    },
    { connection: redis, concurrency: 5 }
  );

  worker.on('failed', async (job, err) => {
    logger.error({ payoutId: job?.data.payoutId, err }, 'Payout job failed');
    if (job) {
      await prisma.payout.update({ where: { id: job.data.payoutId }, data: { status: 'FAILED' } });
    }
  });

  return worker;
}
