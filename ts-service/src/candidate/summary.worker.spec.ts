import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SummaryWorker } from './summary.worker';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { QueueService } from '../queue/queue.service';
import { SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';
import { FakeSummarizationProvider } from '../llm/fake-summarization.provider';

describe('SummaryWorker', () => {
    let worker: SummaryWorker;
    let queueService: QueueService;

    const summaryRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    const documentRepo = {
        find: jest.fn(),
    };

    const fakeProvider = new FakeSummarizationProvider();

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummaryWorker,
                QueueService,
                { provide: getRepositoryToken(CandidateSummary), useValue: summaryRepo },
                { provide: getRepositoryToken(CandidateDocument), useValue: documentRepo },
                { provide: SUMMARIZATION_PROVIDER, useValue: fakeProvider },
            ],
        }).compile();

        worker = module.get<SummaryWorker>(SummaryWorker);
        queueService = module.get<QueueService>(QueueService);
    });

    it('should skip processing when queue is empty', async () => {
        await worker.processNextJob();

        expect(summaryRepo.findOne).not.toHaveBeenCalled();
    });

    it('should process a pending summary job to completion', async () => {
        // Enqueue a job
        queueService.enqueue('generate-summary', {
            candidateId: 'candidate-1',
            summaryId: 'summary-1',
        });

        const pendingSummary = {
            id: 'summary-1',
            candidateId: 'candidate-1',
            status: 'pending' as const,
            score: null,
            strengths: null,
            concerns: null,
            summary: null,
            recommendedDecision: null,
            provider: null,
            promptVersion: null,
        };

        summaryRepo.findOne.mockResolvedValue(pendingSummary);
        documentRepo.find.mockResolvedValue([
            { id: 'doc-1', candidateId: 'candidate-1', rawText: 'Experienced software engineer with 5 years...' },
        ]);
        summaryRepo.save.mockResolvedValue(pendingSummary);

        await worker.processNextJob();

        expect(summaryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'summary-1' } });
        expect(documentRepo.find).toHaveBeenCalledWith({ where: { candidateId: 'candidate-1' } });
        expect(summaryRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'completed',
                score: expect.any(Number),
                strengths: expect.any(Array),
                concerns: expect.any(Array),
                summary: expect.any(String),
                recommendedDecision: expect.stringMatching(/^(advance|hold|reject)$/),
                provider: 'FakeSummarizationProvider',
                promptVersion: 'v1.0',
            }),
        );
    });

    it('should skip if summary record is not found', async () => {
        queueService.enqueue('generate-summary', {
            candidateId: 'candidate-1',
            summaryId: 'nonexistent',
        });

        summaryRepo.findOne.mockResolvedValue(null);

        await worker.processNextJob();

        expect(summaryRepo.save).not.toHaveBeenCalled();
        expect(summaryRepo.update).not.toHaveBeenCalled();
    });

    it('should skip if summary is already processed', async () => {
        queueService.enqueue('generate-summary', {
            candidateId: 'candidate-1',
            summaryId: 'summary-1',
        });

        summaryRepo.findOne.mockResolvedValue({
            id: 'summary-1',
            status: 'completed',
        });

        await worker.processNextJob();

        expect(documentRepo.find).not.toHaveBeenCalled();
        expect(summaryRepo.save).not.toHaveBeenCalled();
    });

    it('should mark summary as failed when provider throws', async () => {
        const failingProvider = {
            generateCandidateSummary: jest.fn().mockRejectedValue(new Error('LLM API error')),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummaryWorker,
                QueueService,
                { provide: getRepositoryToken(CandidateSummary), useValue: summaryRepo },
                { provide: getRepositoryToken(CandidateDocument), useValue: documentRepo },
                { provide: SUMMARIZATION_PROVIDER, useValue: failingProvider },
            ],
        }).compile();

        const failWorker = module.get<SummaryWorker>(SummaryWorker);
        const failQueue = module.get<QueueService>(QueueService);

        failQueue.enqueue('generate-summary', {
            candidateId: 'candidate-1',
            summaryId: 'summary-1',
        });

        summaryRepo.findOne.mockResolvedValue({
            id: 'summary-1',
            candidateId: 'candidate-1',
            status: 'pending',
        });
        documentRepo.find.mockResolvedValue([
            { id: 'doc-1', candidateId: 'candidate-1', rawText: 'Some text' },
        ]);

        await failWorker.processNextJob();

        expect(summaryRepo.update).toHaveBeenCalledWith(
            { id: 'summary-1' },
            {
                status: 'failed',
                errorMessage: 'LLM API error',
            },
        );
    });

    it('should dequeue jobs from the queue after processing', async () => {
        queueService.enqueue('generate-summary', {
            candidateId: 'candidate-1',
            summaryId: 'summary-1',
        });

        summaryRepo.findOne.mockResolvedValue({
            id: 'summary-1',
            candidateId: 'candidate-1',
            status: 'pending',
        });
        documentRepo.find.mockResolvedValue([]);
        summaryRepo.save.mockResolvedValue({});

        await worker.processNextJob();

        // Queue should now be empty
        expect(queueService.getQueuedJobs()).toHaveLength(0);
    });
});
