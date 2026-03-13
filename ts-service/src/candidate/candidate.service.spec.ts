import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { CandidateService } from './candidate.service';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { QueueService } from '../queue/queue.service';

describe('CandidateService', () => {
    let service: CandidateService;

    const candidateRepo = {
        findOne: jest.fn(),
    };

    const documentRepo = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const summaryRepo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const queueService = {
        enqueue: jest.fn(),
    };

    const mockCandidate = {
        id: 'candidate-1',
        workspaceId: 'workspace-1',
        fullName: 'Jane Doe',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CandidateService,
                { provide: getRepositoryToken(SampleCandidate), useValue: candidateRepo },
                { provide: getRepositoryToken(CandidateDocument), useValue: documentRepo },
                { provide: getRepositoryToken(CandidateSummary), useValue: summaryRepo },
                { provide: QueueService, useValue: queueService },
            ],
        }).compile();

        service = module.get<CandidateService>(CandidateService);
    });

    describe('uploadDocument', () => {
        it('should upload a document for a candidate in the same workspace', async () => {
            candidateRepo.findOne.mockResolvedValue(mockCandidate);
            documentRepo.create.mockImplementation((val: unknown) => val);
            documentRepo.save.mockImplementation(async (val: unknown) => ({ id: 'doc-1', ...val as object }));

            const dto = {
                documentType: 'resume',
                fileName: 'resume.pdf',
                storageKey: 'uploads/resume.pdf',
                rawText: 'Experienced engineer...',
            };

            const result = await service.uploadDocument('workspace-1', 'candidate-1', dto);

            expect(candidateRepo.findOne).toHaveBeenCalledWith({ where: { id: 'candidate-1' } });
            expect(documentRepo.create).toHaveBeenCalledWith({
                candidateId: 'candidate-1',
                documentType: 'resume',
                fileName: 'resume.pdf',
                storageKey: 'uploads/resume.pdf',
                rawText: 'Experienced engineer...',
            });
            expect(result.candidateId).toBe('candidate-1');
        });

        it('should throw NotFoundException if candidate does not exist', async () => {
            candidateRepo.findOne.mockResolvedValue(null);

            await expect(
                service.uploadDocument('workspace-1', 'nonexistent', {
                    documentType: 'resume',
                    fileName: 'resume.pdf',
                    storageKey: 'key',
                    rawText: 'text',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if candidate belongs to another workspace', async () => {
            candidateRepo.findOne.mockResolvedValue({ ...mockCandidate, workspaceId: 'other-workspace' });

            await expect(
                service.uploadDocument('workspace-1', 'candidate-1', {
                    documentType: 'resume',
                    fileName: 'resume.pdf',
                    storageKey: 'key',
                    rawText: 'text',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('requestSummaryGeneration', () => {
        it('should create a pending summary and enqueue a job', async () => {
            candidateRepo.findOne.mockResolvedValue(mockCandidate);
            summaryRepo.create.mockImplementation((val: unknown) => val);
            summaryRepo.save.mockResolvedValue({ id: 'summary-1', candidateId: 'candidate-1', status: 'pending' });
            queueService.enqueue.mockReturnValue({ id: 'job-1', name: 'generate-summary' });

            const result = await service.requestSummaryGeneration('workspace-1', 'candidate-1');

            expect(result.summaryId).toBe('summary-1');
            expect(result.message).toBe('Summary generation queued');
            expect(queueService.enqueue).toHaveBeenCalledWith('generate-summary', {
                candidateId: 'candidate-1',
                summaryId: 'summary-1',
            });
        });

        it('should throw ForbiddenException for cross-workspace access', async () => {
            candidateRepo.findOne.mockResolvedValue({ ...mockCandidate, workspaceId: 'other-workspace' });

            await expect(
                service.requestSummaryGeneration('workspace-1', 'candidate-1'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('listSummaries', () => {
        it('should return summaries for a candidate in the same workspace', async () => {
            candidateRepo.findOne.mockResolvedValue(mockCandidate);
            const mockSummaries = [
                { id: 'summary-1', candidateId: 'candidate-1', status: 'completed' },
                { id: 'summary-2', candidateId: 'candidate-1', status: 'pending' },
            ];
            summaryRepo.find.mockResolvedValue(mockSummaries);

            const result = await service.listSummaries('workspace-1', 'candidate-1');

            expect(result).toEqual(mockSummaries);
            expect(summaryRepo.find).toHaveBeenCalledWith({
                where: { candidateId: 'candidate-1' },
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('getSummary', () => {
        it('should return a single summary', async () => {
            candidateRepo.findOne.mockResolvedValue(mockCandidate);
            const mockSummary = { id: 'summary-1', candidateId: 'candidate-1', status: 'completed' };
            summaryRepo.findOne.mockResolvedValue(mockSummary);

            const result = await service.getSummary('workspace-1', 'candidate-1', 'summary-1');

            expect(result).toEqual(mockSummary);
        });

        it('should throw NotFoundException if summary does not exist', async () => {
            candidateRepo.findOne.mockResolvedValue(mockCandidate);
            summaryRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getSummary('workspace-1', 'candidate-1', 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
