import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ name: 'reset_password_token', nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires', nullable: true })
  resetPasswordExpires: Date | null;
}
