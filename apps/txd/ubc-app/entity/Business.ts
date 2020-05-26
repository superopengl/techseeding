import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Image } from './Image';
@Entity()
export class Business extends BaseEntity {
    @Column()
    businessName?: string;

    @Column({ nullable: true })
    abn?: string;

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
