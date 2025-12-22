import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('search')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  search(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: SearchUserDto,
  ) {
    return this.usersService.search(query);
  }

  @Get()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: QueryUserDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  activate(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
}
