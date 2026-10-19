import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AcService } from '../services/ac.service';
import { DealReadyForBillingPayload } from '@contracts';

/**
 * BullMQ consumer for the 'billing' queue.
 *
 * Listens for 'deal.ready_for_billing' jobs published by CrmService.markDealWon().
 * On receipt, creates a DRAFT invoice in the AC (accounting) schema.
 *
 * Retry policy is set on the producer side (3 attempts, exponential backoff).
 * This consumer is idempotent-safe because invoiceNumber is derived from
 * a sequential count — duplicate job execution would attempt to INSERT a
 * duplicate invoiceNumber, which is caught by the UNIQUE constraint.
 */
@Processor('billing')
export class DealBillingConsumer {
  private readonly logger = new Logger(DealBillingConsumer.name);

  constructor(private readonly acService: AcService) {}

  @Process('deal.ready_for_billing')
  async handleDealReadyForBilling(
    job: Job<DealReadyForBillingPayload>,
  ): Promise<void> {
    this.logger.log(
      `Processing billing job ${job.id} for deal ${job.data.dealId}`,
    );

    const { dealId, clientOrgId, amount, currency } = job.data;

    await this.acService.createDraftInvoiceFromDeal({
      dealId,
      clientOrgId,
      amount: amount.toString(),
      currency,
    });

    this.logger.log(
      `Billing job ${job.id} completed — draft invoice created for deal ${dealId}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job): void {
    this.logger.debug(`Job ${job.id} [${job.name}] completed successfully.`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Job ${job.id} [${job.name}] failed after ${job.attemptsMade} attempt(s): ${err.message}`,
      err.stack,
    );
  }
}
