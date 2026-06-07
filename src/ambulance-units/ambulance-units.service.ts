import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { AmbulanceUnit } from './entities/ambulance-unit.entity';
import { CreateAmbulanceUnitDto } from './dto/create-ambulance-unit.dto';
import { UpdateAmbulanceUnitDto } from './dto/update-ambulance-unit.dto';
import { SearchAmbulanceUnitDto } from './dto/search-ambulance-unit.dto';
import { QueryAmbulanceUnitsDto } from './dto/query-ambulance-units.dto';
import { User, UserRole, UserStatus } from 'src/users/entities/user.entity';

@Injectable()
export class AmbulanceUnitsService {
  constructor(
    @InjectRepository(AmbulanceUnit)
    private readonly ambulanceUnitRepository: Repository<AmbulanceUnit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateAmbulanceUnitDto): Promise<AmbulanceUnit> {
    const members = await this.resolveMembers(dto.memberIds);
    const unit = this.ambulanceUnitRepository.create({
      name: dto.name.trim(),
      members,
    });

    const savedUnit = await this.ambulanceUnitRepository.save(unit);
    await this.syncActiveUnitsForMembers(members);

    return this.findOne(savedUnit.id);
  }

  async findAll(queryDto: QueryAmbulanceUnitsDto = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
      q,
    } = queryDto;

    const currentPage = Math.max(1, page);
    const sanitizedLimit = Math.min(Math.max(1, limit), 100);

    const queryBuilder = this.ambulanceUnitRepository
      .createQueryBuilder('ambulanceUnit')
      .leftJoinAndSelect('ambulanceUnit.members', 'member');

    if (q?.trim()) {
      queryBuilder.andWhere('LOWER(ambulanceUnit.name) LIKE :name', {
        name: `%${q.trim().toLowerCase()}%`,
      });
    }

    const allowedFields = ['name', 'createdAt'];
    const column = allowedFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.addOrderBy(`ambulanceUnit.${column}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

    const skip = (currentPage - 1) * sanitizedLimit;
    queryBuilder.skip(skip).take(sanitizedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      limit: sanitizedLimit,
      totalPages: Math.ceil(total / sanitizedLimit),
    };
  }

  async search(dto: SearchAmbulanceUnitDto): Promise<AmbulanceUnit[]> {
    const { term, limit = 10 } = dto;
    const queryBuilder = this.ambulanceUnitRepository
      .createQueryBuilder('ambulanceUnit')
      .leftJoinAndSelect('ambulanceUnit.members', 'member')
      .orderBy('ambulanceUnit.name', 'ASC')
      .take(limit);

    if (term?.trim()) {
      queryBuilder.andWhere('LOWER(ambulanceUnit.name) LIKE :term', {
        term: `%${term.trim().toLowerCase()}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<AmbulanceUnit> {
    const unit = await this.ambulanceUnitRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!unit) {
      throw new NotFoundException(`Ambulance unit with ID ${id} not found`);
    }

    return unit;
  }

  async update(
    id: string,
    dto: UpdateAmbulanceUnitDto,
  ): Promise<AmbulanceUnit> {
    const unit = await this.findOne(id);
    const previousMemberIds = unit.members.map((member) => member.id);

    if (dto.name !== undefined) {
      unit.name = dto.name.trim();
    }

    if (dto.memberIds !== undefined) {
      unit.members = await this.resolveMembers(dto.memberIds);
    }

    const savedUnit = await this.ambulanceUnitRepository.save(unit);
    await this.syncActiveUnitsForMemberIds([
      ...previousMemberIds,
      ...savedUnit.members.map((member) => member.id),
    ]);

    return this.findOne(savedUnit.id);
  }

  async deleteUnit(id: string): Promise<void> {
    const unit = await this.findOne(id);

    const activeUsersCount = await this.userRepository.count({
      where: { activeAmbulanceUnit: { id } },
    });

    if (activeUsersCount > 0) {
      throw new ConflictException(
        'Cannot delete unit with active associations',
      );
    }

    await this.ambulanceUnitRepository.remove(unit);
  }

  async setActiveUnit(user: User, unitId: string): Promise<User> {
    const authenticatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });

    if (!authenticatedUser) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    if (authenticatedUser.role !== UserRole.AMBULANCE) {
      throw new BadRequestException(
        'Only ambulance users can select an active ambulance unit',
      );
    }

    const selectedUnit = authenticatedUser.ambulanceUnits.find(
      (unit) => unit.id === unitId,
    );

    if (!selectedUnit) {
      throw new BadRequestException(
        'The selected ambulance unit is not assigned to the authenticated user',
      );
    }

    authenticatedUser.activeAmbulanceUnit = selectedUnit;

    return this.userRepository.save(authenticatedUser);
  }

  async resolveActiveUnit(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });

    if (!user) {
      return null;
    }

    return this.ensureConsistentActiveUnit(user);
  }

  private async resolveMembers(memberIds?: string[]): Promise<User[]> {
    if (!memberIds || memberIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(memberIds));
    const members = await this.userRepository.find({
      where: {
        id: In(uniqueIds),
        role: UserRole.AMBULANCE,
        status: UserStatus.ACTIVE,
      },
    });

    if (members.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Every ambulance unit member must be an active ambulance user',
      );
    }

    return members;
  }

  private async syncActiveUnitsForMembers(members: User[]): Promise<void> {
    if (members.length === 0) {
      return;
    }

    await this.syncActiveUnitsForMemberIds(members.map((member) => member.id));
  }

  private async syncActiveUnitsForMemberIds(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const users = await this.userRepository.find({
      where: { id: In(Array.from(new Set(userIds))) },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });

    await Promise.all(users.map((user) => this.ensureConsistentActiveUnit(user)));
  }

  private async ensureConsistentActiveUnit(user: User): Promise<User> {
    if (user.role !== UserRole.AMBULANCE) {
      if (!user.activeAmbulanceUnit) {
        return user;
      }

      user.activeAmbulanceUnit = null;
      return this.userRepository.save(user);
    }

    const hasActiveUnit = user.activeAmbulanceUnit
      ? user.ambulanceUnits.some((unit) => unit.id === user.activeAmbulanceUnit?.id)
      : false;

    if (user.ambulanceUnits.length === 1) {
      user.activeAmbulanceUnit = user.ambulanceUnits[0];
      return this.userRepository.save(user);
    }

    if (!hasActiveUnit) {
      user.activeAmbulanceUnit = null;
      return this.userRepository.save(user);
    }

    return user;
  }
}
