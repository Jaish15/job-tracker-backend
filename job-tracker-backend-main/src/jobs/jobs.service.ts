import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async create(userId: number, createJobDto: any): Promise<Job> {
    const job = this.jobsRepository.create({
      ...createJobDto,
      userId,
    } as Job);
    return this.jobsRepository.save(job);
  }

  async findAll(userId: number): Promise<Job[]> {
    return this.jobsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: number): Promise<Job> {
    const job = await this.jobsRepository.findOne({ where: { id, userId } });
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }
    return job;
  }

  async update(id: string, userId: number, updateJobDto: any): Promise<Job> {
    const job = await this.findOne(id, userId);
    
    // Merge updates
    Object.assign(job, updateJobDto);
    return this.jobsRepository.save(job);
  }

  async remove(id: string, userId: number): Promise<void> {
    const job = await this.findOne(id, userId);
    await this.jobsRepository.remove(job);
  }

  async getStats(userId: number): Promise<any> {
    const jobs = await this.findAll(userId);
    
    const stats = {
      total: jobs.length,
      byStatus: {
        wishlist: 0,
        applied: 0,
        phone_screen: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        accepted: 0,
        withdrawn: 0,
      }
    };

    jobs.forEach(job => {
      if (stats.byStatus[job.status] !== undefined) {
        stats.byStatus[job.status]++;
      }
    });

    return stats;
  }

  async getAiMatches(userId: number, query: string, userSkills: string[]): Promise<any[]> {
    const defaultJobs = [
      {
        company: 'Google',
        title: 'Senior Frontend Engineer',
        location: 'San Francisco, CA (Hybrid)',
        salary: '$160,000 - $210,000',
        description: 'Lead modern user interface developments for core search experiences. Work with React, TypeScript, and high-performance layout architectures.',
        requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Redux', 'Webpack'],
        whyFit: 'You have strong credentials in UI frameworks and browser styling standardizations.',
        coverLetterHook: 'Dear Google Team, I am thrilled to apply for the Senior Frontend role. With my background in high-performance React architectures and modular interface designs, I am confident in my ability to elevate your search experience standards.'
      },
      {
        company: 'Stripe',
        title: 'Full Stack Developer',
        location: 'Remote (US/Canada)',
        salary: '$140,000 - $180,000',
        description: 'Build secure, scalable payment API infrastructure and merchant dashboard elements. Connect frontend React UI directly with microservice backend REST endpoints.',
        requiredSkills: ['Node.js', 'React', 'JavaScript', 'PostgreSQL', 'API Design', 'Docker', 'Ruby'],
        whyFit: 'Your full-stack capabilities with NestJS/Node and React align directly with Stripe\'s ecosystem.',
        coverLetterHook: 'Dear Stripe Recruiting, I am writing to express my interest in the Full Stack Developer role. Having built secure, scalable NestJS APIs integrated with React frontends, I am excited to help expand Stripe\'s payment interface and dashboard architectures.'
      },
      {
        company: 'Amazon',
        title: 'DevOps & Systems Engineer',
        location: 'Seattle, WA (On-site)',
        salary: '$150,000 - $190,000',
        description: 'Maintain high availability for critical retail services. Drive containerization, cloud configuration automation, and continuous delivery operations.',
        requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Bash', 'Python'],
        whyFit: 'You possess solid automation foundations with Docker, Linux systems, and cloud architectures.',
        coverLetterHook: 'Dear Amazon Team, I am writing to apply for the DevOps position. My hands-on experience automated deployment workflows, scaling container applications via Docker, and managing Linux infrastructure makes me an ideal fit for your retail systems team.'
      },
      {
        company: 'Meta',
        title: 'Mobile UI Specialist',
        location: 'New York, NY (Hybrid)',
        salary: '$170,000 - $220,000',
        description: 'Shape the future of virtual and mobile connections. Standardize cross-platform designs and micro-animations for social application threads.',
        requiredSkills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Figma', 'CSS', 'Git'],
        whyFit: 'Your expertise in mobile design tokens and CSS-in-JS transitions is key for client UI.',
        coverLetterHook: 'Dear Meta Team, I am extremely excited to apply for the Mobile UI Specialist position. My background crafting fluid mobile interfaces, paired with deep skills in React systems and responsive styling, matches your requirements perfectly.'
      },
      {
        company: 'Netflix',
        title: 'Senior Backend Architect',
        location: 'Los Gatos, CA (Hybrid)',
        salary: '$200,000 - $280,000',
        description: 'Optimize high-throughput streaming server endpoints and caching layers. Implement relational schemas and robust data security guidelines.',
        requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'GraphQL'],
        whyFit: 'Your expertise building relational database schemas and scalable TypeScript backends aligns with our scale.',
        coverLetterHook: 'Dear Netflix Engineering Team, I am excited to submit my application for the Backend Architect role. My experience building robust, high-performance TypeScript APIs, design patterns, and PostgreSQL database logic aligns directly with your scaling initiatives.'
      },
      {
        company: 'Airbnb',
        title: 'Frontend React Engineer',
        location: 'Remote (US)',
        salary: '$130,000 - $170,000',
        description: 'Deliver pixel-perfect booking platforms and customer onboarding systems. Partner closely with product designers to implement custom CSS layouts.',
        requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'Figma', 'Git', 'Testing'],
        whyFit: 'You have solid frontend skills in React, responsive CSS styles, and collaborative prototyping tools.',
        coverLetterHook: 'Dear Airbnb Recruiting, I am writing to apply for the Frontend React Engineer position. As someone who enjoys creating beautiful, responsive user interfaces and modular layouts, I would love to bring my React skills to your booking product team.'
      },
      {
        company: 'Spotify',
        title: 'Machine Learning Engineer',
        location: 'Boston, MA (Hybrid)',
        salary: '$150,000 - $200,000',
        description: 'Build predictive content recommendation engines and data-processing pipelines. Scale machine learning models for millions of listeners.',
        requiredSkills: ['Python', 'SQL', 'Docker', 'AWS', 'Git', 'pandas', 'numpy'],
        whyFit: 'Your foundations in analytical SQL queries and Python-based utilities align with our data tasks.',
        coverLetterHook: 'Dear Spotify Team, I am thrilled to apply for the ML position. My background designing data processing pipelines and applying analytics over structured databases matches your data engineering focus.'
      }
    ];

    // Normalize user skills
    const normalizedUserSkills = (userSkills || []).map(s => s.toLowerCase().trim());

    // Process matching scores and skills mapping
    const matches = defaultJobs.map(job => {
      const matchingSkills: string[] = [];
      const missingSkills: string[] = [];

      job.requiredSkills.forEach(skill => {
        if (normalizedUserSkills.includes(skill.toLowerCase().trim())) {
          matchingSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      });

      // Calculate score based on matching ratio
      const matchScore = job.requiredSkills.length > 0 
        ? Math.round((matchingSkills.length / job.requiredSkills.length) * 100)
        : 0;

      return {
        ...job,
        matchScore,
        matchingSkills,
        missingSkills,
      };
    });

    // Filter by query if provided
    let filteredMatches = matches;
    if (query && query.trim().length > 0) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      filteredMatches = matches.filter(job => {
        const text = `${job.company} ${job.title} ${job.description} ${job.requiredSkills.join(' ')}`.toLowerCase();
        return searchTerms.some(term => text.includes(term));
      });
    }

    // Sort by match score (highest first)
    return filteredMatches.sort((a, b) => b.matchScore - a.matchScore);
  }
}
