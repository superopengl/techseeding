import { Entity, Column, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Image } from './Image';
@Entity()
export class Event {
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
    when: Date;

    @Column({ nullable: true })
    cap: number;

    @Column({ nullable: true })
    location?: string;

    @Column({ nullable: true })
    ordinal: number;

    @OneToOne(() => Image, {cascade: true})
    @JoinColumn()
    image: Image;
}
