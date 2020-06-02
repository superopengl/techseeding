import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Picture } from './Picture';

@Entity()
export class Poster {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: new Date() })
    createdAt: Date;

    @Column()
    createdBy: string;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    ordinal: number;

    @OneToOne(() => Picture, {cascade: true})
    @JoinColumn()
    image: Picture;
}


