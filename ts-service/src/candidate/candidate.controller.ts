import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
    HttpCode,
} from '@nestjs/common';

import { CandidateService } from './candidate.service';
import { UploadCandidateDocumentDto } from './dto/upload-candidate-document.dto';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';

@Controller('candidates')
@UseGuards(FakeAuthGuard)
export class CandidateController {
    constructor(private readonly candidateService: CandidateService) { }

    @Post(':candidateId/documents')
    async uploadDocument(
        @CurrentUser() user: AuthUser,
        @Param('candidateId', ParseUUIDPipe) candidateId: string,
        @Body() dto: UploadCandidateDocumentDto,
    ) {
        return this.candidateService.uploadDocument(user.workspaceId, candidateId, dto);
    }

    @Post(':candidateId/summaries/generate')
    @HttpCode(202)
    async generateSummary(
        @CurrentUser() user: AuthUser,
        @Param('candidateId', ParseUUIDPipe) candidateId: string,
    ) {
        return this.candidateService.requestSummaryGeneration(user.workspaceId, candidateId);
    }

    @Get(':candidateId/summaries')
    async listSummaries(
        @CurrentUser() user: AuthUser,
        @Param('candidateId', ParseUUIDPipe) candidateId: string,
    ) {
        return this.candidateService.listSummaries(user.workspaceId, candidateId);
    }

    @Get(':candidateId/summaries/:summaryId')
    async getSummary(
        @CurrentUser() user: AuthUser,
        @Param('candidateId', ParseUUIDPipe) candidateId: string,
        @Param('summaryId', ParseUUIDPipe) summaryId: string,
    ) {
        return this.candidateService.getSummary(user.workspaceId, candidateId, summaryId);
    }
}
