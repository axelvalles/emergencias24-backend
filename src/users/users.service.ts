import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { applyGlobalSearch } from '../common/query/apply-global-search';
import * as bcrypt from 'bcrypt';
import { AmbulanceUnit } from 'src/ambulance-units/entities/ambulance-unit.entity';

const USER_SORT_COLUMN_MAP: Record<string, string[]> = {
  createdAt: ['user.createdAt'],
  updatedAt: ['user.updatedAt'],
  firstName: ['user.firstName'],
  lastName: ['user.lastName'],
  email: ['user.email'],
  role: ['user.role'],
  status: ['user.status'],
  fullName: ['user.firstName', 'user.lastName'],
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AmbulanceUnit)
    private readonly ambulanceUnitRepository: Repository<AmbulanceUnit>,
  ) {}

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const passwordHash = await this.encryptPassword(createUserDto.password);
    user.passwordHash = passwordHash;
    user.ambulanceUnits = await this.resolveAmbulanceUnits(
      createUserDto.ambulanceUnitIds,
    );
    this.syncAmbulanceRoleState(user);
    const savedUser = await this.userRepository.save(user);

    return this.findOneOrFail(savedUser.id);
  }

  async search(searchDto: SearchUserDto): Promise<User[]> {
    const { term, role, limit = 10 } = searchDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (term) {
      const searchTerm = `%${term.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(user.email) LIKE :term OR LOWER(CONCAT(user.firstName, " ", user.lastName)) LIKE :term)',
        { term: searchTerm },
      );
    }

    if (role) {
      const roles = Array.isArray(role) ? role : [role];
      queryBuilder.andWhere('user.role IN (:...roles)', { roles });
    }

    queryBuilder.andWhere('user.status = :status', {
      status: UserStatus.ACTIVE,
    });

    queryBuilder.select([
      'user.id',
      'user.firstName',
      'user.lastName',
      'user.email',
      'user.role',
    ]);

    queryBuilder.take(limit);

    return queryBuilder.getMany();
  }

  async findAll(queryDto: QueryUserDto = {}): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...filters
    } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Aplicar filtros
    this.applyFilters(queryBuilder, filters);

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    queryBuilder.select([
      'user.id',
      'user.firstName',
      'user.lastName',
      'user.phone',
      'user.email',
      'user.role',
      'user.status',
      'user.createdAt',
      'user.updatedAt',
      'user.lastLogin',
    ]);
    queryBuilder.leftJoinAndSelect('user.ambulanceUnits', 'ambulanceUnits');
    queryBuilder.leftJoinAndSelect(
      'user.activeAmbulanceUnit',
      'activeAmbulanceUnit',
    );

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) {
      return null;
    }

    const { password, ...updateData } = updateUserDto;

    if (password) {
      const passwordHash = await this.encryptPassword(password);
      user.passwordHash = passwordHash;
    }

    if (updateUserDto.ambulanceUnitIds !== undefined) {
      user.ambulanceUnits = await this.resolveAmbulanceUnits(
        updateUserDto.ambulanceUnitIds,
      );
    }

    Object.assign(user, updateData);
    this.syncAmbulanceRoleState(user);

    const updatedUser = await this.userRepository.save(user);

    return this.findOneOrFail(updatedUser.id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async activateUser(id: string): Promise<User | null> {
    await this.userRepository.update(id, { status: UserStatus.ACTIVE });
    return this.findOne(id);
  }

  async deactivateUser(id: string): Promise<User | null> {
    await this.userRepository.update(id, { status: UserStatus.INACTIVE });
    return this.findOne(id);
  }

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }

    return user;
  }

  private async resolveAmbulanceUnits(
    ambulanceUnitIds?: string[],
  ): Promise<AmbulanceUnit[]> {
    if (!ambulanceUnitIds || ambulanceUnitIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(ambulanceUnitIds));
    const units = await this.ambulanceUnitRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (units.length !== uniqueIds.length) {
      throw new BadRequestException('One or more ambulance units do not exist');
    }

    return units;
  }

  private syncAmbulanceRoleState(user: User): void {
    if (user.role !== UserRole.PARAMEDIC) {
      user.ambulanceUnits = [];
      user.activeAmbulanceUnit = null;
      return;
    }

    const assignedUnits = user.ambulanceUnits ?? [];

    if (assignedUnits.length === 1) {
      user.activeAmbulanceUnit = assignedUnits[0];
      return;
    }

    if (
      !user.activeAmbulanceUnit ||
      !assignedUnits.some((unit) => unit.id === user.activeAmbulanceUnit?.id)
    ) {
      user.activeAmbulanceUnit = null;
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<User>,
    filters: Partial<QueryUserDto>,
  ): void {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: [
        'user.firstName',
        'user.lastName',
        "CONCAT(user.firstName, ' ', user.lastName)",
        'user.email',
        'user.phone',
      ],
      paramName: 'userSearch',
    });

    if (filters.fullName) {
      const fullName = filters.fullName.trim().toLowerCase();

      queryBuilder.andWhere(
        `
        (
          LOWER(user.firstName) LIKE :fullName
          OR LOWER(user.lastName) LIKE :fullName
          OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE :fullName
        )
      `,
        { fullName: `%${fullName}%` },
      );
    }

    if (filters.email) {
      const email = filters.email.trim().toLowerCase();

      queryBuilder.andWhere(
        `
      (
        LOWER(user.email) LIKE :email
      )
    `,
        { email: `%${email}%` },
      );
    }

    if (filters.phone) {
      const phone = filters.phone.trim().toLowerCase();

      queryBuilder.andWhere(
        `
      (
        LOWER(user.phone) LIKE :phone
      )
    `,
        { phone: `%${phone}%` },
      );
    }

    if (filters.role && filters.role.length > 0) {
      queryBuilder.andWhere('user.role IN (:...role)', {
        role: filters.role,
      });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('user.status IN (:...status)', {
        status: filters.status,
      });
    }
  }

  private applySorting(
    qb: SelectQueryBuilder<User>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const safeSortBy = sortBy || 'createdAt';
    const sortColumns = USER_SORT_COLUMN_MAP[safeSortBy];

    if (!sortColumns) {
      throw new BadRequestException(
        `Invalid sortBy value. Allowed values: ${Object.keys(USER_SORT_COLUMN_MAP).join(', ')}`,
      );
    }

    for (const sortColumn of sortColumns) {
      qb.addOrderBy(sortColumn, sortOrder);
    }
  }
}
