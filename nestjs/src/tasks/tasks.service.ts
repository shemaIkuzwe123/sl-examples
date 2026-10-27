import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Task, TaskStatus } from './entities/task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksDto } from './dto/list-tasks.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

/**
 * In-memory store. Data lives for as long as the server process does —
 * it resets on every restart or redeploy. No database, no env vars.
 */
@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const samples: Array<Pick<Task, 'title' | 'description' | 'status'>> = [
      { title: 'Read the NestJS docs', description: 'Modules, controllers, providers.', status: TaskStatus.Done },
      { title: 'Design the task API', status: TaskStatus.InProgress },
      { title: 'Add a database', status: TaskStatus.Open },
    ];
    samples.forEach((sample) => {
      const task: Task = {
        ...sample,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tasks.set(task.id, task);
    });
  }

  findAll(filter: ListTasksDto = {}): Task[] {
    const needle = filter.q?.toLowerCase();
    return [...this.tasks.values()]
      .filter((task) => {
        if (filter.status && task.status !== filter.status) return false;
        if (needle) {
          const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  create(dto: CreateTaskDto): Task {
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.Open,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, dto: UpdateTaskDto): Task {
    const task = this.findOne(id);
    const updated: Task = {
      id: task.id,
      title: dto.title ?? task.title,
      description: dto.description ?? task.description,
      status: dto.status ?? task.status,
      createdAt: task.createdAt,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    const deleted = this.tasks.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }
}
