import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddCandidateDocumentsAndSummaries1710000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create candidate_documents table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_documents',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'candidate_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'document_type',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'file_name',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'storage_key',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'raw_text',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_documents',
            new TableForeignKey({
                name: 'fk_candidate_documents_candidate_id',
                columnNames: ['candidate_id'],
                referencedTableName: 'sample_candidates',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'candidate_documents',
            new TableIndex({
                name: 'idx_candidate_documents_candidate_id',
                columnNames: ['candidate_id'],
            }),
        );

        // Create candidate_summaries table
        await queryRunner.createTable(
            new Table({
                name: 'candidate_summaries',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'candidate_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '32',
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'score',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'strengths',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'concerns',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'summary',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'recommended_decision',
                        type: 'varchar',
                        length: '32',
                        isNullable: true,
                    },
                    {
                        name: 'provider',
                        type: 'varchar',
                        length: '64',
                        isNullable: true,
                    },
                    {
                        name: 'prompt_version',
                        type: 'varchar',
                        length: '64',
                        isNullable: true,
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'candidate_summaries',
            new TableForeignKey({
                name: 'fk_candidate_summaries_candidate_id',
                columnNames: ['candidate_id'],
                referencedTableName: 'sample_candidates',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'candidate_summaries',
            new TableIndex({
                name: 'idx_candidate_summaries_candidate_id',
                columnNames: ['candidate_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_id');
        await queryRunner.dropForeignKey('candidate_summaries', 'fk_candidate_summaries_candidate_id');
        await queryRunner.dropTable('candidate_summaries');

        await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');
        await queryRunner.dropForeignKey('candidate_documents', 'fk_candidate_documents_candidate_id');
        await queryRunner.dropTable('candidate_documents');
    }
}
