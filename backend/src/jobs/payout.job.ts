import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { initiatePayout } from '../lib/stitch';
import { logger } from '../lib/logger';
import { notificationsQueue } from './queues';
import type { PayoutJobData } from './queues';

export async function processPayoutJob(data: PayoutJobData): Promise<void> {
  const { payoutId } = data;

  const payout = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
    include: { farmer: true },
  });

  // Stalled-job recovery: worker crashed after calling the PSP but before persisting PAID.
  // pspReference being set proves the bank transfer already went out — skip the PSP call.
  if (payout.status === 'PROCESSING' && payout.pspReference) {
    logger.warn({ payoutId, pspRef: payout.pspReference }, 'Stalled job recovery — PSP ref found, marking PAID');
    await prisma.payout.update({ where: { id: payoutId }, data: { status: 'PAID', paidAt: new Date() } });
    return;
  }

  if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
    logger.info({ payoutId }, 'Payout already settled — skipping');
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
      amount: parseFloat(payout.netAmount.toFixed(2)),
      currency: 'ZAR',
      beneficiaryAccountRef: payout.farmer.bankAccountRef ?? '',
      beneficiaryName: payout.farmer.displayName,
    });
  }

  // Persist pspReference BEFORE marking PAID.  If the process crashes between these
  // two writes the stalled-recovery path above will find pspReference set and skip
  // a duplicate PSP call on the next attempt.
  await prisma.payout.update({ where: { id: payoutId }, data: { pspReference: pspRef } });
  await prisma.payout.update({ where: { id: payoutId }, data: { status: 'PAID', paidAt: new Date() } });

  if (payout.farmer.id) {
    const user = await prisma.user.findUnique({ where: { id: payout.farmer.userId } });
    if (user?.phone) {
      await notificationsQueue.add('payout_processed', {
        channel: 'whatsapp',
        to: user.phone,
        templateId: 'payout_processed',
        variables: {
          amount: `R${payout.netAmount.toFixed(2)}`,
          reference: pspRef,
        },
      });
    }
  }

  logger.info({ payoutId, pspRef }, 'Payout completed');
}

export function startPayoutWorker() {
  const worker = new Worker<PayoutJobData>(
    'payouts',
    (job: Job<PayoutJobData>) => processPayoutJob(job.data),
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
