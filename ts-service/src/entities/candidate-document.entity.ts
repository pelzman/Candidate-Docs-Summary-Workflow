import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

@Entity({ name: 'candidate_documents' })
export class CandidateDocument {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
    candidateId!: string;

    @Column({ name: 'document_type', type: 'varchar', length: 64 })
    documentType!: string;

    @Column({ name: 'file_name', type: 'text' })
    fileName!: string;

    @Column({ name: 'storage_key', type: 'text' })
    storageKey!: string;

    @Column({ name: 'raw_text', type: 'text' })
    rawText!: string;

    @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
    uploadedAt!: Date;

    @ManyToOne(() => SampleCandidate, (candidate) => candidate.documents, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate!: SampleCandidate;
}
