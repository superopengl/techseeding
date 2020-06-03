import { Entity, Column, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Image } from './Image';
@Entity()
export class Business {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({ default: new Date() })
    createdAt?: Date;

    @Column({ default: 'system' })
    createdBy?: string;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    group: string;

    @Column({ nullable: true })
    website?: string;

    @Column({ nullable: true })
    ordinal?: number;

    @Column({ type: 'uuid' })
    imageId: Image;
}


