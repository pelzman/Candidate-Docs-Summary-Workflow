import { IsNotEmpty, IsString } from 'class-validator';

export class UploadCandidateDocumentDto {
    @IsString()
    @IsNotEmpty()
    documentType!: string;

    @IsString()
    @IsNotEmpty()
    fileName!: string;

    @IsString()
    @IsNotEmpty()
    storageKey!: string;

    @IsString()
    @IsNotEmpty()
    rawText!: string;
}
