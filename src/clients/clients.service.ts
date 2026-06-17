import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(userId: string, dto: CreateClientDto): Promise<Client> {
    const existing = await this.clientsRepository.findOne({
      where: { user_id: userId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Ya existe un cliente con ese nombre');
    }
    const client = this.clientsRepository.create({
      ...dto,
      user_id: userId,
    });
    return this.clientsRepository.save(client);
  }

  async findAll(userId: string): Promise<Client[]> {
    return this.clientsRepository.find({
      where: { user_id: userId, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Client | null> {
    return this.clientsRepository.findOne({
      where: { id, user_id: userId },
    });
  }
}
