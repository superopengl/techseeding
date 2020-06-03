import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ default: new Date() })
  createdAt?: Date;

  @Column({ default: 'system' })
  createdBy?: string;

  @Column()
  fileName: string;

  @Column()
  mime: string;

  @Column({default: new Date()})
  lastAccess?: Date;

  @Column()
  location: string;

  @Column()
  md5: string;
}
