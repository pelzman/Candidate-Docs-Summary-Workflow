import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QueueService } from '../queue/queue.service';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { GenerateSummaryJobPayload } from './candidate.service';
import {
    SummarizationProvider,
    SUMMARIZATION_PROVIDER,
} from '../llm/summarization-provider.interface';

const PROMPT_VERSION = 'v1.0';

@Injectable()
export class SummaryWorker implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(SummaryWorker.name);
    private workerInterval: NodeJS.Timeout | null = null;

    constructor(
        private readonly queueService: QueueService,
        @Inject(SUMMARIZATION_PROVIDER)
        private readonly provider: SummarizationProvider,
        @InjectRepository(CandidateSummary)
        private readonly summaryRepo: Repository<CandidateSummary>,
        @InjectRepository(CandidateDocument)
        private readonly documentRepo: Repository<CandidateDocument>,
    ) { }

    onApplicationBootstrap() {
        this.startWorker();
    }

    onApplicationShutdown() {
        if (this.workerInterval) {
            clearInterval(this.workerInterval);
            this.workerInterval = null;
            this.logger.log('Summary worker stopped.');
        }
    }

    startWorker() {
        this.workerInterval = setInterval(() => this.processNextJob(), 5000);
        this.logger.log('Summary worker started, polling every 5s.');
    }

    async processNextJob() {
        const job = this.queueService.dequeue<GenerateSummaryJobPayload>('generate-summary');

        if (!job) {
            return;
        }

        const { candidateId, summaryId } = job.payload;

        this.logger.log(`Processing summary generation for candidate ${candidateId}`);

        try {
            const summaryRecord = await this.summaryRepo.findOne({ where: { id: summaryId } });
            if (!summaryRecord) {
                this.logger.warn(`Summary record ${summaryId} not found, skipping.`);
                return;
            }

            if (summaryRecord.status !== 'pending') {
                this.logger.warn(`Summary record ${summaryId} already processed (status: ${summaryRecord.status}).`);
                return;
            }

            // Fetch candidate documents
            const docs = await this.documentRepo.find({ where: { candidateId } });
            const rawDocumentsContent = docs.map((d) => d.rawText);

            // Call LLM provider
            const result = await this.provider.generateCandidateSummary({
                candidateId,
                documents: rawDocumentsContent,
            });

            // Update the record with completed status and result
            summaryRecord.status = 'completed';
            summaryRecord.score = result.score;
            summaryRecord.strengths = result.strengths;
            summaryRecord.concerns = result.concerns;
            summaryRecord.summary = result.summary;
            summaryRecord.recommendedDecision = result.recommendedDecision;
            summaryRecord.provider = this.provider.constructor.name;
            summaryRecord.promptVersion = PROMPT_VERSION;

            await this.summaryRepo.save(summaryRecord);
            this.logger.log(`Successfully completed summary generation for candidate ${candidateId}`);

        } catch (error: any) {
            this.logger.error(`Failed to process summary job: ${error.message}`, error.stack);

            // Mark summary as failed with error details
            await this.summaryRepo.update({ id: summaryId }, {
                status: 'failed',
                errorMessage: error.message || 'Unknown error during summary generation',
            });
        }
    }
}

