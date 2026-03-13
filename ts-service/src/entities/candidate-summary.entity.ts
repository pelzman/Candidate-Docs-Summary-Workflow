import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
    candidateId!: string;

    @Column({ type: 'varchar', length: 32, default: 'pending' })
    status!: 'pending' | 'completed' | 'failed';

    @Column({ type: 'int', nullable: true })
    score!: number | null;

    @Column({ type: 'jsonb', nullable: true })
    strengths!: string[] | null;

    @Column({ type: 'jsonb', nullable: true })
    concerns!: string[] | null;

    @Column({ type: 'text', nullable: true })
    summary!: string | null;

    @Column({ name: 'recommended_decision', type: 'varchar', length: 32, nullable: true })
    recommendedDecision!: 'advance' | 'hold' | 'reject' | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    provider!: string | null;

    @Column({ name: 'prompt_version', type: 'varchar', length: 64, nullable: true })
    promptVersion!: string | null;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    @ManyToOne(() => SampleCandidate, (candidate) => candidate.summaries, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'candidate_id' })
    candidate!: SampleCandidate;
}
