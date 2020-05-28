import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Image } from './Image';

@Entity()
export class SysLog {
    @PrimaryGeneratedColumn('uuid')
    id?: number;

    @Column({ default: new Date() })
    createdAt?: Date;

    @Column({ default: 'system' })
    createdBy?: string;

    @Column({ default: 'info' })
    level?: string;

    @Column()
    data: string;
}


