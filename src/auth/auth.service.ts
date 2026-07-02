import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validatePassword(password: string, passwordHash: string) {
    return await bcrypt.compare(password, passwordHash);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    await this.ensureActiveAmbulanceUnit(user);

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return token and user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { accessToken, user: userWithoutPassword };
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
      relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
    });

    if (!user) {
      return null;
    }

    return this.ensureActiveAmbulanceUnit(user);
  }

  private async ensureActiveAmbulanceUnit(user: User): Promise<User> {
    if (user.role !== UserRole.PARAMEDIC) {
      if (user.activeAmbulanceUnit) {
        user.activeAmbulanceUnit = null;
        return this.userRepository.save(user);
      }

      return user;
    }

    const hasActiveUnit = user.activeAmbulanceUnit
      ? user.ambulanceUnits.some(
          (unit) => unit.id === user.activeAmbulanceUnit?.id,
        )
      : false;

    if (user.ambulanceUnits.length === 1) {
      user.activeAmbulanceUnit = user.ambulanceUnits[0];
      return this.userRepository.save(user);
    }

    if (!hasActiveUnit && user.activeAmbulanceUnit) {
      user.activeAmbulanceUnit = null;
      return this.userRepository.save(user);
    }

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Always succeed silently to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await this.userRepository.save(user);

    // TODO: Send email via Zoho SMTP with reset link
    // For now, log the token in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset token for ${email}: ${token}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with valid reset token
    const users = await this.userRepository.find({
      where: {
        passwordResetToken: Not(IsNull()),
        passwordResetExpiresAt: MoreThan(new Date()),
      },
    });

    let user: User | null = null;
    for (const u of users) {
      if (
        u.passwordResetToken &&
        (await bcrypt.compare(token, u.passwordResetToken))
      ) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await this.userRepository.save(user);
  }
}
