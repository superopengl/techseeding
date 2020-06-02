import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Picture } from './Picture';
@Entity()
export class Gallery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: new Date() })
  createdAt?: Date;

  @Column({default: 'system'})
  createdBy?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  ordinal?: number;

  @Column({ nullable: true })
  when?: Date;

  @OneToOne(type => Picture, {cascade: true})
  @JoinColumn()
  image: Picture;
}
