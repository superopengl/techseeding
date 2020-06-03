import { Entity, Column, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Image } from './Image';
@Entity()
export class Business {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: new Date() })
    createdAt: Date;

    @Column()
    createdBy: string;

    @Column()
    businessName?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    abn?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    suburb?: string;

    @Column({ nullable: true })
    website?: string;

    @Column({ nullable: true })
    ordinal: number;

    @OneToOne(() => Image)
    @JoinColumn()
    image: Image;
}


