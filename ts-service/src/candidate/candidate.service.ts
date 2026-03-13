import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { UploadCandidateDocumentDto } from './dto/upload-candidate-document.dto';
import { QueueService } from '../queue/queue.service';

export interface GenerateSummaryJobPayload {
    candidateId: string;
    summaryId: string;
}

@Injectable()
export class CandidateService {
    constructor(
        @InjectRepository(SampleCandidate)
        private readonly candidateRepo: Repository<SampleCandidate>,
        @InjectRepository(CandidateDocument)
        private readonly documentRepo: Repository<CandidateDocument>,
        @InjectRepository(CandidateSummary)
        private readonly summaryRepo: Repository<CandidateSummary>,
        private readonly queueService: QueueService,
    ) { }

    private async ensureCandidateAccess(
        workspaceId: string,
        candidateId: string,
    ): Promise<SampleCandidate> {
        const candidate = await this.candidateRepo.findOne({
            where: { id: candidateId },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found');
        }

        if (candidate.workspaceId !== workspaceId) {
            throw new ForbiddenException(
                'You do not have access to this candidate',
            );
        }

        return candidate;
    }

    async uploadDocument(
        workspaceId: string,
        candidateId: string,
        dto: UploadCandidateDocumentDto,
    ) {
        await this.ensureCandidateAccess(workspaceId, candidateId);

        const doc = this.documentRepo.create({
            candidateId,
            documentType: dto.documentType,
            fileName: dto.fileName,
            storageKey: dto.storageKey,
            rawText: dto.rawText,
        });

        return this.documentRepo.save(doc);
    }

    async requestSummaryGeneration(
        workspaceId: string,
        candidateId: string,
    ) {
        await this.ensureCandidateAccess(workspaceId, candidateId);

        // Create a pending summary record
        const summary = this.summaryRepo.create({
            candidateId,
            status: 'pending',
        });

        const savedSummary = await this.summaryRepo.save(summary);

        // Enqueue job safely typed
        const payload: GenerateSummaryJobPayload = {
            candidateId,
            summaryId: savedSummary.id,
        };

        this.queueService.enqueue('generate-summary', payload);

        return {
            message: 'Summary generation queued',
            summaryId: savedSummary.id,
        };
    }

    async listSummaries(workspaceId: string, candidateId: string) {
        await this.ensureCandidateAccess(workspaceId, candidateId);

        return this.summaryRepo.find({
            where: { candidateId },
            order: { createdAt: 'DESC' },
        });
    }

    async getSummary(workspaceId: string, candidateId: string, summaryId: string) {
        await this.ensureCandidateAccess(workspaceId, candidateId);

        const summary = await this.summaryRepo.findOne({
            where: { id: summaryId, candidateId },
        });

        if (!summary) {
            throw new NotFoundException('Summary not found');
        }

        return summary;
    }
}
