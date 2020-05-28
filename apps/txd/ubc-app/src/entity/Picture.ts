import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Picture {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ default: new Date() })
    createdAt: Date;
    @Column()
    createdBy: string;
    @Column()
    fileName: string;
    @Column()
    mine: string;
    @Column()
    lastAccess: Date;
    @Column({ type: 'bytea' })
    base64data: string;
}
