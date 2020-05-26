import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({ default: new Date() })
    createdAt: Date;

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    description?: string;
}
