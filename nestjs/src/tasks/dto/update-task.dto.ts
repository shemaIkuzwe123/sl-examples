import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto.js';

/** All fields optional — PATCH semantics. */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
