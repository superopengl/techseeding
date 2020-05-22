import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    createdAt: Date;

    @Column()
    createdBy: string;

    @Column()
    fileName: string;

    @Column()
    mine: string;

}