import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Image } from './Image';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Poster extends BaseEntity {
    @Column({ nullable: true })
    ordinal: number;

    @Column({ nullable: true })
    title?: string;

    @Column({ type: 'uuid' })
    @OneToOne(type => Image)
    imageId: string;
}


@Entity()
export class GalleryPicture extends BaseEntity {
    @Column({ nullable: true })
    ordinal: number;
    
    @Column({ nullable: true })
    when: Date;

    @Column({ nullable: true })
    title?: string;

    @Column({ type: 'uuid' })
    @OneToOne(type => Image)
    imageId: string;
}