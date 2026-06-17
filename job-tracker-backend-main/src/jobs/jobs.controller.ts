import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Request() req, @Body() createJobDto: any) {
    return this.jobsService.create(req.user.id, createJobDto);
  }

  @Post('ai-match')
  getAiMatches(@Request() req, @Body() body: { query: string; skills: string[] }) {
    return this.jobsService.getAiMatches(req.user.id, body.query, body.skills);
  }

  @Get()
  findAll(@Request() req) {
    return this.jobsService.findAll(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.jobsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.jobsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateJobDto: any) {
    return this.jobsService.update(id, req.user.id, updateJobDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.jobsService.remove(id, req.user.id);
  }
}
