import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const passwordHash = await this.encryptPassword(createUserDto.password);
    user.passwordHash = passwordHash;
    const savedUser = await this.userRepository.save(user);

    return savedUser;
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
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
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

    Object.assign(user, updateData);

    const updatedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
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

  private applyFilters(
    queryBuilder: SelectQueryBuilder<User>,
    filters: Partial<QueryUserDto>,
  ): void {
    console.log(filters);

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
    const direction = sortOrder;

    switch (sortBy) {
      case 'fullName':
        qb.addOrderBy('user.firstName', direction);
        qb.addOrderBy('user.lastName', direction);
        break;

      default:
        qb.addOrderBy(`user.${sortBy}`, direction);
    }
  }
}
