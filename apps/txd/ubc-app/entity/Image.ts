import { Entity, Column } from 'typeorm';
import uuid from 'uuid';
import { BaseEntity } from './BaseEntity';

@Entity()
export class Image extends BaseEntity {

    @Column()
    fileName: string;

    @Column()
    mine: string;

    @Column()
    lastAccess: Date;

    @Column({type: 'bytea'})
    base64blob: string;
}


