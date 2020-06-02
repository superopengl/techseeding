import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';

@Entity()
export class SysLog {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({ default: new Date() })
    createdAt?: Date;

    @Column({ default: 'system' })
    createdBy?: string;

    @Column({ default: 'info' })
    level?: string;

    @Column()
    data: string;
}


