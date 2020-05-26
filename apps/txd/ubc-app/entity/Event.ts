import { Entity, Column, OneToOne } from 'typeorm';
import { Image } from './Image';
import { BaseEntity } from './BaseEntity';
@Entity()
export class Event extends BaseEntity {
    @Column({ nullable: true })
    when: Date;
    @Column({ nullable: true })
    cap: number;
    @Column({ nullable: true })
    title?: string;
    @Column({ nullable: true })
    phone?: string;
    @Column({ nullable: true })
    email?: string;
    @Column({ nullable: true })
    address?: string;
    @Column({ nullable: true })
    website?: string;
    @Column({ nullable: true })
    facebook?: string;
    @Column({ nullable: true })
    wechat?: string;
    @Column({ nullable: true })
    insgram?: string;
    @Column({ nullable: true })
    twitter?: string;
    @Column({ type: 'uuid' })
    @OneToOne(type => Image)
    imageId: string;
}
