import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Picture {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ default: new Date() })
  createdAt?: Date;

  @Column({ default: 'system' })
  createdBy?: string;

  @Column()
  fileName: string;

  @Column()
  mine: string;

  @Column({default: new Date()})
  lastAccess?: Date;

  @Column()
  location: string;
}
