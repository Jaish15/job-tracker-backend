import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  jobUrl: string;

  @Column({ nullable: true })
  salary: string;

  @Column({ default: 'wishlist' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  appliedDate: string;

  @Column({ nullable: true })
  interviewDate: string;

  @Column({ nullable: true })
  offerDate: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
